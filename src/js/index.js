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

/**
 * Alpine.js component for quotes counter
 */
window.quotesCounter = function() {
  return {
    todayCount: 0,
    last7DaysCount: 0,
    past30DaysCount: 0,

    formatNumber(num) {
      return num.toLocaleString('en-US');
    },

    getQuotesCount() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      let todayCount = 0;
      let last7DaysCount = 0;
      let past30DaysCount = 0;

      // Get all table rows from the quotes table
      const tableRows = document.querySelectorAll('table tbody tr');

      tableRows.forEach((row) => {
        // Get the date from the first cell (Date & Time column)
        const dateCell = row.querySelector('td:first-child p:first-child');
        if (!dateCell) return;

        const dateText = dateCell.textContent.trim();

        // Parse the date (format: "Nov 12, 2025")
        try {
          const quoteDate = new Date(dateText);
          quoteDate.setHours(0, 0, 0, 0);

          // Count based on date ranges
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

    init() {
      this.updateCounts();

      // Watch for table changes
      const observer = new MutationObserver(() => {
        this.updateCounts();
      });

      // Start observing the table for changes
      const tableContainer = document.querySelector('table');
      if (tableContainer) {
        observer.observe(tableContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      // Also check periodically in case table is loaded after this component initializes
      setTimeout(() => {
        this.updateCounts();
      }, 1000);
    },

    updateCounts() {
      const counts = this.getQuotesCount();
      this.todayCount = counts.today;
      this.last7DaysCount = counts.last7Days;
      this.past30DaysCount = counts.past30Days;
    },

    x_init() {
      this.init();
    }
  };
};

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
