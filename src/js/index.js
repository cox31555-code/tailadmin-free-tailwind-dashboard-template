import "jsvectormap/dist/jsvectormap.min.css";
import "flatpickr/dist/flatpickr.min.css";
import "dropzone/dist/dropzone.css";
import "../css/style.css";

import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import flatpickr from "flatpickr";
import Dropzone from "dropzone";

import chart01 from "./components/charts/chart-01";
import chart02 from "./components/charts/chart-02";
import chart03 from "./components/charts/chart-03";
import map01 from "./components/map-01";
import "./components/calendar-init.js";
import "./components/image-resize";

Alpine.plugin(persist);
window.Alpine = Alpine;

/**
 * Shared utility function to parse dates in "Mon DD, YYYY" format
 */
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
        console.log('parseDate: Successfully parsed', dateStr, '→', date.toISOString().split('T')[0], 'monthIndex:', monthIndex, 'day:', dayStr, 'year:', yearStr);
        return date;
      } else {
        console.warn('parseDate: Failed validation for', dateStr, '- monthIndex:', monthIndex, 'dayStr:', dayStr, 'yearStr:', yearStr);
      }
    } else {
      console.warn('parseDate: Invalid format for', dateStr, '- parts:', parts);
    }
  } catch (e) {
    console.warn('parseDate: Exception parsing', dateStr, e);
  }

  return null;
};

/**
 * Alpine.js component for quotes counter
 */
Alpine.data('quotesCounter', function() {
  return {
    todayCount: 0,
    last7DaysCount: 0,
    past30DaysCount: 0,

    formatNumber(num) {
      return num.toLocaleString('en-US');
    },

    async loadQuotesData() {
      const quotesDataStr = localStorage.getItem('quotesData');
      return quotesDataStr ? JSON.parse(quotesDataStr) : [];
    },

    parseDate(dateStr) {
      if (!dateStr) return null;

      // Handle "Dec 07, 2024" format
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
        console.warn('Failed to parse date:', dateStr, e);
      }

      return null;
    },

    getQuotesCount(quotes) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log('QuotesCounter: Today is:', today.toISOString().split('T')[0]);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      console.log('QuotesCounter: 7 days ago:', sevenDaysAgo.toISOString().split('T')[0]);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      console.log('QuotesCounter: 30 days ago:', thirtyDaysAgo.toISOString().split('T')[0]);

      let todayCount = 0;
      let last7DaysCount = 0;
      let past30DaysCount = 0;

      if (!quotes || !Array.isArray(quotes)) {
        return {
          today: 0,
          last7Days: 0,
          past30Days: 0,
        };
      }

      quotes.forEach((quote) => {
        const quoteDate = parseDate(quote.date);

        if (quoteDate === null) {
          console.warn('QuotesCounter: Could not parse quote date:', quote.date);
          return;
        }

        if (quoteDate.getTime() === today.getTime()) {
          todayCount++;
        }

        if (quoteDate >= sevenDaysAgo && quoteDate <= today) {
          last7DaysCount++;
        }

        if (quoteDate >= thirtyDaysAgo && quoteDate <= today) {
          past30DaysCount++;
        }
      });

      return {
        today: todayCount,
        last7Days: last7DaysCount,
        past30Days: past30DaysCount,
      };
    },

    async init() {
      const quotes = await this.loadQuotesData();
      this.updateCounts(quotes);

      window.addEventListener('storage', (e) => {
        if (e.key === 'quotesData') {
          const quotesDataStr = localStorage.getItem('quotesData');
          const quotes = quotesDataStr ? JSON.parse(quotesDataStr) : [];
          this.updateCounts(quotes);
        }
      });
    },

    updateCounts(quotes) {
      const counts = this.getQuotesCount(quotes);
      this.todayCount = counts.today;
      this.last7DaysCount = counts.last7Days;
      this.past30DaysCount = counts.past30Days;
    }
  };
});

/**
 * Alpine.js component for orders counter (combines annual, temporary, and impound)
 */
Alpine.data('ordersCounter', function() {
  return {
    todayCount: 0,
    last7DaysCount: 0,
    past30DaysCount: 0,

    formatNumber(num) {
      return num.toLocaleString('en-US');
    },

    async loadOrdersData() {
      const ordersDataStr = localStorage.getItem('ordersData');
      return ordersDataStr ? JSON.parse(ordersDataStr) : [];
    },

    parseDate(dateStr) {
      if (!dateStr) return null;

      // Handle "Dec 07, 2024" format
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
        console.warn('Failed to parse date:', dateStr, e);
      }

      return null;
    },

    getOrdersCount(orders) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      let todayCount = 0;
      let last7DaysCount = 0;
      let past30DaysCount = 0;

      if (!orders || !Array.isArray(orders)) {
        return {
          today: 0,
          last7Days: 0,
          past30Days: 0,
        };
      }

      orders.forEach((order) => {
        const orderDate = parseDate(order.date);

        if (orderDate === null) {
          console.warn('OrdersCounter: Could not parse order date:', order.date);
          return;
        }

        if (orderDate.getTime() === today.getTime()) {
          todayCount++;
        }

        if (orderDate >= sevenDaysAgo && orderDate <= today) {
          last7DaysCount++;
        }

        if (orderDate >= thirtyDaysAgo && orderDate <= today) {
          past30DaysCount++;
        }
      });

      return {
        today: todayCount,
        last7Days: last7DaysCount,
        past30Days: past30DaysCount,
      };
    },

    async init() {
      const orders = await this.loadOrdersData();
      this.updateCounts(orders);

      window.addEventListener('storage', (e) => {
        if (e.key === 'ordersData') {
          const ordersDataStr = localStorage.getItem('ordersData');
          const orders = ordersDataStr ? JSON.parse(ordersDataStr) : [];
          this.updateCounts(orders);
        }
      });

      setInterval(() => {
        const ordersDataStr = localStorage.getItem('ordersData');
        const orders = ordersDataStr ? JSON.parse(ordersDataStr) : [];
        this.updateCounts(orders);
      }, 3000);
    },

    updateCounts(orders) {
      const counts = this.getOrdersCount(orders);
      this.todayCount = counts.today;
      this.last7DaysCount = counts.last7Days;
      this.past30DaysCount = counts.past30Days;
    }
  };
});

/**
 * Alpine.js component for revenue overview
 */
Alpine.data('revenueOverview', function() {
  return {
    totalRevenue: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,

    formatCurrency(amount) {
      return '£' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    parsePrice(priceStr) {
      return parseFloat(priceStr.replace('£', '').replace('$', ''));
    },

    parseDate(dateStr) {
      if (!dateStr) return null;

      // Handle "Dec 07, 2024" format
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
        console.warn('Failed to parse date:', dateStr, e);
      }

      return null;
    },

    async loadOrdersData() {
      // Always read from localStorage (populated by table pages)
      const ordersDataStr = localStorage.getItem('ordersData');
      const orders = ordersDataStr ? JSON.parse(ordersDataStr) : [];
      return orders;
    },

    calculateRevenue() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      let total = 0;
      let daily = 0;
      let weekly = 0;

      const ordersDataStr = localStorage.getItem('ordersData');
      const orders = ordersDataStr ? JSON.parse(ordersDataStr) : [];

      orders.forEach((order) => {
        try {
          const price = this.parsePrice(order.price);
          total += price;

          const orderDate = parseDate(order.date);
          if (orderDate === null) {
            console.warn('RevenueOverview: Could not parse order date:', order.date);
            return;
          }

          if (orderDate.getTime() === today.getTime()) {
            daily += price;
          }

          if (orderDate >= sevenDaysAgo && orderDate <= today) {
            weekly += price;
          }
        } catch (e) {
          console.warn('RevenueOverview: Failed to process order:', order, e);
        }
      });

      this.totalRevenue = total;
      this.dailyRevenue = daily;
      this.weeklyRevenue = weekly;
    },

    async init() {
      await this.loadOrdersData();
      this.calculateRevenue();

      window.addEventListener('storage', (e) => {
        if (e.key === 'ordersData') {
          this.calculateRevenue();
        }
      });

      setInterval(() => {
        this.calculateRevenue();
      }, 3000);
    }
  };
});

Alpine.start();

// Init flatpickr
flatpickr(".datepicker", {
  mode: "range",
  static: true,
  monthSelectorType: "static",
  dateFormat: "M j, Y",
  defaultDate: [new Date().setDate(new Date().getDate() - 6), new Date()],
  prevArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  nextArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  onReady: (selectedDates, dateStr, instance) => {
    // eslint-disable-next-line no-param-reassign
    instance.element.value = dateStr.replace("to", "-");
    const customClass = instance.element.getAttribute("data-class");
    instance.calendarContainer.classList.add(customClass);
  },
  onChange: (selectedDates, dateStr, instance) => {
    // eslint-disable-next-line no-param-reassign
    instance.element.value = dateStr.replace("to", "-");
  },
});

// Init Dropzone
const dropzoneArea = document.querySelectorAll("#demo-upload");

if (dropzoneArea.length) {
  let myDropzone = new Dropzone("#demo-upload", { url: "/file/post" });
}

// Document Loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await chart01();
  } catch (error) {
    console.error('Error initializing chart01:', error);
  }
  try {
    await chart02();
  } catch (error) {
    console.error('Error initializing chart02:', error);
  }
  try {
    chart03();
  } catch (error) {
    console.error('Error initializing chart03:', error);
  }
  try {
    map01();
  } catch (error) {
    console.error('Error initializing map01:', error);
  }
});

// Get the current year
const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// For Copy//
document.addEventListener("DOMContentLoaded", () => {
  const copyInput = document.getElementById("copy-input");
  if (copyInput) {
    // Select the copy button and input field
    const copyButton = document.getElementById("copy-button");
    const copyText = document.getElementById("copy-text");
    const websiteInput = document.getElementById("website-input");

    // Event listener for the copy button
    copyButton.addEventListener("click", () => {
      // Copy the input value to the clipboard
      navigator.clipboard.writeText(websiteInput.value).then(() => {
        // Change the text to "Copied"
        copyText.textContent = "Copied";

        // Reset the text back to "Copy" after 2 seconds
        setTimeout(() => {
          copyText.textContent = "Copy";
        }, 2000);
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");

  // Only initialize search if elements exist
  if (searchInput && searchButton) {
    // Function to focus the search input
    function focusSearchInput() {
      searchInput.focus();
    }

    // Add click event listener to the search button
    searchButton.addEventListener("click", focusSearchInput);

    // Add keyboard event listener for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault(); // Prevent the default browser behavior
        focusSearchInput();
      }
    });

    // Add keyboard event listener for "/" key
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && document.activeElement !== searchInput) {
        event.preventDefault(); // Prevent the "/" character from being typed
        focusSearchInput();
      }
    });
  }
});
