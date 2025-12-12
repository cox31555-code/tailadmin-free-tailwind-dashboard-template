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

  // Handle link clicks for navigation
  const handleLinkClick = (event) => {
    const link = event.target.closest('a[href]');

    if (!link) return;

    const href = link.getAttribute('href');

    // Skip if:
    // - href is empty or just '#'
    // - href starts with '#' (internal anchor)
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

    // Show loading overlay by dispatching Alpine event
    showLoading();
  };

  /**
   * Show loading overlay
   * Sets the isLoading state to true via Alpine
   */
  const showLoading = () => {
    // Find the body element with Alpine data
    const body = document.querySelector('body[x-data]');
    if (body && body.__x && body.__x.$data) {
      body.__x.$data.isLoading = true;
    }
  };

  // Attach click handler to document (event delegation)
  document.addEventListener('click', handleLinkClick, true);

  // Show loading on page unload/navigation
  window.addEventListener('beforeunload', showLoading);
}

// Initialize when module is imported
initLoadingHandler();
