#!/usr/bin/env python3
import re

# JSON button HTML
json_button = '''
      <!-- JSON Export button -->
      <button
        onclick="window.exportTableToJSON()"
        class="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs sm:text-theme-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-[#0c192c] dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 whitespace-nowrap"
      >
        <svg
          class="stroke-current fill-none"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M7 3L5 6M7 3L9 6M7 3v3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <span class="hidden sm:inline">Export JSON</span>
      </button>'''

# New pagination HTML
new_pagination = '''  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-3 py-5 dark:border-gray-800 sm:px-6">
    <!-- Pagination info text -->
    <div class="text-theme-xs text-gray-600 dark:text-gray-400">
      Showing <span x-text="paginationInfo.start"></span> to <span x-text="paginationInfo.end"></span> of <span x-text="paginationInfo.total"></span> results
    </div>
    
    <!-- Pagination controls -->
    <div class="flex items-center justify-center gap-1">
      <button 
        @click="prevPage()" 
        :disabled="currentPage === 1"
        :class="currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''"
        class="rounded-lg border border-gray-300 bg-white px-2 py-2 sm:px-4 text-theme-xs sm:text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0c192c] dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Prev
      </button>

      <div class="pagination-scroller flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
        <template x-for="page in totalPages" :key="page">
          <button 
            @click="setPage(page)"
            :class="currentPage === page ? 'bg-brand-500 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.03]'"
            class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-theme-xs sm:text-theme-sm font-medium"
            x-text="page"
          ></button>
        </template>
      </div>

      <button 
        @click="nextPage()" 
        :disabled="currentPage >= totalPages"
        :class="currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''"
        class="rounded-lg border border-gray-300 bg-white px-2 py-2 sm:px-4 text-theme-xs sm:text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0c192c] dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Next
      </button>
    </div>
  </div>'''

# List of files to update
files = [
    'src/partials/table/table-impound.html',
    'src/partials/table/table-expired-annual-only.html',
    'src/partials/table/table-expired-temporary-only.html',
    'src/partials/table/table-expired-impound-only.html',
    'src/partials/table/table-quotes.html',
    'src/partials/table/table-pending-claims.html',
    'src/partials/table/table-completed-claims-list.html',
    'src/partials/table/table-contact-form.html'
]

# Pattern to find where to insert JSON button (after CSV export button)
csv_button_end = re.compile(r'(\s*<span class="hidden sm:inline">Export CSV</span>\s*</button>)\s*(</div>)', re.MULTILINE)

# Pattern to find old pagination
old_pagination = re.compile(
    r'<div class="flex flex-wrap items-center justify-center gap-1.*?</div>\s*</div>',
    re.DOTALL
)

for filepath in files:
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Add JSON button after CSV button
    content = csv_button_end.sub(r'\1' + json_button + r'\2', content)
    
    # Replace old pagination with new pagination
    # Find the last pagination div (at the end of the file)
    matches = list(old_pagination.finditer(content))
    if matches:
        last_match = matches[-1]
        content = content[:last_match.start()] + new_pagination + content[last_match.end():]
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"  ✓ Updated {filepath}")

print("\nAll 8 tables updated with JSON buttons and pagination!")
