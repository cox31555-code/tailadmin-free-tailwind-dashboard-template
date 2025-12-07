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
      try {
        // Try multiple fetch paths to handle different environments
        const paths = ['/data/quotes.json', './data/quotes.json', 'data/quotes.json'];
        let response;
        let lastError;

        for (const path of paths) {
          try {
            response = await fetch(path, { cache: 'no-cache' });
            if (response.ok) {
              const quotes = await response.json();
              localStorage.setItem('quotesData', JSON.stringify(quotes));
              console.log('Quotes loaded successfully from:', path, 'Count:', quotes.length);
              return quotes;
            }
          } catch (e) {
            lastError = e;
            continue;
          }
        }

        throw lastError || new Error('All fetch paths failed');
      } catch (error) {
        console.warn('Failed to load quotes.json, attempting localStorage fallback:', error);
        const quotesDataStr = localStorage.getItem('quotesData');
        const quotes = quotesDataStr ? JSON.parse(quotesDataStr) : [];
        console.log('Using cached quotes from localStorage. Count:', quotes.length);
        return quotes;
      }
    },

    getQuotesCount(quotes) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

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
        const dateText = quote.date;

        try {
          const quoteDate = new Date(dateText);
          quoteDate.setHours(0, 0, 0, 0);

          if (quoteDate.getTime() === today.getTime()) {
            todayCount++;
          }

          if (quoteDate >= sevenDaysAgo && quoteDate <= today) {
            last7DaysCount++;
          }

          if (quoteDate >= thirtyDaysAgo && quoteDate <= today) {
            past30DaysCount++;
          }
        } catch (e) {
          console.warn('Failed to parse date:', dateText);
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

      setInterval(() => {
        const quotesDataStr = localStorage.getItem('quotesData');
        const quotes = quotesDataStr ? JSON.parse(quotesDataStr) : [];
        this.updateCounts(quotes);
      }, 3000);
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
      try {
        const paths = ['/data/orders.json', './data/orders.json', 'data/orders.json'];
        let response;
        let lastError;

        for (const path of paths) {
          try {
            response = await fetch(path, { cache: 'no-cache' });
            if (response.ok) {
              const orders = await response.json();
              localStorage.setItem('ordersData', JSON.stringify(orders));
              console.log('Orders loaded successfully from:', path, 'Count:', orders.length);
              return orders;
            }
          } catch (e) {
            lastError = e;
            continue;
          }
        }

        throw lastError || new Error('All fetch paths failed');
      } catch (error) {
        console.warn('Failed to load orders.json, attempting localStorage fallback:', error);
        const ordersDataStr = localStorage.getItem('ordersData');
        const orders = ordersDataStr ? JSON.parse(ordersDataStr) : [];
        console.log('Using cached orders from localStorage. Count:', orders.length);
        return orders;
      }
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
        const dateText = order.date;

        try {
          const orderDate = new Date(dateText);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === today.getTime()) {
            todayCount++;
          }

          if (orderDate >= sevenDaysAgo && orderDate <= today) {
            last7DaysCount++;
          }

          if (orderDate >= thirtyDaysAgo && orderDate <= today) {
            past30DaysCount++;
          }
        } catch (e) {
          console.warn('Failed to parse date:', dateText);
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

    async loadOrdersData() {
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
              return orders;
            }
          } catch (e) {
            lastError = e;
            continue;
          }
        }

        throw lastError || new Error('All fetch paths failed');
      } catch (error) {
        console.warn('Failed to load orders data:', error);
        return [];
      }
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

          const orderDate = new Date(order.date);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === today.getTime()) {
            daily += price;
          }

          if (orderDate >= sevenDaysAgo && orderDate <= today) {
            weekly += price;
          }
        } catch (e) {
          console.warn('Failed to parse order price:', order.price);
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
document.addEventListener("DOMContentLoaded", () => {
  chart01();
  chart02();
  chart03();
  map01();
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
