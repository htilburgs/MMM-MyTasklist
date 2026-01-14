// ===== Elementen =====
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const addBtn = document.getElementById("addBtn");
const filterBtns = document.querySelectorAll(".filter-btn");
const langSelect = document.getElementById("langSelect");

let tasks = [];
let currentFilter = "all";
let lang = "nl";
let translations = {};

// ===== WebSocket realtime =====
const ws = new WebSocket(`ws://${window.location.hostname}:8448`);

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  switch (data.type) {
    case "INIT":
      tasks = data.tasks;
      lang = data.settings.lang || "nl";
      langSelect.value = lang;
      loadTranslations();
      renderTasks();
      break;

    case "TASKS":
      tasks = data.tasks;
      renderTasks();
      break;

    case "SETTINGS":
      lang = data.settings.lang || "nl";
      langSelect.value = lang;
      loadTranslations();
      break;
  }
};

// ===== Vertalingen =====
function applyTranslations() {
  taskText.placeholder = translations.PLACEHOLDER || "New task...";
  addBtn.textContent = translations.ADD_BUTTON || "Add";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.textContent = translations.DELETE_BUTTON || "Delete";
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.textContent = translations.EDIT_BUTTON || "Edit";
  });

  document.querySelector('.filter-btn[data-filter="all"]').textContent =
    translations.FILTER_ALL || "All";
  document.querySelector('.filter-btn[data-filter="active"]').textContent =
    translations.FILTER_ACTIVE || "Active";
  document.querySelector('.filter-btn[data-filter="done"]').textContent =
    translations.FILTER_DONE || "Done";
}

async function loadTranslations() {
  try {
    const res = await fetch(`/api/translations?lang=${lang}`);
    translations = await res.json();
    applyTranslations();
  } catch (e) {
    console.error("Fout bij laden vertalingen:", e);
  }
}

// ===== Render taken =====
function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks;
  if (currentFilter === "active") filtered = tasks.filter(t => !t.done);
  else if (currentFilter === "done") filtered = tasks.filter(t => t.done);

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.classList.add("task-item");
    if (task.done) li.classList.add("done");

    // Drag handle
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "≡";
    li.appendChild(handle);

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));
    li.appendChild(checkbox);

    // Tekst
    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    li.appendChild(textSpan);

    // Edit knop
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = translations.EDIT_BUTTON || "Edit";
    editBtn.addEventListener("click", () => editTask(task.id, textSpan));
    li.appendChild(editBtn);

    // Delete knop
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = translations.DELETE_BUTTON || "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    li.appendChild(deleteBtn);

    // Drag & drop
    makeDraggable(li, taskList);

    taskList.appendChild(li);
  });

  applyTranslations();
}

// ===== CRUD acties =====
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

async function toggleTask(id) {
  await fetch(`/api/tasks/${id}`, { method: "PATCH" });
}

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" });
}

// ===== Inline edit =====
async function editTask(id, textSpan) {
  const originalText = textSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className = "edit-input";
  textSpan.replaceWith(input);
  input.focus();

  const finishEdit = async (cancel = false) => {
    if (!cancel) {
      const newText = input.value.trim();
      if (newText && newText !== originalText) {
        await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newText })
        });
      }
    }
    renderTasks();
  };

  input.addEventListener("blur", () => finishEdit());
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") finishEdit();
    if (e.key === "Escape") finishEdit(true);
  });
}

// ===== Filters =====
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ===== Taal wijzigen =====
langSelect.addEventListener("change", async () => {
  lang = langSelect.value;
  await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang })
  });
});

// ===== Drag & drop helper =====
function makeDraggable(li, container) {
  const handle = li.querySelector(".drag-handle");

  handle.addEventListener("mousedown", () => li.draggable = true);

  li.addEventListener("dragstart", () => li.classList.add("dragging"));

  li.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = container.querySelector(".dragging");
    const after = getDragAfterElement(container, e.clientY);
    container.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
    if (!after) container.appendChild(dragging);
    else { after.classList.add("drop-target"); container.insertBefore(dragging, after); }
  });

  li.addEventListener("dragend", async () => {
    li.classList.remove("dragging");
    li.draggable = false;
    container.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));

    const orderedIds = [...container.children].map(li => Number(li.dataset.id));
    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds })
    });
  });
}

function getDragAfterElement(container, y) {
  const draggable = [...container.querySelectorAll("li:not(.dragging)")];
  return draggable.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
