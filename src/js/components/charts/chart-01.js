import ApexCharts from "apexcharts";
import { getLondonNow } from "../../utils/londonTime.js";
import { ensureOrdersDataComplete } from "../../utils/orders-data-sync.js";
import { onOrdersDataUpdated } from "../../utils/orders-data-store.js";
import { buildMonthlyCounts, getAllPolicies, getComputedData } from "../../utils/dashboard-data.js";

let chartOneInstance = null;

const getMonthlySalesData = async () => {
  await ensureOrdersDataComplete();

  const year = getLondonNow().getFullYear();
  return getComputedData(`chart01:monthly:${year}`, () => {
    const policies = getAllPolicies();
    return buildMonthlyCounts(policies, (p) => p.policyStart || p.date, year);
  });
};

const renderChart = async () => {
  const chartSelector = document.querySelectorAll("#chartOne");
  if (!chartSelector.length) return;

  const monthlySalesData = await getMonthlySalesData();

  const chartOneOptions = {
    series: [
      {
        name: "Orders",
        data: monthlySalesData,
      },
    ],
    colors: ["#0388FF"],
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
        columnWidth: "50%",
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
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
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

  if (chartOneInstance) {
    chartOneInstance.updateOptions(chartOneOptions, false, true);
  } else {
    chartOneInstance = new ApexCharts(document.querySelector("#chartOne"), chartOneOptions);
    chartOneInstance.render();
  }
};

// ===== chartOne
const chart01 = async () => {
  await renderChart();

  // Live updates when tables mutate (same tab + cross tab)
  onOrdersDataUpdated(async () => {
    await renderChart();
  });
};

export default chart01;
