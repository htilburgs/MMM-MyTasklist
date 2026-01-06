Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 300000, // 5 minuten
    showCompleted: true,    // toon voltooide taken
    maxTasks: null          // null = geen limiet, anders bijv. 5
  },

  start() {
    this.tasks = [];
    this.texts = this.translateStrings();
    this.sendSocketNotification("GET_TASKS");

    // Periodieke update
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
  },

  // Vertalingen
  translateStrings() {
    return {
      NO_TASKS: this.translate("NO_TASKS"),
      ADD_TASK: this.translate("ADD_TASK"),
      PLACEHOLDER: this.translate("PLACEHOLDER"),
      TASK_COUNT: this.translate("TASK_COUNT") || "Taken"
    };
  },

  // CSS
  getStyles() {
    return ["MMM-MyTasklist.css"];
  },

  // Ontvangen socket-notificaties
  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS") {
      this.tasks = Array.isArray(payload) ? payload : [];
      this.updateDom();
    }
  },

  // DOM renderen
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-MyTasklist";

    if (!this.tasks.length) {
      wrapper.innerHTML = this.texts.NO_TASKS;
      return wrapper;
    }

    const ul = document.createElement("ul");

    // Filter op showCompleted
    let visibleTasks = this.tasks.filter(task => this.config.showCompleted || !task.done);

    // Limiteer aantal taken als maxTasks is ingesteld
    if (this.config.maxTasks && visibleTasks.length > this.config.maxTasks) {
      visibleTasks = visibleTasks.slice(0, this.config.maxTasks);
    }

    // Counter bovenaan
    const counter = document.createElement("div");
    counter.className = "task-counter";
    counter.textContent = `${visibleTasks.length} ${this.texts.TASK_COUNT}`;
    wrapper.appendChild(counter);

    // Taken toevoegen
    visibleTasks.forEach(task => ul.appendChild(this.createTaskElement(task)));

    wrapper.appendChild(ul);
    return wrapper;
  },

  // Creeer individuele taak element
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

  // Stop update timer
  suspend() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  },

  // Resume module
  resume() {
    this.sendSocketNotification("GET_TASKS");
  }
});
