Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 300000, // 5 minuten
    showCompleted: true,    // toon voltooide taken
    maxTasks: null          // null = geen limiet, anders bijv. 5
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("GET_TASKS");

    // Periodieke update
    this.updateTimer = setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
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

    if (!this.tasks.length) {
      wrapper.innerHTML = this.translate("NO_TASKS") || "Geen taken";
      return wrapper;
    }

    const ul = document.createElement("ul");

    // Filter op showCompleted
    let visibleTasks = this.tasks.filter(task => this.config.showCompleted || !task.done);

    // Limiteer aantal taken als maxTasks is ingesteld
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

  suspend() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  },

  resume() {
    this.sendSocketNotification("GET_TASKS");
  }
});
