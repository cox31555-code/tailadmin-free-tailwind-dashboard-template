import ApexCharts from "apexcharts";
import { parseDateAsLondon, getLondonNow } from "../../utils/londonTime.js";

// ===== chartOne
const chart01 = async () => {
  const parseDate = (dateStr) => {
    return parseDateAsLondon(dateStr);
  };

  const loadOrdersData = async () => {
    try {
      const pages = ['/annual.html', '/temporary.html', '/impound.html'];
      const allOrders = [];

      for (const page of pages) {
        try {
          const response = await fetch(page, { cache: 'no-cache' });
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const rows = doc.querySelectorAll('table tbody tr');
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const dateElement = cells[0]?.querySelector('p:first-child');
              const dateText = dateElement?.textContent?.trim() || '';
              if (dateText) {
                allOrders.push({
                  date: dateText,
                });
              }
            }
          });
        } catch (e) {
          console.warn(`Failed to fetch ${page}:`, e);
        }
      }

      return allOrders;
    } catch (error) {
      console.warn('Chart-01: Failed to load orders:', error);
      return [];
    }
  };

  // Get current year in London timezone
  const currentYear = getLondonNow().getFullYear();

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
      labels: {
        style: {
          fontSize: '13px',
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
          fontSize: '13px',
        },
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: '#e5e7eb',
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
      theme: 'dark',
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
