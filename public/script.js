// ===================
// DOM Elements
// ===================
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const langSelect = document.getElementById("langSelect");
const addBtn = document.getElementById("addBtn");

// ===================
// State
// ===================
let tasks = [];
let translations = {};
let lang = navigator.language.startsWith("en") ? "en" :
           navigator.language.startsWith("de") ? "de" :
           navigator.language.startsWith("fr") ? "fr" : "nl";
langSelect.value = lang;

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
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    if (task.done) li.classList.add("done");

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(task.text));

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
// Task Actions
// ===================
taskForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = taskText.value.trim();
  if (!text) return;

  // Optimistic UI update
  const tempId = Date.now();
  tasks.push({ id: tempId, text, done: false });
  renderTasks();
  taskText.value = "";

  // Send to server
  if (ws.readyState === WebSocket.OPEN) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  }
});

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();

  if (ws.readyState === WebSocket.OPEN) {
    await fetch(`/api/toggle/${id}`, { method: "POST" });
  }
}

async function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();

  if (ws.readyState === WebSocket.OPEN) {
    await fetch(`/api/delete/${id}`, { method: "POST" });
  }
}

// ===================
// Init
// ===================
async function init() {
  await loadTranslations();
}
init();
