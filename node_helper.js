const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
  start() {
    this.tasksFile = path.join(__dirname, "tasks.json");
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));

    this.app.get("/api/tasks", (req, res) => {
      res.json(this.loadTasks());
    });

    this.app.post("/api/tasks", (req, res) => {
      const tasks = this.loadTasks();
      tasks.push({
        id: Date.now(),
        text: req.body.text,
        done: false
      });
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    this.app.post("/api/toggle/:id", (req, res) => {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id == req.params.id);
      if (task) task.done = !task.done;
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    this.app.post("/api/delete/:id", (req, res) => {
      const tasks = this.loadTasks().filter(t => t.id != req.params.id);
      this.saveTasks(tasks);
      this.sendSocketNotification("TASKS", tasks);
      res.sendStatus(200);
    });

    this.app.listen(8123, () => {
      console.log("MMM-MyTasklist webinterface draait op poort 8123");
    });
  },

  socketNotificationReceived(notification) {
    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }
  },

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksFile));
  },

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
  }
});
