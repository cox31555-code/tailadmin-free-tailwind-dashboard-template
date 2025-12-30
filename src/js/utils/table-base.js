import { readOrdersData, writeOrdersData } from "./orders-data-store.js";

/**
 * Base Table Utilities
 * Reusable functions for all policy tables (Annual, Temporary, Impound)
 */

/**
 * Create table configuration
 * @param {Object} config - Table configuration
 * @returns {Object} Complete table state and methods
 */
export function createTableState(config) {
  const {
    tableType, // 'annual', 'temporary', 'impound'
    columns, // Column definitions
    csvHeaders, // CSV export headers
    csvFilename, // CSV filename
    dateColumns = {}, // Which columns contain dates
    statusConfig = {} // Status calculation config
  } = config;

  return {
    // State
    filterPanelOpen: false,
    searchQuery: '',
    filterPayment: 'all',
    sortColumn: columns.defaultSort || 'name',
    sortDirection: 'asc',
    policyCounts: { total: 0, active: 0, expiringSoon: 0, nextDue: 0 },
    expiredPolicies: [], // List of expired policies (for expired-only tables)

    // Pagination state
    currentPage: 1,
    itemsPerPage: config.itemsPerPage || 10,
    _tableRows: null, // Cache to avoid repeated queries

    // Computed properties for pagination
    get filteredRowCount() {
      const table = document.querySelector(config.tableSelector || 'table');
      const rows = table?.querySelectorAll('tbody tr') || [];
      return Array.from(rows).filter(row => row.dataset.filteredOut !== 'true').length;
    },

    get totalPages() {
      const count = this.filteredRowCount;
      return Math.max(1, Math.ceil(count / this.itemsPerPage));
    },

    get paginationInfo() {
      const total = this.filteredRowCount;
      if (total === 0) return { start: 0, end: 0, total: 0 };
      const start = (this.currentPage - 1) * this.itemsPerPage + 1;
      const end = Math.min(this.currentPage * this.itemsPerPage, total);
      return { start, end, total };
    },

    // Pagination methods
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.applyPagination();
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.applyPagination();
      }
    },

    setPage(pageNumber) {
      const page = Math.max(1, Math.min(pageNumber, this.totalPages));
      if (page !== this.currentPage) {
        this.currentPage = page;
        this.applyPagination();
      }
    },

    applyPagination() {
      const table = document.querySelector(config.tableSelector || 'table');
      const allRows = table?.querySelectorAll('tbody tr') || [];

      // Get only rows that pass filters
      const filteredRows = Array.from(allRows).filter(row => row.dataset.filteredOut !== 'true');

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;

      // Mark rows as paged out or not
      filteredRows.forEach((row, index) => {
        if (index >= startIndex && index < endIndex) {
          row.dataset.pagedOut = 'false'; // Show on this page
        } else {
          row.dataset.pagedOut = 'true'; // Hide (on different page)
        }
      });

      // Apply unified visibility
      this.applyRowVisibility();
    },

    applyRowVisibility() {
      const table = document.querySelector(config.tableSelector || 'table');
      const allRows = table?.querySelectorAll('tbody tr') || [];

      allRows.forEach(row => {
        const filteredOut = row.dataset.filteredOut === 'true';
        const pagedOut = row.dataset.pagedOut === 'true';

        // Hide if EITHER flag is true
        row.style.display = (filteredOut || pagedOut) ? 'none' : '';
      });
    },

    // Initialization
    init() {
      // Initialize data attributes on all rows
      const table = document.querySelector(config.tableSelector || 'table');
      const allRows = table?.querySelectorAll('tbody tr') || [];
      allRows.forEach(row => {
        row.dataset.filteredOut = row.dataset.filteredOut || 'false';
        row.dataset.pagedOut = row.dataset.pagedOut || 'false';
      });

      // Cache rows to avoid repeated queries
      this._tableRows = Array.from(allRows);

      // If we are on an expired-only page, load data from localStorage
      if (statusConfig.showOnlyExpired) {
        this.loadExpiredPolicies();
      } else {
        // If we are on an active page and configured to remove expired, do so
        if (statusConfig.removeExpired) {
          this.removeExpiredPolicies();
        }
      }

      // Initialize stats on page load
      this.updatePolicyCounts();

      // Listen for stats updates from filter/search
      document.addEventListener('update-stats', (e) => {
        this.policyCounts = e.detail;
      });

      // Apply initial pagination after Alpine finishes rendering
      this.$nextTick(() => {
        this.applyPagination();
      });
    },

    // Load expired policies from localStorage
    loadExpiredPolicies() {
      const allOrders = readOrdersData();
      // Filter for orders matching this table type (e.g. 'expired-annual')
      this.expiredPolicies = allOrders.filter((order) => order.type === tableType);

      // Update stats based on loaded data
      this.policyCounts.total = this.expiredPolicies.length;
    },

    // Remove expired policies from DOM and save to localStorage
    removeExpiredPolicies() {
      const rows = document.querySelectorAll('table tbody tr');
      const endDateColumnIndex = dateColumns.policyEnd;
      let expiredFound = false;
      
      // Get existing orders to append to
      let allOrders = readOrdersData();

      rows.forEach(row => {
        const policyEndCell = row.querySelectorAll('td')[endDateColumnIndex];
        const dateP = policyEndCell?.querySelector('p:first-child');
        const policyEndDate = dateP ? dateP.textContent.trim() : '';
        
        if (policyEndDate) {
          const endDate = new Date(policyEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (endDate < today) {
            // Policy is expired. 
            // 1. Extract data
            if (window.extractRowData) {
              const orderData = window.extractRowData(row, config);
              // Set type to expired version (e.g. 'annual' -> 'expired-annual')
              orderData.type = `expired-${tableType}`;
              
              // Check if already exists to avoid duplicates (optional but good)
              const exists = allOrders.some(o => 
                o.type === orderData.type && 
                o.name === orderData.name && 
                o.email === orderData.email
              );
              
              if (!exists) {
                allOrders.push(orderData);
                expiredFound = true;
              }
            }
            
            // 2. Remove from DOM
            row.remove(); 
          }
        }
      });

      // Save updated orders if we found expired ones
      if (expiredFound) {
        writeOrdersData(allOrders);
      }
    },

    // Update policy counts
    updatePolicyCounts() {
      if (statusConfig.showOnlyExpired) {
        // For expired pages, count is just length of array
        this.policyCounts = { total: this.expiredPolicies.length, active: 0, expiringSoon: 0, nextDue: 0 };
      } else {
        // For active pages, calculate from DOM
        this.policyCounts = window.calculatePolicyCounts(tableType);
      }
    },

    // Handle column sorting
    handleSort(columnName) {
      if (this.sortColumn === columnName) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = columnName;
        this.sortDirection = 'asc';
      }
      
      if (statusConfig.showOnlyExpired) {
        // Sort the array in memory
        this.sortExpiredPolicies(columnName, this.sortDirection);
      } else {
        // Sort DOM rows
        window.performSort(this.sortColumn, this.sortDirection);
      }
    },

    // Sort in-memory expired policies
    sortExpiredPolicies(columnName, direction) {
      const colDef = config.columns.list.find(c => c.sortKey === columnName);
      if (!colDef) return;

      this.expiredPolicies.sort((a, b) => {
        let valA = a[colDef.dataKey] || '';
        let valB = b[colDef.dataKey] || '';

        // Handle merged keys (like name.email) - usually we sort by the first part
        if (colDef.dataKey.includes('.')) {
          const key = colDef.dataKey.split('.')[0];
          valA = a[key] || '';
          valB = b[key] || '';
        }

        if (colDef.sortType === 'price') {
          valA = parseFloat(valA.replace(/[£$,]/g, '')) || 0;
          valB = parseFloat(valB.replace(/[£$,]/g, '')) || 0;
        } else if (colDef.sortType === 'date') {
          valA = new Date(valA).getTime() || 0;
          valB = new Date(valB).getTime() || 0;
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    },

    // Get policy progress (for progress bars)
    getPolicyProgress(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
      const daysElapsed = (today - start) / (1000 * 60 * 60 * 24);
      return Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    },

    // Get days remaining
    getDaysRemaining(endDate) {
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      return days > 0 ? `${days}d` : '0d';
    },

    // Get policy end color
    getPolicyEndColor(endDate) {
      const end = new Date(endDate);
      const today = new Date();
      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (days <= 30) return 'bg-orange-500';
      return 'bg-green-500';
    },

    // Get policy end text color
    getPolicyEndTextColor(endDate) {
      const end = new Date(endDate);
      const today = new Date();
      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (days <= 30) return 'text-orange-600 dark:text-orange-400';
      return 'text-green-600 dark:text-green-400';
    },

    // Get payment progress
    getPaymentProgress(dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastPayment = new Date(due);
      lastPayment.setDate(lastPayment.getDate() - 30);
      
      const totalDays = Math.max(1, (due - lastPayment) / (1000 * 60 * 60 * 24));
      const daysElapsed = (today - lastPayment) / (1000 * 60 * 60 * 24);
      return Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    },

    // Get days until due
    getDaysUntilDue(dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return days > 0 ? `${days}d` : (days === 0 ? 'Today' : 'Overdue');
    },

    // Get payment due color
    getPaymentDueColor(dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'bg-red-500'; // Overdue
      if (days <= 7) return 'bg-orange-500'; // Due soon
      return 'bg-blue-500'; // Not due yet
    },

    // Get payment due text color
    getPaymentDueTextColor(dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'text-red-600 dark:text-red-400';
      if (days <= 7) return 'text-orange-600 dark:text-orange-400';
      return 'text-blue-600 dark:text-blue-400';
    }
  };
}

// Export table state to window for use in HTML
if (typeof window !== 'undefined') {
  window.createTableState = createTableState;
}
