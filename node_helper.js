const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

  start() {
    this.tasksFile = null;
    console.log("MMM-MyTasklist helper gestart");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "INIT") {
      this.tasksFile = path.isAbsolute(payload)
        ? payload
        : path.join(__dirname, payload);

      // Maak bestand aan als niet aanwezig
      this.ensureTasksFile();

      // Stuur meteen tasks
      this.sendSocketNotification("TASKS", this.loadTasks());
      return;
    }

    if (!this.tasksFile) return;

    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }

    if (notification === "TOGGLE_TASK") {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id === payload);
      if (task) task.done = !task.done;
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
    }
  },

  ensureTasksFile() {
    try {
      if (!fs.existsSync(this.tasksFile)) {
        fs.writeFileSync(this.tasksFile, "[]", "utf8");
      }
    } catch (e) {
      console.error("Kan tasks.json niet aanmaken:", e);
    }
  },

  loadTasks() {
    try {
      const data = fs.readFileSync(this.tasksFile, "utf8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Fout bij lezen tasks.json:", e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2), "utf8");
    } catch (e) {
      console.error("Fout bij opslaan tasks.json:", e);
    }
  }

});
