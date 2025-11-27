import ApexCharts from "apexcharts";

// ===== chartTwo - Bar Chart for Product Types
const chart02 = () => {
  // Generate last 7 days labels (simple day names only)
  const getLast7Days = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(dayNames[date.getDay()]);
    }

    return days;
  };

  const chartTwoOptions = {
    series: [
      {
        name: "Annual",
        data: [32, 38, 41, 39, 37, 35, 42],
      },
      {
        name: "Temporary",
        data: [18, 22, 19, 25, 21, 19, 28],
      },
      {
        name: "Impound",
        data: [12, 15, 14, 17, 16, 14, 19],
      },
    ],
    colors: ["#465fff", "#10B981", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 335,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
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
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      markers: {
        radius: 99,
      },
    },
    yaxis: {
      title: false,
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: function (val) {
          return val + " orders";
        },
      },
    },
  };

  const chartSelector = document.querySelectorAll("#chartTwo");

  if (chartSelector.length) {
    const chartTwo = new ApexCharts(
      document.querySelector("#chartTwo"),
      chartTwoOptions,
    );
    chartTwo.render();
  }
};

export default chart02;
