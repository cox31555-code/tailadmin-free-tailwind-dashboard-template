import ApexCharts from "apexcharts";

// ===== chartOne
const chart01 = async () => {
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    try {
      const parts = dateStr.trim().split(/\s+/);
      if (parts.length === 3) {
        const monthStr = parts[0];
        const dayStr = parts[1].replace(',', '');
        const yearStr = parts[2];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.indexOf(monthStr);

        if (monthIndex !== -1 && dayStr && yearStr) {
          const date = new Date(yearStr, monthIndex, dayStr);
          date.setHours(0, 0, 0, 0);
          return date;
        }
      }
    } catch (e) {
      console.warn('Chart-01: Failed to parse date:', dateStr, e);
    }

    return null;
  };

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
      const orderDate = parseDate(order.date);

      if (orderDate === null) {
        console.warn('Chart-01: Could not parse order date:', order.date);
        return;
      }

      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      // Count orders from current year
      if (orderYear === currentYear) {
        monthlyCounts[orderMonth]++;
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
