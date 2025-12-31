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
import "./loading-handler.js";
import "./components/kanban-sortable-init.js";
import { createTableState } from "./utils/table-base.js";
import "./utils/table-functions.js";
import "./utils/table-configs.js";
import { ensureOrdersDataComplete } from "./utils/orders-data-sync.js";
import { onOrdersDataUpdated } from "./utils/orders-data-store.js";
import {
  getQuotes,
  getPendingClaims,
  getActivePolicies,
  getAllPolicies,
  getCountsForRanges,
  getCountsWithTrends,
  buildRangePairs,
  calculatePercentChange,
  sumRevenue,
  sumRevenueInRange,
} from "./utils/dashboard-data.js";

import {
  getLondonNow,
  getLondonToday,
  parseDateAsLondon,
  getDateRange,
  formatDateForDisplay,
  convertToLondonTime,
  getDateDifference,
  isExpired,
  compareLondonDates,
  getDateArray,
  getStartOfDay,
  getEndOfDay
} from "./utils/londonTime.js";

Alpine.plugin(persist);
window.Alpine = Alpine;

// Expose London timezone utilities globally for use in HTML templates
window.londonTime = {
  getLondonNow,
  getLondonToday,
  parseDateAsLondon,
  getDateRange,
  formatDateForDisplay,
  convertToLondonTime,
  getDateDifference,
  isExpired,
  compareLondonDates,
  getDateArray,
  getStartOfDay,
  getEndOfDay
};

// Expose table utilities globally
window.createTableState = createTableState;

/**
 * Shared utility function to parse dates in "Mon DD, YYYY" format in London timezone
 */
const parseDate = (dateStr) => {
  return parseDateAsLondon(dateStr);
};

/**
 * Shared formatting + styling helpers for trend badges
 */
const formatTrend = (value) => {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);

  const rounded = abs < 10 ? Math.round(n * 10) / 10 : Math.round(n);
  const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);

  const sign = rounded > 0 ? "+" : "";
  return `${sign}${formatted}%`;
};

const trendBadgeClasses = (value) => {
  const n = Number.isFinite(value) ? value : 0;

  if (n > 0) {
    return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  }

  if (n < 0) {
    return "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  }

  return "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400";
};

const trendIconClasses = (value) => {
  const n = Number.isFinite(value) ? value : 0;

  if (n < 0) return "rotate-180";
  if (n === 0) return "opacity-60";
  return "";
};

/**
 * Alpine.js component for quotes counter
 */
Alpine.data("quotesCounter", function () {
  return {
    todayCount: 0,
    last7DaysCount: 0,
    past30DaysCount: 0,

    trendToday: 0,
    trendLast7Days: 0,
    trendLast30Days: 0,

    formatNumber(num) {
      return num.toLocaleString("en-US");
    },

    formatTrend,
    trendBadgeClasses,
    trendIconClasses,

    async refreshCounts() {
      await ensureOrdersDataComplete();
      const quotes = getQuotes();
      const { counts, trends } = getCountsWithTrends(quotes, (q) => q.date);
      this.todayCount = counts.today;
      this.last7DaysCount = counts.last7Days;
      this.past30DaysCount = counts.last30Days;

      this.trendToday = trends.today;
      this.trendLast7Days = trends.last7Days;
      this.trendLast30Days = trends.last30Days;
    },

    async init() {
      try {
        await this.refreshCounts();

        onOrdersDataUpdated(() => {
          this.refreshCounts();
        });

        // Low-frequency fallback refresh.
        setInterval(() => {
          this.refreshCounts();
        }, 15000);
      } catch (e) {
        console.warn("QuotesCounter init error:", e);
      }
    },
  };
});

/**
 * Alpine.js component for orders counter (active policies across annual/temporary/impound)
 */
Alpine.data("ordersCounter", function () {
  return {
    todayCount: 0,
    last7DaysCount: 0,
    past30DaysCount: 0,

    trendToday: 0,
    trendLast7Days: 0,
    trendLast30Days: 0,

    formatNumber(num) {
      return num.toLocaleString("en-US");
    },

    formatTrend,
    trendBadgeClasses,
    trendIconClasses,

    async refreshCounts() {
      await ensureOrdersDataComplete();
      const policies = getActivePolicies();
      const { counts, trends } = getCountsWithTrends(policies, (p) => p.policyStart || p.date);
      this.todayCount = counts.today;
      this.last7DaysCount = counts.last7Days;
      this.past30DaysCount = counts.last30Days;

      this.trendToday = trends.today;
      this.trendLast7Days = trends.last7Days;
      this.trendLast30Days = trends.last30Days;
    },

    async init() {
      try {
        await this.refreshCounts();

        onOrdersDataUpdated(() => {
          this.refreshCounts();
        });

        setInterval(() => {
          this.refreshCounts();
        }, 15000);
      } catch (e) {
        console.warn("OrdersCounter init error:", e);
      }
    },
  };
});

/**
 * Alpine.js component for revenue overview
 */
Alpine.data("revenueOverview", function () {
  return {
    totalRevenue: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,

    totalTrend: 0,
    dailyTrend: 0,
    weeklyTrend: 0,

    formatCurrency(amount) {
      return "£" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    formatTrend,
    trendBadgeClasses,
    trendIconClasses,

    async calculateRevenue() {
      await ensureOrdersDataComplete();

      const policies = getAllPolicies();
      const dateSelector = (p) => p.policyStart || p.date;
      const priceSelector = (p) => p.price;

      const rangePairs = buildRangePairs(["today", "last7days", "last30days"]);

      const dailyCurrent = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.today.current,
      );
      const dailyPrevious = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.today.previous,
      );

      const weeklyCurrent = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.last7days.current,
      );
      const weeklyPrevious = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.last7days.previous,
      );

      const last30Current = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.last30days.current,
      );
      const last30Previous = sumRevenueInRange(
        policies,
        priceSelector,
        dateSelector,
        rangePairs.last30days.previous,
      );

      this.totalRevenue = sumRevenue(policies, priceSelector);
      this.dailyRevenue = dailyCurrent;
      this.weeklyRevenue = weeklyCurrent;

      this.totalTrend = calculatePercentChange(last30Current, last30Previous);
      this.dailyTrend = calculatePercentChange(dailyCurrent, dailyPrevious);
      this.weeklyTrend = calculatePercentChange(weeklyCurrent, weeklyPrevious);
    },

    async init() {
      try {
        await this.calculateRevenue();

        onOrdersDataUpdated(() => {
          this.calculateRevenue();
        });

        setInterval(() => {
          this.calculateRevenue();
        }, 15000);
      } catch (e) {
        console.warn("RevenueOverview init error:", e);
      }
    },
  };
});

/**
 * Alpine.js component for recent items (quotes + active policies + pending claims)
 */
Alpine.data("recentItems", function () {
  return {
    items: [],
    loading: true,

    formatDateTime(dateStr, timeStr) {
      if (!dateStr) return "";
      if (timeStr && timeStr !== "N/A") {
        return `${dateStr} ${timeStr}`;
      }
      return dateStr;
    },

    getTypeBadge(type) {
      const types = {
        quotes: {
          label: "Quote",
          color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
        },
        annual: {
          label: "Annual",
          color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
        },
        temporary: {
          label: "Temporary",
          color: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
        },
        impound: {
          label: "Impound",
          color: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
        },
        pendingClaims: {
          label: "Claim",
          color: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
        },
        contact: {
          label: "Contact",
          color: "bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
        },
      };

      return types[type] || types.quotes;
    },

    parseDateTime(dateStr) {
      if (!dateStr) return new Date(0);
      const parsedDate = parseDateAsLondon(dateStr);
      return parsedDate || new Date(0);
    },

    normalizeQuote(q) {
      return {
        type: "quotes",
        date: q.date || "",
        time: q.time || "",
        customer: "Quote Request",
        vehicle: q.vehicle || "",
        amount: q.amount || "",
        email: q.email || "",
      };
    },

    normalizePolicy(p) {
      return {
        type: p.type,
        date: p.policyStart || p.date || "",
        time: "",
        customer: p.name || "Policy Holder",
        vehicle: p.vehicle || "",
        amount: p.price || "",
        email: p.email || "",
      };
    },

    normalizeClaim(c) {
      return {
        type: "pendingClaims",
        date: c.incidentDate || "",
        time: "",
        customer: c.name || "Claim",
        vehicle: c.claimType || "",
        amount: "",
        email: c.email || "",
      };
    },

    async loadAllItems() {
      this.loading = true;

      try {
        await ensureOrdersDataComplete();

        const quotes = getQuotes().map((q) => this.normalizeQuote(q));
        const policies = getActivePolicies().map((p) => this.normalizePolicy(p));
        const claims = getPendingClaims().map((c) => this.normalizeClaim(c));

        const allItems = [...quotes, ...policies, ...claims].filter((x) => x.date);

        allItems.sort((a, b) => {
          const dateA = this.parseDateTime(a.date);
          const dateB = this.parseDateTime(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        this.items = allItems.slice(0, 10);
      } catch (error) {
        console.warn("Failed to load recent items:", error);
        this.items = [];
      } finally {
        this.loading = false;
      }
    },

    async init() {
      try {
        await this.loadAllItems();

        onOrdersDataUpdated(() => {
          this.loadAllItems();
        });

        setInterval(() => {
          this.loadAllItems();
        }, 15000);
      } catch (e) {
        console.warn("RecentItems init error:", e);
      }
    },
  };
});

Alpine.start();

// Synchronize dark mode class with document element for smooth transitions
// Use multiple mechanisms to ensure immediate, reliable updates
document.addEventListener('alpine:initialized', () => {
  try {
    const body = document.querySelector('body[x-data]');
    if (body && body.__x && body.__x.$data) {
      // Method 1: Primary watcher for darkMode state changes
      body.__x.$watch('darkMode', (newValue) => {
        updateDarkMode(newValue);
        // Force CSS recalculation by triggering reflow
        void document.documentElement.offsetHeight;
      });

      // Method 2: Direct attribute observer on body for immediate class changes
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            const currentAlpineValue = body.__x.$data.darkMode;
            // If Alpine state doesn't match DOM, sync it
            if (hasDarkClass !== currentAlpineValue) {
              body.__x.$data.darkMode = hasDarkClass;
            }
          }
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  } catch (e) {
    console.warn('Dark mode watcher initialization error:', e);
  }
});

// Unified function to update dark mode everywhere
function updateDarkMode(isDark) {
  // IMMEDIATE: Update document class synchronously
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Update localStorage to persist preference
  localStorage.setItem('darkMode', JSON.stringify(isDark));
}

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
