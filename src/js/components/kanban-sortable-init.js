import Sortable from 'sortablejs';

/**
 * Initialize SortableJS for Kanban columns and tasks
 * Provides mobile-friendly drag and drop with touch support
 */
export function initKanbanSortable(alpineComponent) {
  // Wait for DOM to be ready
  setTimeout(() => {
    // Initialize task dragging within/between columns
    initTaskDragging();

    // Initialize column dragging
    initColumnDragging(alpineComponent);
  }, 100);
}

/**
 * Initialize task dragging within and between columns
 */
function initTaskDragging() {
  const columns = document.querySelectorAll('[data-kanban-column]');

  if (columns.length === 0) {
    console.warn('No Kanban columns found to initialize SortableJS');
    return;
  }

  columns.forEach(column => {
    const columnId = column.dataset.kanbanColumn;
    const tasksContainer = column.querySelector('[data-tasks-container]');

    if (!tasksContainer) {
      console.warn(`No tasks container found for column: ${columnId}`);
      return;
    }

    new Sortable(tasksContainer, {
      group: 'kanban-tasks', // Allow drag between columns
      animation: 150, // Smooth animation
      ghostClass: 'sortable-ghost', // Class for ghost element
      dragClass: 'sortable-drag', // Class for dragged element
      chosenClass: 'sortable-chosen', // Class for chosen element
      touchStartThreshold: 5, // Pixels moved before drag starts
      forceFallback: true, // Better cross-browser support
      fallbackTolerance: 3, // Touch tolerance in pixels
      delay: 50, // Slight delay before drag starts (helps with scrolling)
      delayOnTouchOnly: true, // Only apply delay on touch devices

      // Handle drag end - update task position and column
      onEnd: (evt) => {
        const taskId = evt.item.dataset.taskId;
        const newColumnId = evt.to.closest('[data-kanban-column]').dataset.kanbanColumn;
        const oldColumnId = evt.from.closest('[data-kanban-column]').dataset.kanbanColumn;
        const newIndex = evt.newIndex;
        const oldIndex = evt.oldIndex;

        // Dispatch event to Alpine component
        window.dispatchEvent(new CustomEvent('kanban:taskMoved', {
          detail: {
            taskId,
            newColumnId,
            oldColumnId,
            newIndex,
            oldIndex
          }
        }));
      },

      // Visual feedback during drag
      onStart: (evt) => {
        evt.item.classList.add('dragging');
      },

      onMove: (evt) => {
        // Optional: Add custom move logic or restrictions
        return true; // Return false to cancel move
      }
    });
  });

  console.log(`SortableJS initialized for ${columns.length} columns (tasks)`);
}

/**
 * Initialize column dragging to reorder columns
 */
function initColumnDragging(alpineComponent) {
  const columnsContainer = document.querySelector('[data-columns-container]');

  if (!columnsContainer) {
    console.warn('❌ No columns container found for column reordering');
    return;
  }

  const dragHandles = document.querySelectorAll('[data-column-drag-handle]');
  console.log(`🔍 Found ${dragHandles.length} column drag handles`);

  const sortable = new Sortable(columnsContainer, {
    animation: 200,
    handle: '[data-column-drag-handle]', // Only allow dragging from the handle
    ghostClass: 'column-ghost',
    dragClass: 'column-drag',
    chosenClass: 'column-chosen',
    forceFallback: true,
    touchStartThreshold: 8,
    delay: 50,
    delayOnTouchOnly: true,

    onStart: (evt) => {
      console.log('🎯 Column drag started');
    },

    onEnd: (evt) => {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      console.log(`📦 Column moved from ${oldIndex} to ${newIndex}`);

      if (oldIndex !== newIndex) {
        // Dispatch event to Alpine component
        window.dispatchEvent(new CustomEvent('kanban:columnMoved', {
          detail: { oldIndex, newIndex }
        }));
      }
    }
  });

  console.log('✅ SortableJS initialized for column reordering', sortable);
}

/**
 * Reinitialize SortableJS (useful after board switch or data reload)
 */
export function reinitKanbanSortable(alpineComponent) {
  // Destroy existing task dragging instances
  const columns = document.querySelectorAll('[data-kanban-column]');
  columns.forEach(column => {
    const tasksContainer = column.querySelector('[data-tasks-container]');
    if (tasksContainer && tasksContainer.sortable) {
      tasksContainer.sortable.destroy();
    }
  });

  // Destroy existing column dragging instance
  const columnsContainer = document.querySelector('[data-columns-container]');
  if (columnsContainer && columnsContainer.sortable) {
    columnsContainer.sortable.destroy();
  }

  // Reinitialize both
  initKanbanSortable(alpineComponent);
}
