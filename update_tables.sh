#!/bin/bash

# Batch update script for remaining tables
# Updates: table ID, data attributes, JSON button, and pagination

# Define table files and their IDs
declare -A tables
tables["table-impound.html"]="impoundPoliciesTable"
tables["table-expired-annual-only.html"]="expiredAnnualPoliciesTable"
tables["table-expired-temporary-only.html"]="expiredTemporaryPoliciesTable"
tables["table-expired-impound-only.html"]="expiredImpoundPoliciesTable"
tables["table-quotes.html"]="quotesTable"
tables["table-pending-claims.html"]="pendingClaimsTable"
tables["table-completed-claims-list.html"]="completedClaimsTable"
tables["table-contact-form.html"]="contactFormTable"

for file in "${!tables[@]}"; do
    TABLE_ID="${tables[$file]}"
    FILE_PATH="src/partials/table/$file"
    
    echo "Processing $file with ID: $TABLE_ID"
    
    # 1. Add table ID
    sed -i "s/<table class=\"min-w-max sm:min-w-full table-auto overflow-visible\">/<table id=\"$TABLE_ID\" class=\"min-w-max sm:min-w-full table-auto overflow-visible\">/" "$FILE_PATH"
    
    # 2. Add data attributes to all table rows
    sed -i 's/<tr class="hover:bg-gray-50 dark:hover:bg-white\/\[0.03\] transition-colors">/<tr data-filtered-out="false" data-paged-out="false" class="hover:bg-gray-50 dark:hover:bg-white\/[0.03] transition-colors">/g' "$FILE_PATH"
    
    echo "  - Added table ID and data attributes"
done

echo "Step 1 & 2 complete: Table IDs and data attributes added to all 8 tables"
echo "Next: Adding JSON buttons and pagination (requires manual edits due to varying structures)"
