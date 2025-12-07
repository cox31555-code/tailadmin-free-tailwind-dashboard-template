import ApexCharts from "apexcharts";

// ===== chartTwo - Bar Chart for Product Types
const chart02 = async () => {
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

  // Get last 7 days with full dates
  const getLast7DaysWithDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    return dates;
  };

  const loadOrdersData = async () => {
    try {
      const ordersDataStr = localStorage.getItem('ordersData');
      if (ordersDataStr) {
        return JSON.parse(ordersDataStr);
      }

      const paths = ['/data/orders.json', './data/orders.json', 'data/orders.json'];
      let response;
      let lastError;

      for (const path of paths) {
        try {
          response = await fetch(path, { cache: 'no-cache' });
          if (response.ok) {
            const orders = await response.json();
            localStorage.setItem('ordersData', JSON.stringify(orders));
            console.log('Chart-02: Orders loaded from', path);
            return orders;
          }
        } catch (e) {
          lastError = e;
          continue;
        }
      }

      throw lastError || new Error('All fetch paths failed');
    } catch (error) {
      console.warn('Chart-02: Failed to load orders data:', error);
      return [];
    }
  };

  // Count orders by type for each day in the past 7 days
  const getOrdersDataBySeries = async () => {
    const orders = await loadOrdersData();
    const last7Days = getLast7DaysWithDates();

    const annualCounts = [];
    const temporaryCounts = [];
    const impoundCounts = [];

    last7Days.forEach((dayDate) => {
      let annualCount = 0;
      let temporaryCount = 0;
      let impoundCount = 0;

      orders.forEach((order) => {
        try {
          const orderDate = new Date(order.date);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === dayDate.getTime()) {
            if (order.type === 'annual') {
              annualCount++;
            } else if (order.type === 'temporary') {
              temporaryCount++;
            } else if (order.type === 'impound') {
              impoundCount++;
            }
          }
        } catch (e) {
          console.warn('Failed to parse order date:', order.date);
        }
      });

      annualCounts.push(annualCount);
      temporaryCounts.push(temporaryCount);
      impoundCounts.push(impoundCount);
    });

    return [
      {
        name: "Annual",
        data: annualCounts,
      },
      {
        name: "Temporary",
        data: temporaryCounts,
      },
      {
        name: "Impound",
        data: impoundCounts,
      },
    ];
  };

  const series = await getOrdersDataBySeries();

  const chartTwoOptions = {
    series: series,
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
        columnWidth: "80%",
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
