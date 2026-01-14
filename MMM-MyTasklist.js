
Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 300000, // 5 minuten
    showCompleted: true,    // toon voltooide taken
    maxTasks: null          // null = geen limiet
  },

  start() {
    this.tasks = [];
    this.lang = "nl";
    this.translations = {};
    this.sendSocketNotification("GET_TASKS");

    // Periodieke update
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
  },

  getStyles() {
    return ["MMM-MyTasklist.css"];
  },

  // ====================
  // Socket ontvangen
  // ====================
  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS") {
      // payload = { tasks: [...], lang: "nl" }
      this.tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      this.lang = payload.lang || "nl";

      // Laad vertalingen
      this.loadTranslations().then(() => this.updateDom());
    }
  },

  // ====================
  // Vertalingen laden
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

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      this.sendSocketNotification("TOGGLE_TASK", task.id);
    });

    const span = document.createElement("span");
    span.textContent = task.text;
    if (task.done) span.classList.add("done");

    li.appendChild(checkbox);
    li.appendChild(span);

    return li;
  },

  suspend() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  },

  resume() {
    this.sendSocketNotification("GET_TASKS");
  }
});
