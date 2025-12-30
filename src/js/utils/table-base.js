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

    // Initialization
    init() {
      // Remove expired policies from DOM on page load (if configured)
      if (statusConfig.removeExpired) {
        this.removeExpiredPolicies();
      }
      // Initialize stats on page load
      this.updatePolicyCounts();
      // Listen for stats updates from filter/search
      document.addEventListener('update-stats', (e) => {
        this.policyCounts = e.detail;
      });
    },

    // Remove expired policies
    removeExpiredPolicies() {
      const rows = document.querySelectorAll('table tbody tr');
      const endDateColumnIndex = dateColumns.policyEnd;
      
      rows.forEach(row => {
        const policyEndCell = row.querySelectorAll('td')[endDateColumnIndex];
        const dateP = policyEndCell?.querySelector('p:first-child');
        const policyEndDate = dateP ? dateP.textContent.trim() : '';
        
        if (policyEndDate) {
          const endDate = new Date(policyEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (endDate < today) {
            row.remove(); // Remove expired policies
          }
        }
      });
    },

    // Update policy counts
    updatePolicyCounts() {
      this.policyCounts = window.calculatePolicyCounts();
    },

    // Handle column sorting
    handleSort(columnName) {
      if (this.sortColumn === columnName) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = columnName;
        this.sortDirection = 'asc';
      }
      window.performSort(this.sortColumn, this.sortDirection);
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
