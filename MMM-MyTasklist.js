Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 5000,
    showCompleted: true,
    emptyMessage: "Geen taken"
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("GET_TASKS");

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

    if (this.tasks.length === 0) {
      wrapper.innerHTML = this.config.emptyMessage;
      return wrapper;
    }

    const ul = document.createElement("ul");

    this.tasks
      .filter(task => this.config.showCompleted || !task.done)
      .forEach(task => {
        ul.appendChild(this.createTaskElement(task));
      });

    wrapper.appendChild(ul);
    return wrapper;
  },

  createTaskElement(task) {
    const li = document.createElement("li");

    li.textContent = task.text;
    li.classList.add("task-item");

    if (task.done) {
      li.classList.add("done");
    }

    // 👉 Klik / tap handler
    li.addEventListener("click", () => {
      this.sendSocketNotification("TOGGLE_TASK", task.id);
    });

    return li;
  },

  suspend() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  },

  resume() {
    this.sendSocketNotification("GET_TASKS");
  }
});
