import ApexCharts from "apexcharts";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
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
    // Silently fail
  }
  return null;
};

const getMonthsData = (data) => {
  const monthCounts = {
    'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
    'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
  };

  data.forEach(item => {
    const date = parseDate(item.date);
    if (date) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[date.getMonth()];
      if (monthName) {
        monthCounts[monthName]++;
      }
    }
  });

  return Object.values(monthCounts);
};

const loadQuotesData = async () => {
  try {
    const response = await fetch('/quotes.html', { cache: 'no-cache' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const quotes = [];
    const rows = doc.querySelectorAll('table tbody tr');

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const dateElement = cells[0]?.querySelector('p:first-child');
        const dateText = dateElement?.textContent?.trim() || '';

        if (dateText) {
          quotes.push({
            date: dateText,
          });
        }
      }
    });

    return quotes;
  } catch (error) {
    console.warn('Failed to fetch quotes:', error);
    return [];
  }
};

const loadSalesData = async () => {
  try {
    const pages = ['/annual.html', '/temporary.html', '/impound.html'];
    const allSales = [];

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
              allSales.push({
                date: dateText,
              });
            }
          }
        });
      } catch (e) {
        console.warn(`Failed to fetch ${page}:`, e);
      }
    }

    return allSales;
  } catch (error) {
    console.warn('Failed to fetch sales:', error);
    return [];
  }
};

const chart03 = async () => {
  const [quotesData, salesData] = await Promise.all([
    loadQuotesData(),
    loadSalesData()
  ]);

  const quotesMonthly = getMonthsData(quotesData);
  const salesMonthly = getMonthsData(salesData);

  const chartThreeOptions = {
    series: [
      {
        name: "Sales",
        data: salesMonthly,
      },
      {
        name: "Quotes",
        data: quotesMonthly,
      },
    ],
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    fill: {
      gradient: {
        enabled: true,
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    stroke: {
      curve: "straight",
      width: ["2", "2"],
    },

    markers: {
      size: 0,
    },
    labels: {
      show: false,
      position: "top",
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      x: {
        format: "MMM",
      },
    },
    xaxis: {
      type: "category",
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
      tooltip: false,
    },
    yaxis: {
      title: {
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const chartSelector = document.querySelectorAll("#chartThree");

  if (chartSelector.length) {
    const chartThree = new ApexCharts(
      document.querySelector("#chartThree"),
      chartThreeOptions,
    );
    chartThree.render();
  }
};

export default chart03;
