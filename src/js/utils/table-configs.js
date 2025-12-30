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
    removeExpired: true,
    expiringThreshold: 7
  }
};

// Impound Policies Table Configuration
export const impoundTableConfig = {
  tableType: 'impound',
  csvFilename: 'impound-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'name',
    paymentIndex: undefined, // No payment filter for impound
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: true, exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {
    policyEnd: 5
  },
  
  statusConfig: {
    removeExpired: true,
    expiringThreshold: 7
  }
};

// Expired Annual Policies Table Configuration
export const expiredAnnualTableConfig = {
  tableType: 'expired-annual',
  csvFilename: 'expired-annual-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Payment', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'policyend',
    paymentIndex: 4,
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'payment', sortType: 'text', dataKey: 'payment', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: false, exportable: true },
      { sortKey: null, exportable: false }
    ]
  },

  dateColumns: {
    policyEnd: 6
  },

  statusConfig: {
    removeExpired: false,
    showOnlyExpired: true,
    expiringThreshold: 30
  }
};

// Expired Temporary Policies Table Configuration
export const expiredTemporaryTableConfig = {
  tableType: 'expired-temporary',
  csvFilename: 'expired-temporary-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Duration', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'policyend',
    paymentIndex: undefined,
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'duration', sortType: 'text', dataKey: 'duration', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: false, exportable: true },
      { sortKey: null, exportable: false }
    ]
  },

  dateColumns: {
    policyEnd: 6
  },

  statusConfig: {
    removeExpired: false,
    showOnlyExpired: true,
    expiringThreshold: 7
  }
};

// Expired Impound Policies Table Configuration
export const expiredImpoundTableConfig = {
  tableType: 'expired-impound',
  csvFilename: 'expired-impound-policies.csv',
  csvHeaders: ['Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Policy Start', 'Policy End'],

  columns: {
    defaultSort: 'policyend',
    paymentIndex: undefined,
    list: [
      { sortKey: 'name', sortType: 'name', dataKey: 'name.email', isMergedCell: true, exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'price', sortType: 'price', dataKey: 'price', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'policyend', sortType: 'date', dataKey: 'policyEnd', hasProgressBar: false, exportable: true },
      { sortKey: null, exportable: false }
    ]
  },

  dateColumns: {
    policyEnd: 5
  },

  statusConfig: {
    removeExpired: false,
    showOnlyExpired: true,
    expiringThreshold: 7
  }
};

// Quotes Table Configuration
export const quotesTableConfig = {
  tableType: 'quotes',
  csvFilename: 'quotes.csv',
  csvHeaders: ['Date', 'Time', 'Customer Email', 'Vehicle', 'Quote Amount', 'Policy Type', 'Policy Start', 'Valid Until'],

  columns: {
    defaultSort: 'date',
    paymentIndex: undefined, // No payment filter for quotes
    list: [
      { sortKey: 'date', sortType: 'date', dataKey: 'date.time', isMergedCell: true, exportable: true },
      { sortKey: 'email', sortType: 'text', dataKey: 'email', exportable: true },
      { sortKey: 'vehicle', sortType: 'text', dataKey: 'vehicle', exportable: true },
      { sortKey: 'amount', sortType: 'price', dataKey: 'amount', exportable: true },
      { sortKey: 'type', sortType: 'text', dataKey: 'type', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'validuntil', sortType: 'date', dataKey: 'validUntil', exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {
    validUntil: 6
  },

  statusConfig: {
    removeExpired: false,
    expiringThreshold: 30
  }
};

// Export configurations to window for use in HTML
if (typeof window !== 'undefined') {
  window.annualTableConfig = annualTableConfig;
  window.temporaryTableConfig = temporaryTableConfig;
  window.impoundTableConfig = impoundTableConfig;
  window.expiredAnnualTableConfig = expiredAnnualTableConfig;
  window.expiredTemporaryTableConfig = expiredTemporaryTableConfig;
  window.expiredImpoundTableConfig = expiredImpoundTableConfig;
  window.quotesTableConfig = quotesTableConfig;
}
