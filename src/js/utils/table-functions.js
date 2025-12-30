import { readOrdersData, writeOrdersData } from "./orders-data-store.js";

/**
 * Shared Table Functions
 * Reusable functions for all policy tables
 */

/**
 * Initialize table with configuration
 * @param {Object} tableConfig - Table configuration object
 */
export function initializeTable(tableConfig) {
  // Store table config globally
  window.currentTableConfig = tableConfig;

  // Initialize data storage
  storeTableData();

  // Set up mutation observer
  setupTableObserver();

  // Make functions globally available
  window.filterAndSearchTable = filterAndSearchTable;
  window.exportTableToCSV = () => exportTableToCSV(tableConfig);
  window.getSortValue = getSortValue;
  window.performSort = performSort;
  window.calculatePolicyCounts = calculatePolicyCounts;
  window.extractRowData = extractRowData;
}

/**
 * Extract data from a table row based on configuration
 * @param {HTMLTableRowElement} row - Table row element
 * @param {Object} config - Table configuration
 * @returns {Object} Extracted data object
 */
export function extractRowData(row, config) {
  const cells = row.querySelectorAll('td');
  const orderData = { type: config.tableType };

  // Extract data based on column configuration
  config.columns.list.forEach((col, index) => {
    if (col.dataKey && cells[index]) {
      if (col.isMergedCell) {
        // Handle merged cells (name + email)
        const firstP = cells[index].querySelector('p:first-child');
        const lastP = cells[index].querySelector('p:last-child');
        if (col.dataKey.includes('.')) {
          const keys = col.dataKey.split('.');
          orderData[keys[0]] = firstP ? firstP.textContent.trim() : '';
          orderData[keys[1]] = lastP ? lastP.textContent.trim() : '';
        }
      } else if (col.hasProgressBar) {
        // Extract date from progress bar container
        const dateP = cells[index].querySelector('p:first-child');
        orderData[col.dataKey] = dateP ? dateP.textContent.trim() : '';
      } else {
        // Simple cell
        orderData[col.dataKey] = cells[index].textContent.trim();
      }
    }
  });

  return orderData;
}

/**
 * Store table data in localStorage
 */
function storeTableData() {
  const config = window.currentTableConfig;
  let allOrders = readOrdersData();

  // Filter out old data of this type
  allOrders = allOrders.filter((order) => order.type !== config.tableType);

  // Add new orders from this page
  const tableRows = document.querySelectorAll("table tbody tr");

  tableRows.forEach((row) => {
    // Only extract data if the row is part of the current table structure and has cells
    if (row.querySelectorAll("td").length > 0) {
      const orderData = extractRowData(row, config);
      allOrders.push(orderData);
    }
  });

  writeOrdersData(allOrders);
}

/**
 * Set up mutation observer for table changes
 */
function setupTableObserver() {
  const tableContainer = document.querySelector('table');
  if (tableContainer) {
    const observer = new MutationObserver(storeTableData);
    observer.observe(tableContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
}

/**
 * Filter and search table
 * @param {string} searchQuery - Search query
 * @param {string} filterPayment - Payment filter
 */
function filterAndSearchTable(searchQuery = '', filterPayment = 'all') {
  const config = window.currentTableConfig;
  const tbody = document.querySelector('table tbody');
  const rows = tbody.querySelectorAll('tr');
  const searchLower = searchQuery.toLowerCase();

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let matchesSearch = true;
    let matchesFilter = true;

    // Check search query
    if (searchLower) {
      const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
      matchesSearch = rowText.includes(searchLower);
    }

    // Check payment filter
    if (filterPayment !== 'all' && config.columns.paymentIndex !== undefined) {
      const paymentCell = cells[config.columns.paymentIndex];
      const paymentText = paymentCell ? paymentCell.textContent.toLowerCase().trim() : '';
      matchesFilter = paymentText === filterPayment.toLowerCase();
    }

    // Show or hide row
    row.style.display = matchesSearch && matchesFilter ? '' : 'none';
  });

  // Update statistics counts after filtering
  window.updateStatsCounts();
}

/**
 * Export table to CSV
 * @param {Object} config - Table configuration
 */
function exportTableToCSV(config) {
  const table = document.querySelector('table');
  const tbody = table.querySelector('tbody');
  const rows = [];

  rows.push(config.csvHeaders.join(','));

  tbody.querySelectorAll('tr').forEach(row => {
    // Skip hidden rows
    if (row.style.display === 'none') return;

    const cells = row.querySelectorAll('td');
    const rowData = [];

    config.columns.list.forEach((col, index) => {
      if (col.exportable === false) return; // Skip non-exportable columns (like Actions)

      let cellText = '';
      if (col.isMergedCell) {
        // Extract from merged cell
        const firstP = cells[index]?.querySelector('p:first-child');
        const lastP = cells[index]?.querySelector('p:last-child');
        rowData.push(`"${firstP ? firstP.textContent.trim() : ''}"`);
        rowData.push(`"${lastP ? lastP.textContent.trim() : ''}"`);
      } else if (col.hasProgressBar) {
        // Extract date from progress bar
        const dateP = cells[index]?.querySelector('p:first-child');
        cellText = dateP ? dateP.textContent.trim() : '';
        cellText = cellText.replace(/\s+/g, ' ').trim();
        rowData.push(`"${cellText}"`);
      } else {
        cellText = cells[index] ? cells[index].textContent.trim() : '';
        cellText = cellText.replace(/\s+/g, ' ').trim();
        rowData.push(`"${cellText}"`);
      }
    });

    rows.push(rowData.join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', config.csvFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper: Determine if policy is expiring soon
 */
function isExpiringSoon(policyEndDate, daysThreshold = 30) {
  try {
    const endDate = new Date(policyEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Helper: Get policy status
 */
function getStatus(policyEndDate) {
  try {
    const endDate = new Date(policyEndDate);
    const today = new Date();
    if (endDate < today) return 'Expired';
    if (isExpiringSoon(policyEndDate)) return 'Expiring Soon';
    return 'Active';
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Calculate policy counts from visible rows
 */
function calculatePolicyCounts(tableType) {
  const config = window.currentTableConfig;
  const rows = document.querySelectorAll('table tbody tr');
  let total = 0, active = 0, expiringSoon = 0, nextDue = 0;

  // For pending claims table
  if (tableType === 'pendingClaims') {
    let propertyDamage = 0, bodilyInjury = 0, urgent = 0;

    rows.forEach(row => {
      if (row.style.display === 'none') return; // Skip hidden rows

      total++;
      const cells = row.querySelectorAll('td');

      // Find the claim type (index 0)
      const claimTypeCell = cells[0];
      if (claimTypeCell) {
        const claimTypeText = claimTypeCell.textContent.trim().toLowerCase();
        if (claimTypeText.includes('property damage')) propertyDamage++;
        else if (claimTypeText.includes('bodily injury')) bodilyInjury++;
      }

      // Find the days pending (index 5) to check for urgent claims
      const daysPendingCell = cells[5];
      if (daysPendingCell) {
        const daysPendingText = daysPendingCell.textContent.trim().toLowerCase();
        if (daysPendingText.includes('urgent') || daysPendingText.match(/\d+/) && parseInt(daysPendingText) > 30) {
          urgent++;
        }
      }
    });

    return { total, propertyDamage, bodilyInjury, urgent };
  }

  // For completed claims table
  if (tableType === 'completedClaims') {
    let thisMonth = 0, lastMonth = 0, totalSettlement = 0, settlementCount = 0;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    rows.forEach(row => {
      if (row.style.display === 'none') return; // Skip hidden rows

      total++;
      const cells = row.querySelectorAll('td');

      // Find the completion date (index 5)
      const completionDateCell = cells[5];
      if (completionDateCell) {
        const completionDateText = completionDateCell.textContent.trim();
        const completionDate = new Date(completionDateText);

        if (completionDate >= thisMonthStart) {
          thisMonth++;
        } else if (completionDate >= lastMonthStart && completionDate <= lastMonthEnd) {
          lastMonth++;
        }
      }

      // Find settlement amount (index 6)
      const settlementCell = cells[6];
      if (settlementCell) {
        const settlementText = settlementCell.textContent.trim().replace(/[£$,]/g, '');
        const settlementAmount = parseFloat(settlementText);
        if (!isNaN(settlementAmount)) {
          totalSettlement += settlementAmount;
          settlementCount++;
        }
      }
    });

    const avgSettlement = settlementCount > 0 ? `£${Math.round(totalSettlement / settlementCount).toLocaleString()}` : '£0';
    return { total, thisMonth, lastMonth, avgSettlement };
  }

  // For quotes table, count by type instead of status
  if (tableType === 'quotes') {
    rows.forEach(row => {
      if (row.style.display === 'none') return; // Skip hidden rows

      total++;
      const cells = row.querySelectorAll('td');

      // Find the type column (index 4)
      const typeCell = cells[4];
      if (typeCell) {
        const typeText = typeCell.textContent.trim().toLowerCase();
        if (typeText.includes('annual')) active++;
        else if (typeText.includes('temporary')) expiringSoon++;
        else if (typeText.includes('impound')) nextDue++;
      }
    });
  } else if (tableType === 'contactForm') {
    // For contact form, count by message type
    rows.forEach(row => {
      if (row.style.display === 'none') return; // Skip hidden rows

      total++;
      const cells = row.querySelectorAll('td');

      // Find the type column (index 2 for contact form)
      const typeCell = cells[2];
      if (typeCell) {
        const typeText = typeCell.textContent.trim().toLowerCase();
        // Count as "unread" for blue badge - could be enhanced with actual read/unread tracking
        if (typeText.includes('quote')) active++;
        // Count as "read" for green badge
        else if (typeText.includes('general') || typeText.includes('business')) expiringSoon++;
      }
    });
  } else {
    // Original logic for policy tables
    rows.forEach(row => {
      if (row.style.display === 'none') return; // Skip hidden rows

      const cells = row.querySelectorAll('td');

      // Get policy end date to determine status
      const policyEndIndex = config.dateColumns.policyEnd;
      const policyEndCell = cells[policyEndIndex];
      const dateP = policyEndCell?.querySelector('p:first-child');
      const policyEndDate = dateP ? dateP.textContent.trim() : '';

      if (policyEndDate) {
        const status = getStatus(policyEndDate);
        if (status !== 'Expired') {
          total++;
          if (status === 'Active') active++;
          if (status === 'Expiring Soon') expiringSoon++;
        }
      }

      // Count next due payments (if dueDate column exists)
      if (config.dateColumns.dueDate !== undefined) {
        const dueDateIndex = config.dateColumns.dueDate;
        const dueDateCell = cells[dueDateIndex];
        const dueDateP = dueDateCell?.querySelector('p:first-child');
        const dueDate = dueDateP ? dueDateP.textContent.trim() : '';

        if (dueDate && dueDate !== 'N/A') {
          const due = new Date(dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

          // Count payments due within next 7 days
          if (daysUntilDue >= 0 && daysUntilDue <= 7) {
            nextDue++;
          }
        }
      }
    });
  }

  return { total, active, expiringSoon, nextDue };
}

/**
 * Update stats counts
 */
window.updateStatsCounts = function() {
  const counts = calculatePolicyCounts();
  const event = new CustomEvent('update-stats', { detail: counts });
  document.dispatchEvent(event);
};

/**
 * Extract and normalize values for sorting
 */
function getSortValue(cell, columnName) {
  const config = window.currentTableConfig;
  const columnDef = config.columns.list.find(col => col.sortKey === columnName);
  
  if (!columnDef) return '';

  let value = '';

  if (columnDef.sortType === 'name') {
    const nameParagraph = cell.querySelector('p:first-child');
    value = nameParagraph ? nameParagraph.textContent.trim() : '';
    return value.toLowerCase();
  } else if (columnDef.sortType === 'price') {
    value = cell.textContent.trim().replace(/[£$,]/g, '');
    return parseFloat(value) || 0;
  } else if (columnDef.sortType === 'date') {
    const dateP = cell.querySelector('p:first-child');
    const dateStr = dateP ? dateP.textContent.trim() : cell.textContent.trim();
    const date = new Date(dateStr);
    return date.getTime() || 0;
  } else {
    value = cell.textContent.trim();
    return value.toLowerCase();
  }
}

/**
 * Perform sorting
 */
function performSort(columnName, direction) {
  const config = window.currentTableConfig;
  const tbody = document.querySelector('table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const columnIndex = config.columns.list.findIndex(col => col.sortKey === columnName);
  if (columnIndex === -1) return;

  rows.sort((a, b) => {
    const aCell = a.querySelectorAll('td')[columnIndex];
    const bCell = b.querySelectorAll('td')[columnIndex];

    const aValue = getSortValue(aCell, columnName);
    const bValue = getSortValue(bCell, columnName);

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Re-append rows in sorted order
  rows.forEach(row => tbody.appendChild(row));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.tableConfig) {
      initializeTable(window.tableConfig);
    }
  });
} else {
  if (window.tableConfig) {
    initializeTable(window.tableConfig);
  }
}
