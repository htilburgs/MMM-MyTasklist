const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const langSelect = document.getElementById("langSelect");
const addBtn = document.getElementById("addBtn");
const filterBtns = document.querySelectorAll(".filter-btn");

let tasks = [];
let translations = {};
let lang = "nl";
let currentFilter = "all";

// WebSocket voor realtime updates
const ws = new WebSocket(`ws://${window.location.hostname}:8448`);
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === "TASKS") {
    tasks = data.tasks;
    renderTasks();
  }
};

// Laden van vertalingen
async function loadTranslations() {
  try {
    const res = await fetch(`/api/lang?lang=${lang}`);
    translations = await res.json();
  } catch {
    translations = {};
  }
  applyTranslations();
}

// Toepassen van vertalingen
function applyTranslations() {
  taskText.placeholder = translations.PLACEHOLDER || "New task...";
  addBtn.textContent = translations.ADD_BUTTON || "Add";

  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.textContent = translations.DELETE_BUTTON || "Delete"
  );
  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.textContent = translations.EDIT_BUTTON || "Edit"
  );

  // Filterknoppen vertalen
  document.querySelector('.filter-btn[data-filter="all"]').textContent = translations.FILTER_ALL || "All";
  document.querySelector('.filter-btn[data-filter="active"]').textContent = translations.FILTER_ACTIVE || "Active";
  document.querySelector('.filter-btn[data-filter="done"]').textContent = translations.FILTER_DONE || "Done";
}

// Taal wisselen
langSelect.addEventListener("change", async () => {
  lang = langSelect.value;
  try {
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang })
    });
  } catch (e) { console.error(e); }
  await loadTranslations();
});

// Render taken
function renderTasks() {
  taskList.innerHTML = "";
  let filtered = tasks;
  if (currentFilter === "active") filtered = tasks.filter(t => !t.done);
  else if (currentFilter === "done") filtered = tasks.filter(t => t.done);

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.classList.toggle("done", task.done);

    // Drag handle
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "≡";
    li.appendChild(handle);

    // Checkbox + label
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));
    label.appendChild(checkbox);

    const textSpan = document.createElement("span");
    textSpan.textContent = task.text;
    textSpan.className = "task-text";
    label.appendChild(textSpan);
    li.appendChild(label);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = translations.EDIT_BUTTON || "Edit";
    editBtn.addEventListener("click", () => editTask(task.id, textSpan));
    li.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    li.appendChild(deleteBtn);

    // Drag & Drop
    handle.addEventListener("mousedown", () => { li.draggable = true; });
    li.addEventListener("dragstart", () => { li.classList.add("dragging"); });
    li.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      const after = getDragAfterElement(taskList, e.clientY);
      taskList.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
      if (!after) taskList.appendChild(dragging);
      else { after.classList.add("drop-target"); taskList.insertBefore(dragging, after); }
    });
    li.addEventListener("dragend", async () => {
      li.classList.remove("dragging");
      li.draggable = false;
      taskList.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
      const orderedIds = [...taskList.children].map(li => Number(li.dataset.id));
      await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      });
    });

    taskList.appendChild(li);
  });

  applyTranslations();
}

// Drag helper
function getDragAfterElement(container, y) {
  const draggable = [...container.querySelectorAll("li:not(.dragging)")];
  return draggable.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Task actions
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
});

async function toggleTask(id) { await fetch(`/api/toggle/${id}`, { method: "POST" }); }
async function deleteTask(id) { await fetch(`/api/delete/${id}`, { method: "POST" }); }

// Inline taak bewerken
async function editTask(id, textSpan) {
  const originalText = textSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className = "edit-input";

  textSpan.replaceWith(input);
  input.focus();

  input.addEventListener("blur", async () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      await fetch(`/api/edit/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
      });
    }
    input.replaceWith(textSpan);
    textSpan.textContent = newText || originalText;
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.replaceWith(textSpan);
      textSpan.textContent = originalText;
    }
  });
}

// Filters
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Init
async function init() {
  try {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    tasks = data.tasks || data;
    if (data.lang) lang = data.lang;
    langSelect.value = lang;
  } catch { tasks = []; }

  await loadTranslations();
  renderTasks();
}

init();
