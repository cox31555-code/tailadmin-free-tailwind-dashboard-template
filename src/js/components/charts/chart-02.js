import ApexCharts from "apexcharts";

// ===== chartTwo - Bar Chart for Product Types
const chart02 = async () => {
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
      console.warn('Chart-02: Failed to parse date:', dateStr, e);
    }

    return null;
  };

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
            if (cells.length >= 3) {
              const dateText = cells[0]?.textContent?.trim() || '';
              if (dateText) {
                allOrders.push({
                  date: dateText,
                  type: page.includes('annual') ? 'annual' : page.includes('temporary') ? 'temporary' : 'impound',
                });
              }
            }
          });
        } catch (e) {
          // Continue if one page fails
        }
      }

      return allOrders;
    } catch (error) {
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
        const orderDate = parseDate(order.date);

        if (orderDate === null) {
          console.warn('Chart-02: Could not parse order date:', order.date);
          return;
        }

        if (orderDate.getTime() === dayDate.getTime()) {
          if (order.type === 'annual') {
            annualCount++;
          } else if (order.type === 'temporary') {
            temporaryCount++;
          } else if (order.type === 'impound') {
            impoundCount++;
          }
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
