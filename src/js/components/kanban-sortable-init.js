import Sortable from 'sortablejs';

/**
 * Initialize SortableJS for Kanban columns
 * Provides mobile-friendly drag and drop with touch support
 */
export function initKanbanSortable(alpineComponent) {
  // Wait for DOM to be ready
  setTimeout(() => {
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
        },
        
        onEnd: (evt) => {
          evt.item.classList.remove('dragging');
        }
      });
    });
    
    console.log(`SortableJS initialized for ${columns.length} columns`);
  }, 100);
}

/**
 * Reinitialize SortableJS (useful after board switch or data reload)
 */
export function reinitKanbanSortable(alpineComponent) {
  // Destroy existing instances
  const columns = document.querySelectorAll('[data-kanban-column]');
  columns.forEach(column => {
    const tasksContainer = column.querySelector('[data-tasks-container]');
    if (tasksContainer && tasksContainer.sortable) {
      tasksContainer.sortable.destroy();
    }
  });
  
  // Reinitialize
  initKanbanSortable(alpineComponent);
}
