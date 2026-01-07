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
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let translations = {};
let lang = localStorage.getItem("lang") || (navigator.language.startsWith("en") ? "en" :
           navigator.language.startsWith("de") ? "de" :
           navigator.language.startsWith("fr") ? "fr" : "nl");
langSelect.value = lang;
let currentFilter = "all";

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
  localStorage.setItem("lang", lang);
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
    li.addEventListener("drop", dragDrop);
    li.addEventListener("dragend", dragEnd);

    // Checkbox + label
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
  saveTasks();
}

// ===================
// Task Actions
// ===================
taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = taskText.value.trim();
  if (!text) return;

  const id = Date.now();
  tasks.push({ id, text, done: false });
  taskText.value = "";
  renderTasks();
});

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// ===================
// Drag & Drop
// ===================
let dragSrcEl = null;

function dragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dragDrop(e) {
  e.stopPropagation();
  if (dragSrcEl !== this) {
    const srcId = dragSrcEl.dataset.id;
    const tgtId = this.dataset.id;
    const srcIndex = tasks.findIndex(t => t.id == srcId);
    const tgtIndex = tasks.findIndex(t => t.id == tgtId);
    tasks.splice(tgtIndex, 0, tasks.splice(srcIndex, 1)[0]);
    renderTasks();
  }
}

function dragEnd() {
  dragSrcEl = null;
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
// LocalStorage
// ===================
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ===================
// Init
// ===================
async function init() {
  await loadTranslations();
  renderTasks();
}
init();
