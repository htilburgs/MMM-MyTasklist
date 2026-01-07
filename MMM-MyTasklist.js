Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 300000,  // 5 minutes
    showCompleted: true,     // Show Completed tasks on dashboard (true, false)
    maxTasks: null,          // null = all tasks, otherwise number
    lang: null               // Automatic Language selection
  },

  start() {
    this.tasks = [];
    this.translations = {};
    this.sendSocketNotification("GET_TASKS");

    // Laad vertalingen
    this.loadTranslations();

    // Periodieke update
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
  },

  async loadTranslations() {
    const lang = this.config.lang || navigator.language.startsWith("en") ? "en" : "nl";
    try {
      const res = await fetch(`http://localhost:8123/api/lang?lang=${lang}`);
      this.translations = await res.json();
      this.updateDom();
    } catch (e) {
      console.error("Kan vertalingen niet laden:", e);
    }
  },

  getStyles() {
    return ["MMM-MyTasklist.css"];
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS") {
      this.tasks = Array.isArray(payload) ? payload : [];
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-MyTasklist";

    const title = document.createElement("h2");
    title.textContent = this.translations.TASKS_TITLE || "MyTasklist";
    wrapper.appendChild(title);

    if (!this.tasks.length) {
      wrapper.innerHTML += `<p>${this.translations.NO_TASKS || "No tasks"}</p>`;
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

  suspend() { if (this.updateTimer) clearInterval(this.updateTimer); },
  resume() { this.sendSocketNotification("GET_TASKS"); }
});
