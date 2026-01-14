Module.register("MMM-MyTasklist", {
  // ====================
  // Default config
  // ====================
  defaults: {
    updateInterval: 300000, // 5 minuten
    showCompleted: true,
    maxTasks: null
  },

  // ====================
  // Module start
  // ====================
  start() {
    this.tasks = [];
    this.lang = "nl";
    this.translations = {};

    // Haal data van NodeHelper
    this.sendSocketNotification("GET_DATA");

    // Periodieke update
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_DATA");
    }, this.config.updateInterval);
  },

  getStyles() {
    return ["MMM-MyTasklist.css"];
  },

  // ====================
  // Socket ontvangen
  // ====================
  socketNotificationReceived(notification, payload) {
    switch (notification) {
      case "INIT":
        this.tasks = payload.tasks || [];
        this.lang = payload.settings?.lang || "nl";
        this.loadTranslations().then(() => this.updateDom());
        break;

      case "TASKS":
        this.tasks = payload.tasks || [];
        this.updateDom();
        break;

      case "SETTINGS":
        this.lang = payload.lang || "nl";
        this.loadTranslations().then(() => this.updateDom());
        break;
    }
  },

  // ====================
  // Vertalingen
  // ====================
  async loadTranslations() {
    try {
      const res = await fetch(`/modules/MMM-MyTasklist/translations/${this.lang}.json`);
      this.translations = await res.json();
    } catch {
      this.translations = {};
    }
  },

  // ====================
  // DOM genereren
  // ====================
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-MyTasklist";

    if (!this.tasks.length) {
      const noTasks = this.translations.NO_TASKS || "Geen taken";
      wrapper.innerHTML = `<em>${noTasks}</em>`;
      return wrapper;
    }

    const ul = document.createElement("ul");

    // Filter op showCompleted
    let visibleTasks = this.tasks.filter(task => this.config.showCompleted || !task.done);

    // Limiteer aantal taken
    if (this.config.maxTasks && visibleTasks.length > this.config.maxTasks) {
      visibleTasks = visibleTasks.slice(0, this.config.maxTasks);
    }

    // Taken toevoegen
    visibleTasks.forEach(task => ul.appendChild(this.createTaskElement(task)));

    wrapper.appendChild(ul);
    return wrapper;
  },

  // ====================
  // Task element maken
  // ====================
  createTaskElement(task) {
    const li = document.createElement("li");
    li.classList.add("task-item");
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      this.sendSocketNotification("TOGGLE_TASK", task.id);
    });

    // Tekst
    const span = document.createElement("span");
    span.textContent = task.text;
    if (task.done) span.classList.add("done");

    // Edit knop
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = this.translations.EDIT_BUTTON || "Edit";
    editBtn.addEventListener("click", () => this.editTask(task, span));

    // Delete knop
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = this.translations.DELETE_BUTTON || "Delete";
    deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

    // Drag handle
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "≡";

    li.appendChild(handle);
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    // Drag & drop events
    this.makeDraggable(li, handle);

    return li;
  },

  // ====================
  // Inline edit
  // ====================
  editTask(task, textSpan) {
    const originalText = textSpan.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalText;
    input.className = "edit-input";
    textSpan.replaceWith(input);
    input.focus();

    const finishEdit = (cancel = false) => {
      if (!cancel) {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
          fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newText })
          });
        }
      }
      this.updateDom();
    };

    input.addEventListener("blur", () => finishEdit());
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") finishEdit();
      if (e.key === "Escape") finishEdit(true);
    });
  },

  // ====================
  // Delete task
  // ====================
  deleteTask(id) {
    fetch(`/api/tasks/${id}`, { method: "DELETE" });
  },

  // ====================
  // Drag & drop helper
  // ====================
  makeDraggable(li, handle) {
    const ul = li.parentElement;

    handle.addEventListener("mousedown", () => li.draggable = true);

    li.addEventListener("dragstart", () => li.classList.add("dragging"));

    li.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = ul.querySelector(".dragging");
      const after = this.getDragAfterElement(ul, e.clientY);
      ul.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
      if (!after) ul.appendChild(dragging);
      else { after.classList.add("drop-target"); ul.insertBefore(dragging, after); }
    });

    li.addEventListener("dragend", async () => {
      li.classList.remove("dragging"); li.draggable = false;
      ul.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));

      const orderedIds = [...ul.children].map(li => Number(li.dataset.id));
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      });
    });
  },

  getDragAfterElement(container, y) {
    const draggable = [...container.querySelectorAll("li:not(.dragging)")];
    return draggable.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  suspend() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  },

  resume() {
    this.sendSocketNotification("GET_DATA");
  }
});
