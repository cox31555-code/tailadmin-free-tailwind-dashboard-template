/**
 * Table Configurations
 * Centralized configuration for all policy tables (Annual, Temporary, Impound)
 */

// Annual Policies Table Configuration
export const annualTableConfig = {
  tableType: 'annual',
  csvFilename: 'annual-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Payment', 'Policy Start', 'Policy End', 'Next Due Date'],
  
  columns: {
    defaultSort: 'name',
    paymentIndex: 4, // Index of payment column for filtering
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'payment', sortType: 'text', dataKey: 'payment', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: true, exportable: true },
      { sortKey: 'duedate', sortType: 'date', dataKey: 'dueDate', hasProgressBar: true, exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },
  
  dateColumns: {
    policyEnd: 6,
    dueDate: 7
  },
  
  statusConfig: {
    removeExpired: true,
    expiringThreshold: 30
  }
};

// Temporary Policies Table Configuration
export const temporaryTableConfig = {
  tableType: 'temporary',
  csvFilename: 'temporary-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Duration', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'name',
    paymentIndex: undefined, // No payment filter for temporary
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'duration', sortType: 'text', dataKey: 'duration', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: true, exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },
  
  dateColumns: {
    policyEnd: 6
  },
  
  statusConfig: {
    removeExpired: false,
    expiringThreshold: 7
  }
};

// Impound Policies Table Configuration
export const impoundTableConfig = {
  tableType: 'impound',
  csvFilename: 'impound-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Duration', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'name',
    paymentIndex: undefined, // No payment filter for impound
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'duration', sortType: 'text', dataKey: 'duration', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: true, exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },
  
  dateColumns: {
    policyEnd: 6
  },
  
  statusConfig: {
    removeExpired: false,
    expiringThreshold: 7
  }
};

// Export configurations to window for use in HTML
if (typeof window !== 'undefined') {
  window.annualTableConfig = annualTableConfig;
  window.temporaryTableConfig = temporaryTableConfig;
  window.impoundTableConfig = impoundTableConfig;
}
