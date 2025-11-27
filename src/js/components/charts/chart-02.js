import ApexCharts from "apexcharts";

// ===== chartTwo - Bar Chart for Product Types
const chart02 = () => {
  const chartTwoOptions = {
    series: [
      {
        name: "Annual",
        data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
      },
      {
        name: "Temporary",
        data: [95, 142, 178, 156, 201, 187, 165, 203, 189, 225, 198, 167],
      },
      {
        name: "Impound",
        data: [78, 95, 112, 89, 134, 145, 121, 158, 143, 167, 154, 129],
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
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
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
          return "$" + val + "K";
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
