/**
 * Table Configurations
 * Centralized configuration for all policy tables (Annual, Temporary, Impound)
 */

// Annual Policies Table Configuration
export const annualTableConfig = {
  tableSelector: '#annualPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
    recordDate: 5,
    policyEnd: 6,
    dueDate: 7
  },

  statusConfig: {
    removeExpired: true,
    expiringThreshold: 30,
    recentDays: 30
  }
};

// Temporary Policies Table Configuration
export const temporaryTableConfig = {
  tableSelector: '#temporaryPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
    recordDate: 5,
    policyEnd: 6
  },

  statusConfig: {
    removeExpired: true,
    expiringThreshold: 7,
    recentDays: 30
  }
};

// Impound Policies Table Configuration
export const impoundTableConfig = {
  tableSelector: '#impoundPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
    recordDate: 4,
    policyEnd: 5
  },

  statusConfig: {
    removeExpired: true,
    expiringThreshold: 7,
    recentDays: 30
  }
};

// Expired Annual Policies Table Configuration
export const expiredAnnualTableConfig = {
  tableSelector: '#expiredAnnualPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
  tableSelector: '#expiredTemporaryPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
  tableSelector: '#expiredImpoundPoliciesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
  tableSelector: '#quotesTable',
  itemsPerPage: 10,
  paginationEnabled: true,
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
      { sortKey: 'type', sortType: 'text', dataKey: 'policyType', exportable: true },
      { sortKey: 'policystart', sortType: 'date', dataKey: 'policyStart', exportable: true },
      { sortKey: 'validuntil', sortType: 'date', dataKey: 'validUntil', exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {
    recordDate: 0,
    validUntil: 6
  },

  statusConfig: {
    removeExpired: false,
    expiringThreshold: 30,
    recentDays: 30
  }
};

// Contact Form Table Configuration
export const contactFormTableConfig = {
  tableSelector: '#contactFormTable',
  itemsPerPage: 10,
  paginationEnabled: true,
  tableType: 'contactForm',
  csvFilename: 'contact-form-submissions.csv',
  csvHeaders: ['Name', 'Email', 'Phone Number', 'Policy Reference', 'Type', 'Date Received', 'Time Received', 'Message'],

  columns: {
    defaultSort: 'date',
    paymentIndex: undefined,
    list: [
      { sortKey: 'name', sortType: 'text', dataKey: 'name', exportable: true },
      { sortKey: 'email', sortType: 'text', dataKey: 'email', exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'policyref', sortType: 'text', dataKey: 'policyRef', exportable: true },
      { sortKey: 'type', sortType: 'text', dataKey: 'inquiryType', exportable: true },
      { sortKey: 'date', sortType: 'date', dataKey: 'date.time', isMergedCell: true, exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {},

  statusConfig: {
    removeExpired: false,
    expiringThreshold: 30
  }
};

// Pending Claims Table Configuration
export const pendingClaimsTableConfig = {
  tableSelector: '#pendingClaimsTable',
  itemsPerPage: 10,
  paginationEnabled: true,
  tableType: 'pendingClaims',
  csvFilename: 'pending-claims.csv',
  csvHeaders: ['Claim Type', 'Claimant Name', 'Email', 'Phone', 'Incident Date', 'Days Pending'],

  columns: {
    defaultSort: 'incidentdate',
    paymentIndex: undefined,
    list: [
      { sortKey: 'claimtype', sortType: 'text', dataKey: 'claimType', exportable: true },
      { sortKey: 'name', sortType: 'text', dataKey: 'name', exportable: true },
      { sortKey: 'email', sortType: 'text', dataKey: 'email', exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'incidentdate', sortType: 'date', dataKey: 'incidentDate', exportable: true },
      { sortKey: 'dayspending', sortType: 'number', dataKey: 'daysPending', exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {
    incidentDate: 4
  },

  statusConfig: {
    removeExpired: false,
    expiringThreshold: 30
  }
};

// Completed Claims Table Configuration
export const completedClaimsTableConfig = {
  tableSelector: '#completedClaimsTable',
  itemsPerPage: 10,
  paginationEnabled: true,
  tableType: 'completedClaims',
  csvFilename: 'completed-claims.csv',
  csvHeaders: ['Claim Type', 'Claimant Name', 'Email', 'Phone', 'Incident Date', 'Completion Date', 'Settlement Amount'],

  columns: {
    defaultSort: 'completiondate',
    paymentIndex: undefined,
    list: [
      { sortKey: 'claimtype', sortType: 'text', dataKey: 'claimType', exportable: true },
      { sortKey: 'name', sortType: 'text', dataKey: 'name', exportable: true },
      { sortKey: 'email', sortType: 'text', dataKey: 'email', exportable: true },
      { sortKey: 'phone', sortType: 'text', dataKey: 'phone', exportable: true },
      { sortKey: 'incidentdate', sortType: 'date', dataKey: 'incidentDate', exportable: true },
      { sortKey: 'completiondate', sortType: 'date', dataKey: 'completionDate', exportable: true },
      { sortKey: 'settlement', sortType: 'price', dataKey: 'settlement', exportable: true },
      { sortKey: null, exportable: false } // Actions column
    ]
  },

  dateColumns: {
    incidentDate: 4,
    completionDate: 5
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
  window.contactFormTableConfig = contactFormTableConfig;
  window.pendingClaimsTableConfig = pendingClaimsTableConfig;
  window.completedClaimsTableConfig = completedClaimsTableConfig;
}
