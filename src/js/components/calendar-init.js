import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getLondonNow, convertToLondonTime } from "../utils/londonTime.js";

/*========Calender Js=========*/
/*==========================*/

document.addEventListener("DOMContentLoaded", function () {
  const calendarWrapper = document.querySelector("#calendar");

  if (calendarWrapper) {
    /*=================*/
    //  Calender Date variable - using London timezone
    /*=================*/
    const newDate = getLondonNow();
    const getDynamicMonth = () => {
      const month = newDate.getMonth() + 1;
      return month < 10 ? `0${month}` : `${month}`;
    };

    /*=================*/
    // Calender Modal Elements
    /*=================*/
    const getModalTitleEl = document.querySelector("#event-title");
    const getModalStartDateEl = document.querySelector("#event-start-date");
    const getModalEndDateEl = document.querySelector("#event-end-date");
    const getModalAddBtnEl = document.querySelector(".btn-add-event");
    const getModalUpdateBtnEl = document.querySelector(".btn-update-event");
    const calendarsEvents = {
      Danger: "danger",
      Success: "success",
      Primary: "primary",
      Warning: "warning",
    };

    /*=====================*/
    // Calendar Elements and options
    /*=====================*/
    const calendarEl = document.querySelector("#calendar");

    const calendarHeaderToolbar = {
      left: "prev,next addEventButton",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };

    const calendarEventsList = [
      {
        id: 1,
        title: "Event Conf.",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-01`,
        extendedProps: { calendar: "Danger" },
      },
      {
        id: 2,
        title: "Seminar #4",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-07`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-10`,
        extendedProps: { calendar: "Success" },
      },
      {
        groupId: "999",
        id: 3,
        title: "Meeting #5",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-09T16:00:00`,
        extendedProps: { calendar: "Primary" },
      },
      {
        groupId: "999",
        id: 4,
        title: "Submission #1",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-16T16:00:00`,
        extendedProps: { calendar: "Warning" },
      },
      {
        id: 5,
        title: "Seminar #6",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-11`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-13`,
        extendedProps: { calendar: "Danger" },
      },
      {
        id: 6,
        title: "Meeting 3",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T10:30:00`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:30:00`,
        extendedProps: { calendar: "Success" },
      },
      {
        id: 7,
        title: "Meetup #",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:00:00`,
        extendedProps: { calendar: "Primary" },
      },
      {
        id: 8,
        title: "Submission",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T14:30:00`,
        extendedProps: { calendar: "Warning" },
      },
      {
        id: 9,
        title: "Attend event",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-13T07:00:00`,
        extendedProps: { calendar: "Success" },
      },
      {
        id: 10,
        title: "Project submission #2",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-28`,
        extendedProps: { calendar: "Primary" },
      },
    ];

    /*=====================*/
    // Modal Functions
    /*=====================*/
    const openModal = () => {
      document.getElementById("eventModal").style.display = "flex";
    };

    const closeModal = () => {
      document.getElementById("eventModal").style.display = "none";
      resetModalFields();
    };

    // Close modal when clicking outside of it
    window.onclick = function (event) {
      const modal = document.getElementById("eventModal");
      if (event.target === modal) {
        closeModal();
      }
    };

    /*=====================*/
    // Calendar Select fn.
    /*=====================*/
    const calendarSelect = (info) => {
      resetModalFields();

      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = info.startStr;
      getModalEndDateEl.value = info.endStr || info.startStr;
      getModalTitleEl.value = "";
    };

    /*=====================*/
    // Calendar AddEvent fn.
    /*=====================*/
    const calendarAddEvent = () => {
      const currentDate = getLondonNow();
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yyyy = currentDate.getFullYear();
      const combineDate = `${yyyy}-${mm}-${dd}T00:00:00`;

      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = combineDate;
    };

    /*=====================*/
    // Calender Event Function
    /*=====================*/
    const calendarEventClick = (info) => {
      const eventObj = info.event;

      if (eventObj.url) {
        window.open(eventObj.url);
        info.jsEvent.preventDefault();
      } else {
        const getModalEventId = eventObj._def.publicId;
        const getModalEventLevel = eventObj._def.extendedProps.calendar;
        const getModalCheckedRadioBtnEl = document.querySelector(
          `input[value="${getModalEventLevel}"]`,
        );

        getModalTitleEl.value = eventObj.title;
        getModalStartDateEl.value = eventObj.startStr.slice(0, 10);
        getModalEndDateEl.value = eventObj.endStr
          ? eventObj.endStr.slice(0, 10)
          : "";
        if (getModalCheckedRadioBtnEl) {
          getModalCheckedRadioBtnEl.checked = true;
        }
        getModalUpdateBtnEl.dataset.fcEventPublicId = getModalEventId;
        getModalAddBtnEl.style.display = "none";
        getModalUpdateBtnEl.style.display = "block";
        openModal();
      }
    };

    /*=====================*/
    // Active Calender
    /*=====================*/
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      selectable: true,
      initialView: "dayGridMonth",
      initialDate: `${newDate.getFullYear()}-${getDynamicMonth()}-07`,
      headerToolbar: calendarHeaderToolbar,
      events: calendarEventsList,
      select: calendarSelect,
      eventClick: calendarEventClick,
      dateClick: calendarAddEvent,
      customButtons: {
        addEventButton: {
          text: "Add Event +",
          click: calendarAddEvent,
        },
      },
      eventClassNames({ event: calendarEvent }) {
        const getColorValue =
          calendarsEvents[calendarEvent._def.extendedProps.calendar];
        return [`event-fc-color`, `fc-bg-${getColorValue}`];
      },
    });

    /*=====================*/
    // Update Calender Event
    /*=====================*/
    getModalUpdateBtnEl.addEventListener("click", () => {
      const getPublicID = getModalUpdateBtnEl.dataset.fcEventPublicId;
      const getTitleUpdatedValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getEvent = calendar.getEventById(getPublicID);
      const getModalUpdatedCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getModalUpdatedCheckedRadioBtnValue =
        getModalUpdatedCheckedRadioBtnEl
          ? getModalUpdatedCheckedRadioBtnEl.value
          : "";

      getEvent.setProp("title", getTitleUpdatedValue);
      getEvent.setDates(setModalStartDateValue, setModalEndDateValue);
      getEvent.setExtendedProp("calendar", getModalUpdatedCheckedRadioBtnValue);
      closeModal();
    });

    /*=====================*/
    // Add Calender Event
    /*=====================*/
    getModalAddBtnEl.addEventListener("click", () => {
      const getModalCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getTitleValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalCheckedRadioBtnValue = getModalCheckedRadioBtnEl
        ? getModalCheckedRadioBtnEl.value
        : "";

      calendar.addEvent({
        id: Date.now(), // Use unique ID based on timestamp
        title: getTitleValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        allDay: true,
        extendedProps: { calendar: getModalCheckedRadioBtnValue },
      });
      closeModal();
    });

    /*=====================*/
    // Calendar Init
    /*=====================*/
    calendar.render();

    /*=====================*/
    // Kanban Integration
    /*=====================*/
    // Load Kanban tasks as calendar events
    function loadKanbanEvents() {
      try {
        const raw = localStorage.getItem('kanban_boards');
        const activeId = localStorage.getItem('kanban_activeBoard');
        if (!raw || !activeId) return [];

        const boards = JSON.parse(raw);
        const activeBoard = boards.find(b => b.id === activeId);
        if (!activeBoard) return [];

        return activeBoard.tasks
          .filter(task => task.dueDate)
          .map(task => ({
            id: `kanban-${task.id}`,
            title: `[Kanban] ${task.title}`,
            start: task.dueDate,
            end: task.dueDate,
            allDay: true,
            backgroundColor: getPriorityColor(task.priority),
            borderColor: getPriorityColor(task.priority),
            extendedProps: {
              kanbanTaskId: task.id,
              priority: task.priority,
              column: task.column,
              assignee: task.assignee,
              description: task.description
            }
          }));
      } catch (e) {
        console.warn('Failed to load Kanban events', e);
        return [];
      }
    }

    function getPriorityColor(priority) {
      const colors = {
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#3B82F6'
      };
      return colors[priority] || colors.medium;
    }

    // Add Kanban events to calendar on initial load
    const kanbanEvents = loadKanbanEvents();
    kanbanEvents.forEach(evt => calendar.addEvent(evt));

    // Listen for Kanban task changes
    window.addEventListener('kanban:taskAdded', (e) => {
      const task = e.detail;
      if (!task || !task.dueDate) return;

      calendar.addEvent({
        id: `kanban-${task.id}`,
        title: `[Kanban] ${task.title}`,
        start: task.dueDate,
        end: task.dueDate,
        allDay: true,
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getPriorityColor(task.priority),
        extendedProps: {
          kanbanTaskId: task.id,
          priority: task.priority,
          column: task.column,
          assignee: task.assignee,
          description: task.description
        }
      });
    });

    window.addEventListener('kanban:taskUpdated', (e) => {
      const task = e.detail;
      const evt = calendar.getEventById(`kanban-${task.id}`);

      if (evt) {
        if (task.dueDate) {
          evt.setProp('title', `[Kanban] ${task.title}`);
          evt.setStart(task.dueDate);
          evt.setEnd(task.dueDate);
          evt.setProp('backgroundColor', getPriorityColor(task.priority));
          evt.setProp('borderColor', getPriorityColor(task.priority));
          evt.setExtendedProp('priority', task.priority);
          evt.setExtendedProp('column', task.column);
          evt.setExtendedProp('assignee', task.assignee);
          evt.setExtendedProp('description', task.description);
        } else {
          // No due date anymore, remove from calendar
          evt.remove();
        }
      } else if (task.dueDate) {
        // Task now has a due date, add to calendar
        calendar.addEvent({
          id: `kanban-${task.id}`,
          title: `[Kanban] ${task.title}`,
          start: task.dueDate,
          end: task.dueDate,
          allDay: true,
          backgroundColor: getPriorityColor(task.priority),
          borderColor: getPriorityColor(task.priority),
          extendedProps: {
            kanbanTaskId: task.id,
            priority: task.priority,
            column: task.column,
            assignee: task.assignee,
            description: task.description
          }
        });
      }
    });

    window.addEventListener('kanban:taskDeleted', (e) => {
      const evt = calendar.getEventById(`kanban-${e.detail.id}`);
      if (evt) evt.remove();
    });

    window.addEventListener('kanban:boardSwitched', () => {
      // Remove all Kanban events
      const allEvents = calendar.getEvents();
      allEvents.forEach(evt => {
        if (evt.id && evt.id.startsWith('kanban-')) {
          evt.remove();
        }
      });

      // Reload Kanban events from new active board
      const newKanbanEvents = loadKanbanEvents();
      newKanbanEvents.forEach(evt => calendar.addEvent(evt));
    });

    // Reset modal fields when hidden
    document.getElementById("eventModal").addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-close-btn")) {
        closeModal();
      }
    });

    function resetModalFields() {
      getModalTitleEl.value = "";
      getModalStartDateEl.value = "";
      getModalEndDateEl.value = "";
      const getModalIfCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );
      if (getModalIfCheckedRadioBtnEl) {
        getModalIfCheckedRadioBtnEl.checked = false;
      }
    }

    document
      .getElementById("eventModal")
      .addEventListener("hidden.bs.modal", () => {
        resetModalFields();
      });

    // Close modal when clicking on close button or outside modal
    document.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    window.addEventListener("click", (event) => {
      if (event.target === document.getElementById("eventModal")) {
        closeModal();
      }
    });
  }
});
