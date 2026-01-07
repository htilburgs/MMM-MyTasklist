Module.register("MMM-MyTasklist", {
  defaults: { showFilter: true, updateInterval: 10000 },
  start() {
    this.tasks = [];
    this.lang = "nl";
    this.translations = {};
    this.sendSocketNotification("GET_TASKS");
  },

  socketNotificationReceived(notification, payload) {
    if(notification === "TASKS") {
      this.tasks = payload.tasks || [];
      this.lang = payload.lang || "nl";
      this.loadTranslations().then(() => this.updateDom());
    }
  },

  async loadTranslations() {
    try {
      const res = await fetch(`/modules/MMM-MyTasklist/translations/${this.lang}.json`);
      this.translations = await res.json();
    } catch { this.translations = {}; }
  },

  getDom() {
    const wrapper = document.createElement("div");

    if(!this.tasks || this.tasks.length === 0) {
      const noTasks = this.translations.NO_TASKS || "Geen taken";
      wrapper.innerHTML = `<em>${noTasks}</em>`;
      return wrapper;
    }

    const ul = document.createElement("ul");
    this.tasks.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.text;
      if(task.done) li.classList.add("done");
      ul.appendChild(li);
    });
    wrapper.appendChild(ul);
    return wrapper;
  }
});
