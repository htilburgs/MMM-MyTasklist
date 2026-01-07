const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

  start() {
    this.tasksFile = path.join(__dirname, "tasks.json"); // standaard pad
    this.fileWatcher = null;

    console.log("MMM-MyTasklist helper gestart");

    this.ensureTasksFile();

    // Express server
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public"))); // serve index.html
    this.app.listen(8123, () => {
      console.log("MMM-MyTasklist webinterface draait op poort 8123");
    });

    // API routes
    this.setupAPI();

    // Live reload
    this.startFileWatcher();
  },

  socketNotificationReceived(notification, payload) {
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
     EXPRESS API
  ========================= */
  setupAPI() {
    const self = this;

    // GET alle taken
    self.app.get("/api/tasks", (req, res) => {
      res.json(self.loadTasks());
    });

    // POST nieuwe taak
    self.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst opgegeven");

      const tasks = self.loadTasks();
      tasks.push({ id: Date.now(), text, done: false });

      self.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // POST toggle done/undone
    self.app.post("/api/toggle/:id", (req, res) => {
      const tasks = self.toggleTask(req.params.id);
      self.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // POST delete taak
    self.app.post("/api/delete/:id", (req, res) => {
      const tasks = self.loadTasks().filter(t => t.id != req.params.id);
      self.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // POST reorder taken
    self.app.post("/api/tasks/reorder", (req, res) => {
      const tasks = req.body.tasks;
      if (!Array.isArray(tasks)) return res.status(400).send("Invalid data");

      self.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });
  },

  /* =========================
     FILE LOGICA
  ========================= */
  ensureTasksFile() {
    try {
      if (!fs.existsSync(this.tasksFile)) {
        fs.writeFileSync(this.tasksFile, "[]", "utf8");
        console.log("tasks.json aangemaakt");
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
      console.error("Fout bij laden tasks.json:", e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2), "utf8");
    } catch (e) {
      console.error("Fout bij opslaan tasks.json:", e);
    }
  },

  toggleTask(id) {
    id = Number(id);
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
    return tasks;
  },

  saveAndBroadcast(tasks) {
    this.saveTasks(tasks);
    this.sendSocketNotification("TASKS", tasks);
  },

  /* =========================
     LIVE RELOAD
  ========================= */
  startFileWatcher() {
    if (this.fileWatcher) return;

    try {
      this.fileWatcher = fs.watch(this.tasksFile, (eventType) => {
        if (eventType === "change") {
          const tasks = this.loadTasks();
          this.sendSocketNotification("TASKS", tasks);
        }
      });
      console.log("MMM-MyTasklist: live reload watcher gestart");
    } catch (e) {
      console.error("Fout bij starten file watcher:", e);
    }
  }

});
