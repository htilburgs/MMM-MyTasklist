const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const langSelect = document.getElementById("langSelect");
const addBtn = document.getElementById("addBtn");

let tasks = [];
let translations = {};
let lang = navigator.language.startsWith("en") ? "en" :
           navigator.language.startsWith("de") ? "de" :
           navigator.language.startsWith("fr") ? "fr" : "nl";

langSelect.value = lang;

// ====================
// WebSocket realtime
// ====================
const ws = new WebSocket(`ws://${window.location.hostname}:8123`);
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === "TASKS") {
    tasks = data.tasks;
    renderTasks();
  }
};

// ====================
// Load translations
// ====================
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

// ====================
// Language selection
// ====================
langSelect.addEventListener("change", async () => {
  lang = langSelect.value;
  // Sla taal op in tasks.json via API
  await fetch("/api/lang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang }) });
  await loadTranslations();
});

// ====================
// Render tasks
// ====================
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.className = task.done ? "done" : "";

    // checkbox + label
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", async () => { await toggleTask(task.id); });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(task.text));

    // delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", async () => { await deleteTask(task.id); });

    li.appendChild(label);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
  applyTranslations();
  enableDragDrop();
}

// ====================
// Add / Toggle / Delete
// ====================
taskForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = taskText.value.trim();
  if (!text) return;

  await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  taskText.value = "";
});

async function toggleTask(id) {
  await fetch(`/api/toggle/${id}`, { method: "POST" });
}

async function deleteTask(id) {
  await fetch(`/api/delete/${id}`, { method: "POST" });
}

// ====================
// Drag & Drop Reorder
// ====================
function enableDragDrop() {
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.dataset.id);
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    const srcId = e.dataTransfer.getData("text/plain");
    const targetId = this.dataset.id;
    if (srcId === targetId) return false;

    // Reorder tasks array
    const srcIndex = tasks.findIndex(t => t.id == srcId);
    const targetIndex = tasks.findIndex(t => t.id == targetId);
    const [movedTask] = tasks.splice(srcIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);

    renderTasks();

    // Sla nieuwe volgorde op via API
    const orderedIds = tasks.map(t => t.id);
    fetch("/api/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds }) });

    return false;
  }

  const items = taskList.querySelectorAll("li");
  items.forEach(item => {
    item.setAttribute("draggable", "true");
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
  });
}

// ====================
// Init
// ====================
async function init() {
  await loadTranslations();
}
init();
