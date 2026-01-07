Module.register("MMM-MyTasklist", {
  defaults: {
    tasksFile: "tasks.json",    // JSON-bestand met taken
    updateInterval: 300000,     // 5 minuten
    showCompleted: true,        // toon voltooide taken
    maxTasks: null              // null = geen limiet
  },

  start() {
    this.tasks = [];

    // Stuur bestandspad naar helper
    this.sendSocketNotification("INIT", this.config.tasksFile);
    this.sendSocketNotification("GET_TASKS");

    // Periodieke update
    this.startUpdateTimer();
  },

  startUpdateTimer() {
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
  },

  getStyles() {
    return ["MMM-MyTasklist.css"];
  },

  getTranslations() {
    return {
      nl: "translations/nl.json",
      en: "translations/en.json"
    };
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS") {
      this.tasks = Array.isArray(payload) ? payload : [];
      this.updateDom(300);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-MyTasklist";

    if (!this.tasks.length) {
      wrapper.textContent = this.translate("NO_TASKS") || "Geen taken";
      return wrapper;
    }

    const ul = document.createElement("ul");

    // Filter op showCompleted
    let visibleTasks = this.tasks.filter(
      task => this.config.showCompleted || !task.done
    );

    // Sorteer onafgeronde taken eerst
    visibleTasks.sort((a, b) => a.done - b.done);

    // Limiteer aantal taken
    if (Number.isInteger(this.config.maxTasks)) {
      visibleTasks = visibleTasks.slice(0, this.config.maxTasks);
    }

    // Taken toevoegen
    visibleTasks.forEach(task => ul.appendChild(this.createTaskElement(task)));

    wrapper.appendChild(ul);
    return wrapper;
  },

  createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    // Optimistische UI-update
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      this.updateDom(200);

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
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  },

  resume() {
    this.sendSocketNotification("GET_TASKS");
    this.startUpdateTimer();
  }
});
