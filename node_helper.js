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

    // GET all tasks
    this.app.get("/api/tasks", (req, res) => {
      const tasks = this.loadTasks();
      res.json(tasks);
    });

    // ADD new task
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst opgegeven");

      const tasks = this.loadTasks();
      tasks.push({ id: Date.now(), text, done: false });
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.json(tasks);
    });

    // TOGGLE task
    this.app.post("/api/toggle/:id", (req, res) => {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id == req.params.id);
      if (task) task.done = !task.done;
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.json(tasks);
    });

    // DELETE task
    this.app.post("/api/delete/:id", (req, res) => {
      let tasks = this.loadTasks();
      tasks = tasks.filter(t => t.id != req.params.id);
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.json(tasks);
    });

    // REORDER tasks
    this.app.post("/api/tasks/reorder", (req, res) => {
      const newTasks = req.body.tasks;
      if (!Array.isArray(newTasks)) return res.status(400).send("Invalid tasks array");
      this.saveTasks(newTasks);
      this.sendSocketNotification("TASKS", newTasks);
      res.json(newTasks);
    });

    // GET translations
    this.app.get("/api/lang", (req, res) => {
      const lang = req.query.lang || "nl";
      const translationsFile = path.join(__dirname, "translations", `${lang}.json`);
      try {
        const translations = require(translationsFile);
        res.json(translations);
      } catch {
        res.json({});
      }
    });

    this.app.listen(8123, () => console.log("Webinterface draait op poort 8123"));
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }
  },

  loadTasks() {
    try {
      if (!fs.existsSync(this.tasksFile)) fs.writeFileSync(this.tasksFile, "[]", "utf8");
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
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
