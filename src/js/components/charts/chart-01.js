import ApexCharts from "apexcharts";

// ===== chartOne
const chart01 = async () => {
  const loadOrdersData = async () => {
    try {
      const ordersDataStr = localStorage.getItem('ordersData');
      if (ordersDataStr) {
        return JSON.parse(ordersDataStr);
      }

      const response = await fetch('/data/orders.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const orders = await response.json();
      localStorage.setItem('ordersData', JSON.stringify(orders));
      console.log('Chart-01: Orders loaded successfully');
      return orders;
    } catch (error) {
      console.warn('Chart-01: Failed to load orders data:', error);
      return [];
    }
  };

  // Get current year
  const currentYear = new Date().getFullYear();

  // Count orders by month
  const getMonthlyOrderCounts = async () => {
    const orders = await loadOrdersData();
    const monthlyCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 12 months

    orders.forEach((order) => {
      try {
        const orderDate = new Date(order.date);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();

        // Count orders from current year
        if (orderYear === currentYear) {
          monthlyCounts[orderMonth]++;
        }
      } catch (e) {
        console.warn('Failed to parse order date:', order.date);
      }
    });

    return monthlyCounts;
  };

  const monthlySalesData = await getMonthlyOrderCounts();

  const chartOneOptions = {
    series: [
      {
        name: "Orders",
        data: monthlySalesData,
      },
    ],
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
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
          return val + " orders";
        },
      },
    },
  };

  const chartSelector = document.querySelectorAll("#chartOne");

  if (chartSelector.length) {
    const chartFour = new ApexCharts(
      document.querySelector("#chartOne"),
      chartOneOptions,
    );
    chartFour.render();
  }
};

export default chart01;
