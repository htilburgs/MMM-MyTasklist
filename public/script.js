// ===================
// DOM Elements
// ===================
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const langSelect = document.getElementById("langSelect");
const addBtn = document.getElementById("addBtn");
const filterBtns = document.querySelectorAll(".filter-btn");

// ===================
// State
// ===================
let tasks = [];
let translations = {};
let lang = navigator.language.startsWith("en") ? "en" :
           navigator.language.startsWith("de") ? "de" :
           navigator.language.startsWith("fr") ? "fr" : "nl";
langSelect.value = lang;
let currentFilter = "all";

// ===================
// WebSocket Realtime
// ===================
const ws = new WebSocket(`ws://${window.location.hostname}:8123`);
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === "TASKS") {
    tasks = data.tasks;
    renderTasks();
  }
};

// ===================
// Translations
// ===================
async function loadTranslations() {
  try {
    const res = await fetch(`/api/lang?lang=${lang}`);
    translations = await res.json();
  } catch {
    translations = {};
  }
  applyTranslations();
}

function applyTranslations() {
  taskText.placeholder = translations.PLACEHOLDER || "New task...";
  addBtn.textContent = translations.ADD_BUTTON || "Add";
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.textContent = translations.DELETE_BUTTON || "Delete";
  });
}

langSelect.addEventListener("change", async () => {
  lang = langSelect.value;
  await loadTranslations();
});

// ===================
// Render Tasks
// ===================
function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;
  if (currentFilter === "active") filteredTasks = tasks.filter(t => !t.done);
  else if (currentFilter === "done") filteredTasks = tasks.filter(t => t.done);

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.draggable = true;
    if (task.done) li.classList.add("done");

    // Drag events
    li.addEventListener("dragstart", dragStart);
    li.addEventListener("dragover", dragOver);
    li.addEventListener("dragend", dragEnd);

    // Label + checkbox
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(task.text));

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(label);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
  applyTranslations();
}

// ===================
// Task Actions (server-side)
// ===================
taskForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = taskText.value.trim();
  if (!text) return;

  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  taskText.value = "";
  // UI update via WebSocket
});

async function toggleTask(id) {
  await fetch(`/api/toggle/${id}`, { method: "POST" });
  // UI update via WebSocket
}

async function deleteTask(id) {
  await fetch(`/api/delete/${id}`, { method: "POST" });
  // UI update via WebSocket
}

// ===================
// Drag & Drop (server-synced)
// ===================
let dragSrcIndex = null;

function dragStart(e) {
  dragSrcIndex = [...taskList.children].indexOf(this);
  this.classList.add("dragging");
}

function dragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
}

async function dragEnd() {
  this.classList.remove("dragging");

  const orderedIds = [...taskList.children].map(li => Number(li.dataset.id));

  await fetch("/api/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds })
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===================
// Filters
// ===================
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ===================
// Init
// ===================
async function init() {
  await loadTranslations();
  try {
    const res = await fetch("/api/tasks");
    tasks = await res.json();
  } catch { tasks = []; }
  renderTasks();
}
init();
