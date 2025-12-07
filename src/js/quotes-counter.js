/**
 * Count quotes from the table based on date range
 */
export function getQuotesCount() {
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
  const tableRows = document.querySelectorAll(
    'table tbody tr'
  );

  tableRows.forEach((row) => {
    // Get the date from the first cell (Date & Time column)
    const dateCell = row.querySelector('td:first-child p:first-child');
    if (!dateCell) return;

    const dateText = dateCell.textContent.trim();

    // Parse the date (format: "Nov 12, 2025")
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
  });

  return {
    today: todayCount,
    last7Days: last7DaysCount,
    past30Days: past30DaysCount,
  };
}

/**
 * Watch for table changes and update counts
 */
export function watchQuotesTable(callback) {
  // Initial count
  callback(getQuotesCount());

  // Watch for DOM changes in the table
  const observer = new MutationObserver(() => {
    callback(getQuotesCount());
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

  return observer;
}
