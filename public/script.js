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

// ===== WebSocket voor realtime updates =====
const ws = new WebSocket(`ws://${window.location.hostname}:8448`);
ws.onmessage = e => {
  const data = JSON.parse(e.data);
  if (data.type === "TASKS") {
    tasks = data.tasks;
    renderTasks();
  }
};

// ===== Vertalingen toepassen =====
function applyTranslations() {
  taskText.placeholder = translations.PLACEHOLDER || "New task...";
  addBtn.textContent = translations.ADD_BUTTON || "Add";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.textContent = translations.DELETE_BUTTON || "Delete";
  });
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.textContent = translations.EDIT_BUTTON || "Edit";
  });

  document.querySelector('.filter-btn[data-filter="all"]').textContent = translations.FILTER_ALL || "All";
  document.querySelector('.filter-btn[data-filter="active"]').textContent = translations.FILTER_ACTIVE || "Active";
  document.querySelector('.filter-btn[data-filter="done"]').textContent = translations.FILTER_DONE || "Done";
}

// ===== Vertalingen laden =====
async function loadTranslations() {
  try {
    const res = await fetch(`/api/lang?lang=${lang}`);
    translations = await res.json();
    applyTranslations();
  } catch (e) {
    console.error("Fout bij laden vertalingen:", e);
  }
}

// ===== Taken renderen =====
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
    handle.addEventListener("mousedown", () => li.draggable = true);
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      const after = getDragAfterElement(taskList, e.clientY);
      taskList.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
      if (!after) taskList.appendChild(dragging);
      else { after.classList.add("drop-target"); taskList.insertBefore(dragging, after); }
    });
    li.addEventListener("dragend", async () => {
      li.classList.remove("dragging"); li.draggable = false;
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

  // Vertalingen toepassen op knoppen na render
  applyTranslations();
}

// ===== Drag helper =====
function getDragAfterElement(container, y) {
  const draggable = [...container.querySelectorAll("li:not(.dragging)")];
  return draggable.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
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

async function toggleTask(id) { await fetch(`/api/toggle/${id}`, { method: "POST" }); }
async function deleteTask(id) { await fetch(`/api/delete/${id}`, { method: "POST" }); }

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
        await fetch(`/api/edit/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newText })
        });
      }
    }
    renderTasks(); // Zorgt dat knoppen correct vertaald blijven
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

// ===== Taal selector =====
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

// Init: haal huidige taal op
(async function initLanguage() {
  try {
    const res = await fetch("/api/lang?getLang=true");
    const data = await res.json();
    lang = data.lang || "nl";
    langSelect.value = lang;
    await loadTranslations();
  } catch {}
})();

// Init taken
(async function initTasks() {
  try {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    tasks = data.tasks || [];
  } catch { tasks = []; }
  renderTasks();
})();
