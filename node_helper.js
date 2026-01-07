const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

  start() {
    this.tasksFile = null;
    console.log("MMM-MyTasklist node_helper gestart");
  },

  /* =========================
     SOCKET COMMUNICATIE
  ========================= */

  socketNotificationReceived(notification, payload) {

    // Initialisatie: ontvang pad naar JSON-bestand
    if (notification === "INIT") {
      this.tasksFile = path.isAbsolute(payload)
        ? payload
        : path.join(__dirname, payload);

      this.ensureTasksFile();
      return;
    }

    if (!this.tasksFile) return;

    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }

    if (notification === "TOGGLE_TASK") {
      const tasks = this.toggleTask(payload);
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
    }
  },

  /* =========================
     TASK LOGICA
  ========================= */

  ensureTasksFile() {
    try {
      if (!fs.existsSync(this.tasksFile)) {
        fs.writeFileSync(this.tasksFile, "[]", "utf8");
      }
    } catch (e) {
      console.error("MMM-MyTasklist: kan tasks.json niet aanmaken", e);
    }
  },

  loadTasks() {
    try {
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
    } catch (e) {
      console.error("MMM-MyTasklist: fout bij laden tasks.json", e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      fs.writeFileSync(
        this.tasksFile,
        JSON.stringify(tasks, null, 2),
        "utf8"
      );
    } catch (e) {
      console.error("MMM-MyTasklist: fout bij opslaan tasks.json", e);
    }
  },

  toggleTask(id) {
    id = Number(id);
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === id);

    if (task) {
      task.done = !task.done;
    }

    return tasks;
  }

});
