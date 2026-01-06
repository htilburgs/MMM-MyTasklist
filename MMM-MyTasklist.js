Module.register("MMM-MyTasklist", {
  defaults: {
    updateInterval: 5000
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("GET_TASKS");
    setInterval(() => {
      this.sendSocketNotification("GET_TASKS");
    }, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS") {
      this.tasks = payload;
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (this.tasks.length === 0) {
      wrapper.innerHTML = "Geen taken";
      return wrapper;
    }

    const ul = document.createElement("ul");

    this.tasks.forEach(task => {
      const li = document.createElement("li");
      li.innerHTML = task.done
        ? `<s>${task.text}</s>`
        : task.text;
      ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
  }
});
