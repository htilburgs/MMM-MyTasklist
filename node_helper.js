const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

  start() {
    this.tasksFile = path.join(__dirname, "tasks.json");
    this.setupServer();
    console.log("MMM-MyTasklist helper gestart");
  },

  setupServer() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));

    // GET alle taken
    this.app.get("/api/tasks", (req, res) => {
      res.json(this.loadTasks());
    });

    // POST nieuwe taak
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst opgegeven");
      const tasks = this.loadTasks();
      tasks.push({ id: Date.now(), text, done: false });
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    // POST toggle done
    this.app.post("/api/toggle/:id", (req, res) => {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id == req.params.id);
      if (task) task.done = !task.done;
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    // POST verwijder taak
    this.app.post("/api/delete/:id", (req, res) => {
      let tasks = this.loadTasks();
      tasks = tasks.filter(t => t.id != req.params.id);
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    this.app.listen(8123, () => {
      console.log("MMM-MyTasklist webinterface draait op poort 8123");
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }
    if (notification === "TOGGLE_TASK") {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id === payload);
      if (task) {
        task.done = !task.done;
        this.saveTasks(tasks);
        this.sendSocketNotification("TASKS", tasks);
      }
    }
  },

  loadTasks() {
    try {
      if (!fs.existsSync(this.tasksFile)) fs.writeFileSync(this.tasksFile, "[]", "utf8");
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
  }
});
