import ApexCharts from "apexcharts";
import Alpine from "alpinejs";
import flatpickr from "flatpickr";
import { parseDateAsLondon, getLondonNow, convertToLondonTime } from "../utils/londonTime.js";

const parseDate = (dateStr) => {
  return parseDateAsLondon(dateStr);
};

const filterByDateRange = (data, startDate, endDate) => {
  if (!startDate && !endDate) return data;
  
  return data.filter(item => {
    const itemDate = parseDate(item.date);
    if (!itemDate) return false;
    
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    
    return true;
  });
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

let chartThreeInstance = null;
let allQuotesData = [];
let allSalesData = [];

const renderChart = (salesData, quotesData) => {
  const salesMonthly = getMonthsData(salesData);
  const quotesMonthly = getMonthsData(quotesData);

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
    colors: ["#0388FF", "#5edbff"],
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

  if (chartThreeInstance) {
    chartThreeInstance.updateOptions(chartThreeOptions, false, true);
  } else {
    const chartSelector = document.querySelectorAll("#chartThree");
    if (chartSelector.length) {
      chartThreeInstance = new ApexCharts(
        document.querySelector("#chartThree"),
        chartThreeOptions,
      );
      chartThreeInstance.render();
    }
  }
};

Alpine.data('chartFilters', function() {
  return {
    selected: 'overview',
    dateRange: null,

    async init() {
      allQuotesData = await loadQuotesData();
      allSalesData = await loadSalesData();
      this.renderInitialChart();
      this.initDatePicker();
      setTimeout(() => this.updateChart(), 100);
    },

    renderInitialChart() {
      const today = getLondonNow();
      const pastYear = new Date(today);
      pastYear.setFullYear(pastYear.getFullYear() - 1);

      const filteredSales = filterByDateRange(allSalesData, pastYear, today);
      const filteredQuotes = filterByDateRange(allQuotesData, pastYear, today);

      if (this.selected === 'overview') {
        renderChart(filteredSales, filteredQuotes);
      } else if (this.selected === 'sales') {
        renderChart(filteredSales, []);
      } else if (this.selected === 'quotes') {
        renderChart([], filteredQuotes);
      }
    },

    async updateChart() {
      const dateInput = document.querySelector('.chart-datepicker');
      const dateValue = dateInput?.value || '';

      let startDate = null;
      let endDate = null;

      if (dateValue) {
        const parts = dateValue.split('-').map(d => d.trim());
        if (parts.length === 2) {
          startDate = parseDate(parts[0]);
          endDate = parseDate(parts[1]);
        }
      }

      let filteredSales = filterByDateRange(allSalesData, startDate, endDate);
      let filteredQuotes = filterByDateRange(allQuotesData, startDate, endDate);

      if (this.selected === 'overview') {
        renderChart(filteredSales, filteredQuotes);
      } else if (this.selected === 'sales') {
        renderChart(filteredSales, []);
      } else if (this.selected === 'quotes') {
        renderChart([], filteredQuotes);
      }
    },

    initDatePicker() {
      const dateInput = document.querySelector('.chart-datepicker');
      if (dateInput) {
        const today = getLondonNow();
        const pastYear = new Date(today);
        pastYear.setFullYear(pastYear.getFullYear() - 1);

        flatpickr(dateInput, {
          mode: "range",
          static: true,
          monthSelectorType: "static",
          dateFormat: "M j, Y",
          defaultDate: [pastYear, today],
          prevArrow:
            '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          nextArrow:
            '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          onReady: (selectedDates, dateStr, instance) => {
            instance.element.value = dateStr.replace("to", "-");
            const customClass = instance.element.getAttribute("data-class");
            if (customClass) {
              instance.calendarContainer.classList.add(customClass);
            }
          },
          onChange: (selectedDates, dateStr, instance) => {
            instance.element.value = dateStr.replace("to", "-");
          },
        });
      }
    }
  };
});

const chart03 = async () => {
  // Chart is initialized via Alpine.js component
};

export default chart03;
