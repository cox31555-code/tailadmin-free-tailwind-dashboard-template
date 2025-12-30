The dynamic active/expired logic has been implemented.

**Summary of changes:**
1.  **Refactored `table-functions.js`**: Extracted `extractRowData` to allow capturing row data before removal.
2.  **Updated `table-base.js`**:
    *   `removeExpiredPolicies` now extracts expired rows, adds them to `localStorage` (key: `ordersData`), and then removes them from the DOM.
    *   `createTableState` now includes logic to load expired policies from `localStorage` for the "Expired" pages.
3.  **Updated Expired Partials**:
    *   `table-expired-annual-only.html`, `table-expired-temporary-only.html`, and `table-expired-impound-only.html` now use Alpine.js (`x-for`) to render data dynamically from `expiredPolicies`.
4.  **Populated Active Tables**:
    *   `table-06.html` (Annual), `table-temporary.html`, and `table-impound.html` have been updated with 5 active, realistic data entries each (dates in late 2025 or 2026).

**Verification:**
*   **Active Tables**: Display 5 new rows with future dates.
*   **Expired Tables**: Initially empty (or showing "No expired policies found").
*   **Logic**: If an active policy's end date passes (based on local system time), it will be automatically moved to the corresponding Expired table upon visiting the active page (which triggers the check).

The system is now ready for use.
