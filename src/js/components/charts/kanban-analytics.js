import ApexCharts from 'apexcharts';
import { parseDateAsLondon, getDateArray, getLondonToday } from '../../utils/londonTime.js';

let distributionChartInstance = null;
let cycleTimeChartInstance = null;

/**
 * Render task distribution chart (stacked bar chart showing task status over time)
 * @param {Array} tasks - Array of task objects
 */
export async function renderKanbanAnalytics(tasks) {
  const container = document.querySelector('#kanbanAnalyticsChart');
  if (!container) return;
  
  // Get last 30 days
  const dates = getDateArray('last30days');
  const categories = dates.map(d => 
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  );
  
  // Status buckets mapping column IDs to display names
  const columnToStatusMap = {
    'backlog': 'Backlog',
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
  };
  
  // Get unique statuses from actual tasks
  const uniqueStatuses = [...new Set(tasks.map(t => t.column))];
  const statuses = uniqueStatuses.map(col => columnToStatusMap[col] || col);
  
  // Initialize series data
  const series = statuses.map(status => ({
    name: status,
    data: Array(dates.length).fill(0)
  }));
  
  // Aggregate task counts by status per day
  tasks.forEach(task => {
    const taskDate = parseDateAsLondon(task.createdAt);
    if (!taskDate) return;
    
    const dayIndex = dates.findIndex(d => {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const taskStart = new Date(taskDate);
      taskStart.setHours(0, 0, 0, 0);
      return dayStart.getTime() === taskStart.getTime();
    });
    
    if (dayIndex >= 0) {
      const statusIndex = statuses.indexOf(columnToStatusMap[task.column] || task.column);
      if (statusIndex >= 0) {
        series[statusIndex].data[dayIndex]++;
      }
    }
  });
  
  const options = {
    series,
    colors: ['#6B7280', '#3B82F6', '#F59E0B', '#8B5CF6', '#10B981'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      stacked: true,
      height: 360,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '80%',
        borderRadius: 2,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories,
      type: 'category',
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: { 
        text: 'Tasks',
        style: {
          color: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit, sans-serif',
      markers: {
        radius: 99
      }
    },
    tooltip: {
      y: {
        formatter: (val) => val + ' task' + (val !== 1 ? 's' : '')
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5
    }
  };
  
  if (distributionChartInstance) {
    distributionChartInstance.updateOptions(options);
  } else {
    distributionChartInstance = new ApexCharts(container, options);
    distributionChartInstance.render();
  }
}

/**
 * Render cycle time chart (average days from creation to completion)
 * @param {Array} tasks - Array of task objects
 */
export function renderCycleTimeChart(tasks) {
  const container = document.querySelector('#cycleTimeChart');
  if (!container) return;
  
  // Calculate cycle times for completed tasks
  const completedTasks = tasks.filter(t => t.column === 'done' && t.createdAt && t.updatedAt);
  const cycleTimes = completedTasks.map(t => {
    const created = new Date(t.createdAt);
    const updated = new Date(t.updatedAt);
    return Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
  });
  
  const avgCycleTime = cycleTimes.length > 0
    ? (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1)
    : 0;
  
  // Take last 20 completed tasks
  const recentCycleTimes = cycleTimes.slice(-20);
  const categories = recentCycleTimes.map((_, i) => `Task ${i + 1}`);
  
  const options = {
    series: [{
      name: 'Cycle Time',
      data: recentCycleTimes
    }],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'line',
      height: 300,
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#3B82F6'],
    xaxis: {
      categories,
      title: { 
        text: 'Last 20 Completed Tasks',
        style: {
          color: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: { 
        text: 'Days',
        style: {
          color: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        }
      }
    },
    title: {
      text: `Average Cycle Time: ${avgCycleTime} days`,
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'Outfit, sans-serif',
        color: '#1f2937'
      }
    },
    tooltip: {
      y: {
        formatter: (val) => val + ' day' + (val !== 1 ? 's' : '')
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5
    },
    markers: {
      size: 4,
      colors: ['#3B82F6'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    }
  };
  
  if (cycleTimeChartInstance) {
    cycleTimeChartInstance.updateOptions(options);
  } else {
    cycleTimeChartInstance = new ApexCharts(container, options);
    cycleTimeChartInstance.render();
  }
}

/**
 * Destroy chart instances (for cleanup)
 */
export function destroyKanbanCharts() {
  if (distributionChartInstance) {
    distributionChartInstance.destroy();
    distributionChartInstance = null;
  }
  if (cycleTimeChartInstance) {
    cycleTimeChartInstance.destroy();
    cycleTimeChartInstance = null;
  }
}
