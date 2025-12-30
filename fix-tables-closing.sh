#!/bin/bash

# List of files to update
files=(
  "src/partials/table/table-quotes.html"
  "src/partials/table/table-contact-form.html"
  "src/partials/table/table-pending-claims.html"
  "src/partials/table/table-completed-claims-list.html"
  "src/partials/table/table-expired-annual-only.html"
  "src/partials/table/table-expired-temporary-only.html"
  "src/partials/table/table-expired-impound-only.html"
  "src/partials/table/table-tickets.html"
)

for file in "${files[@]}"; do
  # Find the line with </table> and add proper indentation
  sed -i 's/    <\/table>/      <\/table>\n    <\/div>/g' "$file"
  echo "Updated: $file"
done

echo "All tables updated!"
