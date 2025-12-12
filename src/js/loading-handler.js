/**
 * Loading handler for page navigation
 * Shows a loading overlay when users navigate to a new page
 */

/**
 * Initialize loading state for navigation
 * Attaches click handlers to all navigation links
 */
export function initLoadingHandler() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Initialize Alpine reference if available
  const initAlpineLoading = () => {
    if (window.Alpine && window.Alpine.__data) {
      // Alpine is available, we'll set loading via Alpine events
      document.addEventListener('click', handleLinkClick);
    }
  };

  // Handle link clicks for navigation
  const handleLinkClick = (event) => {
    const link = event.target.closest('a[href]');
    
    if (!link) return;

    const href = link.getAttribute('href');
    
    // Skip if:
    // - href is empty or just '#'
    // - href starts with '#' (internal anchor)
    // - href is for the current page
    // - link has target="_blank" or target="_parent"
    // - it's an external link (starts with http)
    if (
      !href ||
      href === '#' ||
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      link.target === '_blank' ||
      link.target === '_parent' ||
      link.target === '_top'
    ) {
      return;
    }

    // Skip if link is to the same page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const linkPage = href.split('/').pop();
    if (currentPage === linkPage || (currentPage === '' && linkPage === 'index.html')) {
      return;
    }

    // Show loading overlay by setting Alpine data
    showLoading();
  };

  /**
   * Show loading overlay
   * Updates Alpine.js state to display the preloader
   */
  const showLoading = () => {
    // Find the body element with Alpine data
    const body = document.querySelector('body[x-data]');
    if (body && body.__x) {
      // Direct Alpine component update
      body.__x.$data.isLoading = true;
    }
  };

  /**
   * Hide loading overlay when page loads
   */
  const hideLoading = () => {
    const body = document.querySelector('body[x-data]');
    if (body && body.__x) {
      body.__x.$data.isLoading = false;
    }
  };

  // Hide loading when page fully loads
  const handlePageLoad = () => {
    hideLoading();
  };

  // Set up event listeners
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handlePageLoad);
  } else {
    // Page already loaded
    hideLoading();
  }

  // Attach click handler to document
  document.addEventListener('click', handleLinkClick);

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    // Show loading when user navigates away
    showLoading();
  });
}

// Initialize when module is imported
initLoadingHandler();
