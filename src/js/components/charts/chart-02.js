import ApexCharts from "apexcharts";
import { getLondonToday, parseDateAsLondon } from "../../utils/londonTime.js";
import { ensureOrdersDataComplete } from "../../utils/orders-data-sync.js";
import { onOrdersDataUpdated } from "../../utils/orders-data-store.js";
import { getActivePolicies, getComputedData } from "../../utils/dashboard-data.js";

let chartTwoInstance = null;

const parseDate = (dateStr) => {
  return parseDateAsLondon(dateStr);
};

// Generate last 7 days labels (simple day names only) in London timezone
const getLast7Days = () => {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = getLondonToday();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(dayNames[date.getDay()]);
  }

  return days;
};

// Get last 7 days with full dates in London timezone
const getLast7DaysWithDates = () => {
  const dates = [];
  const today = getLondonToday();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
};

const getOrdersSeries = async () => {
  await ensureOrdersDataComplete();

  return getComputedData("chart02:series", () => {
    const policies = getActivePolicies();
    const last7Days = getLast7DaysWithDates();

    const annualCounts = [];
    const temporaryCounts = [];
    const impoundCounts = [];

    last7Days.forEach((dayDate) => {
      let annualCount = 0;
      let temporaryCount = 0;
      let impoundCount = 0;

      policies.forEach((policy) => {
        const dateStr = policy.policyStart || policy.date;
        const policyDate = parseDate(dateStr);
        if (!policyDate) return;

        if (policyDate.getTime() === dayDate.getTime()) {
          if (policy.type === "annual") annualCount++;
          else if (policy.type === "temporary") temporaryCount++;
          else if (policy.type === "impound") impoundCount++;
        }
      });

      annualCounts.push(annualCount);
      temporaryCounts.push(temporaryCount);
      impoundCounts.push(impoundCount);
    });

    return [
      { name: "Annual", data: annualCounts },
      { name: "Temporary", data: temporaryCounts },
      { name: "Impound", data: impoundCounts },
    ];
  });
};

const renderChart = async () => {
  const chartSelector = document.querySelectorAll("#chartTwo");
  if (!chartSelector.length) return;

  const series = await getOrdersSeries();

  const chartTwoOptions = {
    series,
    colors: ["#0388FF", "#10B981", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "65%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: getLast7Days(),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      title: false,
      labels: {
        style: {
          fontSize: "13px",
        },
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#e5e7eb",
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: function (val) {
          return val + " orders";
        },
      },
      theme: "dark",
    },
  };

  if (chartTwoInstance) {
    chartTwoInstance.updateOptions(chartTwoOptions, false, true);
  } else {
    chartTwoInstance = new ApexCharts(document.querySelector("#chartTwo"), chartTwoOptions);
    chartTwoInstance.render();
  }
};

// ===== chartTwo
const chart02 = async () => {
  await renderChart();

  onOrdersDataUpdated(async () => {
    await renderChart();
  });
};

export default chart02;
