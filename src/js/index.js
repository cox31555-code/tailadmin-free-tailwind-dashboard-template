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

import { 
  getLondonNow, 
  getLondonToday, 
  parseDateAsLondon,
  getDateRange,
  formatDateForDisplay,
  convertToLondonTime,
  getDateDifference
} from "./utils/londonTime.js";

Alpine.plugin(persist);
window.Alpine = Alpine;

/**
 * Shared utility function to parse dates in "Mon DD, YYYY" format in London timezone
 */
const parseDate = (dateStr) => {
  return parseDateAsLondon(dateStr);
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
            // Get date from first p tag in first cell
            const dateElement = cells[0]?.querySelector('p:first-child');
            const dateText = dateElement?.textContent?.trim() || '';

            if (dateText) {
              quotes.push({
                date: dateText,
                vehicle: cells[1]?.textContent?.trim() || '',
                amount: cells[2]?.textContent?.trim() || '',
                email: cells[3]?.textContent?.trim() || '',
              });
            }
          }
        });

        return quotes;
      } catch (error) {
        console.warn('Failed to fetch quotes table:', error);
        return [];
      }
    },

    parseDate(dateStr) {
      return parseDateAsLondon(dateStr);
    },

    getQuotesCount(quotes) {
      const ranges = {
        today: getDateRange('today'),
        last7Days: getDateRange('last7days'),
        last30Days: getDateRange('last30days')
      };

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

        if (quoteDate >= ranges.today.start && quoteDate <= ranges.today.end) {
          todayCount++;
        }

        if (quoteDate >= ranges.last7Days.start && quoteDate <= ranges.last7Days.end) {
          last7DaysCount++;
        }

        if (quoteDate >= ranges.last30Days.start && quoteDate <= ranges.last30Days.end) {
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
      try {
        const quotes = await this.loadQuotesData();
        this.updateCounts(quotes);

        // Periodically refresh quotes from the HTML table
        setInterval(async () => {
          try {
            const freshQuotes = await this.loadQuotesData();
            this.updateCounts(freshQuotes);
          } catch (e) {
            // Silently fail on refresh
          }
        }, 5000);
      } catch (e) {
        console.warn('QuotesCounter init error:', e);
      }
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
                // Get date from first p tag in first cell
                const dateElement = cells[0]?.querySelector('p:first-child');
                const dateText = dateElement?.textContent?.trim() || '';
                // Price is in second cell
                const priceElement = cells[1]?.querySelector('p');
                const priceText = priceElement?.textContent?.trim() || '£0.00';

                if (dateText) {
                  allOrders.push({
                    date: dateText,
                    type: page.includes('annual') ? 'annual' : page.includes('temporary') ? 'temporary' : 'impound',
                    price: priceText,
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
        console.warn('Failed to fetch orders tables:', error);
        return [];
      }
    },

    parseDate(dateStr) {
      return parseDateAsLondon(dateStr);
    },

    getOrdersCount(orders) {
      const ranges = {
        today: getDateRange('today'),
        last7Days: getDateRange('last7days'),
        last30Days: getDateRange('last30days')
      };

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

        if (orderDate >= ranges.today.start && orderDate <= ranges.today.end) {
          todayCount++;
        }

        if (orderDate >= ranges.last7Days.start && orderDate <= ranges.last7Days.end) {
          last7DaysCount++;
        }

        if (orderDate >= ranges.last30Days.start && orderDate <= ranges.last30Days.end) {
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
      try {
        const orders = await this.loadOrdersData();
        this.updateCounts(orders);

        // Periodically refresh orders from the HTML tables
        setInterval(async () => {
          try {
            const freshOrders = await this.loadOrdersData();
            this.updateCounts(freshOrders);
          } catch (e) {
            // Silently fail on refresh
          }
        }, 5000);
      } catch (e) {
        console.warn('OrdersCounter init error:', e);
      }
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
      return parseDateAsLondon(dateStr);
    },

    async loadOrdersData() {
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
                const priceElement = cells[1]?.querySelector('p');
                const priceText = priceElement?.textContent?.trim() || '£0.00';
                if (dateText) {
                  allOrders.push({
                    date: dateText,
                    price: priceText,
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
    },

    async calculateRevenue() {
      const ranges = {
        today: getDateRange('today'),
        last7Days: getDateRange('last7days')
      };

      let total = 0;
      let daily = 0;
      let weekly = 0;

      const orders = await this.loadOrdersData();

      orders.forEach((order) => {
        try {
          const price = this.parsePrice(order.price);
          total += price;

          const orderDate = parseDate(order.date);
          if (orderDate === null) {
            return;
          }

          if (orderDate >= ranges.today.start && orderDate <= ranges.today.end) {
            daily += price;
          }

          if (orderDate >= ranges.last7Days.start && orderDate <= ranges.last7Days.end) {
            weekly += price;
          }
        } catch (e) {
          // Skip invalid entries
        }
      });

      this.totalRevenue = total;
      this.dailyRevenue = daily;
      this.weeklyRevenue = weekly;
    },

    async init() {
      try {
        await this.calculateRevenue();

        setInterval(async () => {
          try {
            await this.calculateRevenue();
          } catch (e) {
            // Silently fail on refresh
          }
        }, 5000);
      } catch (e) {
        console.warn('RevenueOverview init error:', e);
      }
    }
  };
});

/**
 * Alpine.js component for recent items (combines all tables)
 */
Alpine.data('recentItems', function() {
  return {
    items: [],
    loading: true,

    formatDateTime(dateStr, timeStr) {
      if (!dateStr) return '';
      if (timeStr && timeStr !== 'N/A') {
        return `${dateStr} ${timeStr}`;
      }
      return dateStr;
    },

    getTypeBadge(type) {
      const types = {
        'quote': { label: 'Quote', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
        'annual': { label: 'Annual', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
        'temporary': { label: 'Temporary', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
        'impound': { label: 'Impound', color: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
        'contact': { label: 'Contact', color: 'bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' }
      };
      return types[type] || types['quote'];
    },

    parseDateTime(dateStr) {
      if (!dateStr) return new Date(0);
      const parsedDate = parseDateAsLondon(dateStr);
      return parsedDate || new Date(0);
    },

    async loadQuotesData() {
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
            const dateDiv = cells[0]?.querySelector('div');
            const dateElement = dateDiv?.querySelector('p:first-child');
            const timeElement = dateDiv?.querySelector('p:last-child');
            const dateText = dateElement?.textContent?.trim() || '';
            const timeText = timeElement?.textContent?.trim() || '';

            if (dateText) {
              const vehicleElement = cells[1]?.querySelector('p');
              const vehicleText = vehicleElement?.textContent?.trim() || '';
              const amountElement = cells[2]?.querySelector('p');
              const amountText = amountElement?.textContent?.trim() || '';
              const emailElement = cells[3]?.querySelector('p');
              const emailText = emailElement?.textContent?.trim() || '';
              const typeElement = cells[4]?.querySelector('span');
              const typeText = typeElement?.textContent?.trim() || '';

              quotes.push({
                type: 'quote',
                date: dateText,
                time: timeText,
                customer: 'Quote Request',
                vehicle: vehicleText,
                amount: amountText,
                email: emailText
              });
            }
          }
        });

        return quotes;
      } catch (error) {
        console.warn('Failed to fetch quotes:', error);
        return [];
      }
    },

    async loadOrdersData() {
      try {
        const pages = [
          { url: '/annual.html', type: 'annual' },
          { url: '/temporary.html', type: 'temporary' },
          { url: '/impound.html', type: 'impound' }
        ];
        const allOrders = [];

        for (const page of pages) {
          try {
            const response = await fetch(page.url, { cache: 'no-cache' });
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const rows = doc.querySelectorAll('table tbody tr');
            rows.forEach((row) => {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 2) {
                const dateElement = cells[0]?.querySelector('p:first-child');
                const dateText = dateElement?.textContent?.trim() || '';
                const timeElement = cells[0]?.querySelector('p:last-child');
                const timeText = timeElement?.textContent?.trim() || '';

                if (dateText) {
                  const priceElement = cells[1]?.querySelector('p');
                  const priceText = priceElement?.textContent?.trim() || '';
                  const emailElement = cells[2]?.querySelector('p');
                  const emailText = emailElement?.textContent?.trim() || '';
                  const phoneElement = cells[3]?.querySelector('p');
                  const phoneText = phoneElement?.textContent?.trim() || '';
                  const vehicleElement = cells[4]?.querySelector('p');
                  const vehicleText = vehicleElement?.textContent?.trim() || '';

                  allOrders.push({
                    type: page.type,
                    date: dateText,
                    time: timeText,
                    customer: 'Policy Holder',
                    vehicle: vehicleText,
                    amount: priceText,
                    email: emailText
                  });
                }
              }
            });
          } catch (e) {
            console.warn(`Failed to fetch ${page.url}:`, e);
          }
        }

        return allOrders;
      } catch (error) {
        console.warn('Failed to fetch orders:', error);
        return [];
      }
    },

    async loadContactFormData() {
      try {
        const response = await fetch('/contact-form.html', { cache: 'no-cache' });
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const submissions = [];
        const rows = doc.querySelectorAll('table tbody tr');

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const nameElement = cells[0]?.querySelector('p');
            const nameText = nameElement?.textContent?.trim() || '';
            const emailElement = cells[2]?.querySelector('p');
            const emailText = emailElement?.textContent?.trim() || '';
            const dateElement = cells[3]?.querySelector('p');
            const dateText = dateElement?.textContent?.trim() || '';
            const timeElement = cells[4]?.querySelector('p');
            const timeText = timeElement?.textContent?.trim() || '';

            if (dateText) {
              submissions.push({
                type: 'contact',
                date: dateText,
                time: timeText,
                customer: nameText,
                vehicle: '',
                amount: '',
                email: emailText
              });
            }
          }
        });

        return submissions;
      } catch (error) {
        console.warn('Failed to fetch contact form:', error);
        return [];
      }
    },

    async loadAllItems() {
      try {
        const [quotes, orders, contactForms] = await Promise.all([
          this.loadQuotesData(),
          this.loadOrdersData(),
          this.loadContactFormData()
        ]);

        const allItems = [...quotes, ...orders, ...contactForms];

        allItems.sort((a, b) => {
          const dateA = this.parseDateTime(`${a.date} ${a.time}`);
          const dateB = this.parseDateTime(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        this.items = allItems.slice(0, 10);
        this.loading = false;
      } catch (error) {
        console.warn('Failed to load recent items:', error);
        this.items = [];
        this.loading = false;
      }
    },

    async init() {
      try {
        await this.loadAllItems();

        setInterval(async () => {
          try {
            await this.loadAllItems();
          } catch (e) {
            // Silently fail on refresh
          }
        }, 5000);
      } catch (e) {
        console.warn('RecentItems init error:', e);
      }
    }
  };
});

Alpine.start();

// Init flatpickr with London timezone date range
const range = getDateRange('last7days');
flatpickr(".datepicker", {
  mode: "range",
  static: true,
  monthSelectorType: "static",
  dateFormat: "M j, Y",
  defaultDate: [range.start, range.end],
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
  year.textContent = getLondonNow().getFullYear();
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
