const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

module.exports = NodeHelper.create({
  start() {
    this.tasksFile = path.join(__dirname, "tasks.json");
    this.clients = [];
    this.setupServer();
    console.log("MMM-MyTasklist helper gestart");
  },

  setupServer() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));

    // Add task
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst opgegeven");

      const data = this.loadTasks();
      const tasks = data.tasks || [];
      tasks.push({ id: Date.now(), text, done: false });

      this.saveTasks(tasks, data.lang);
      this.broadcastTasks(tasks);
      this.sendSocketNotification("TASKS", { tasks, lang: data.lang });

      res.json({ tasks, lang: data.lang });
    });

    // Toggle task
    this.app.post("/api/toggle/:id", (req, res) => {
      const data = this.loadTasks();
      const tasks = data.tasks || [];
      const task = tasks.find(t => t.id == req.params.id);
      if (task) task.done = !task.done;

      this.saveTasks(tasks, data.lang);
      this.broadcastTasks(tasks);
      this.sendSocketNotification("TASKS", { tasks, lang: data.lang });

      res.json({ tasks, lang: data.lang });
    });

    // Delete task
    this.app.post("/api/delete/:id", (req, res) => {
      const data = this.loadTasks();
      let tasks = data.tasks || [];
      tasks = tasks.filter(t => t.id != req.params.id);

      this.saveTasks(tasks, data.lang);
      this.broadcastTasks(tasks);
      this.sendSocketNotification("TASKS", { tasks, lang: data.lang });

      res.json({ tasks, lang: data.lang });
    });

    // Reorder tasks
    this.app.post("/api/reorder", (req, res) => {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) return res.status(400).send("Invalid array");

      const data = this.loadTasks();
      const tasks = data.tasks || [];
      const newTasks = orderedIds.map(id => tasks.find(t => t.id == id)).filter(Boolean);

      this.saveTasks(newTasks, data.lang);
      this.broadcastTasks(newTasks);
      this.sendSocketNotification("TASKS", { tasks: newTasks, lang: data.lang });

      res.json({ tasks: newTasks, lang: data.lang });
    });

    // Get tasks
    this.app.get("/api/tasks", (req, res) => {
      const data = this.loadTasks();
      res.json(data);
    });

    // Set language
    this.app.post("/api/lang", (req, res) => {
      const { lang } = req.body;
      if (!lang) return res.status(400).send("Geen taal opgegeven");

      const data = this.loadTasks();
      this.saveTasks(data.tasks, lang);
      res.json({ success: true, lang });
    });

    // Get translations or last language
    this.app.get("/api/lang", (req, res) => {
      const getLangOnly = req.query.getLang === "true";
      if (getLangOnly) {
        const data = this.loadTasks();
        return res.json({ lang: data.lang || "nl" });
      }

      const lang = req.query.lang || "nl";
      try {
        const translations = require(path.join(__dirname, "translations", `${lang}.json`));
        res.json(translations);
      } catch {
        res.json({});
      }
    });

    // Start server + WebSocket
    const server = this.app.listen(8123, () => console.log("Webinterface draait op poort 8123"));

    this.wss = new WebSocket.Server({ server });
    this.wss.on("connection", ws => {
      this.clients.push(ws);
      const data = this.loadTasks();
      ws.send(JSON.stringify({ type: "TASKS", tasks: data.tasks || [], lang: data.lang || "nl" }));

      ws.on("close", () => { this.clients = this.clients.filter(c => c !== ws); });
    });
  },

  broadcastTasks(tasks) {
    const message = JSON.stringify({ type: "TASKS", tasks });
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "GET_TASKS") {
      const data = this.loadTasks();
      this.sendSocketNotification("TASKS", { tasks: data.tasks || [], lang: data.lang || "nl" });
    }
    if (notification === "TOGGLE_TASK") {
      const data = this.loadTasks();
      const tasks = data.tasks || [];
      const task = tasks.find(t => t.id === payload);
      if (task) task.done = !task.done;
      this.saveTasks(tasks, data.lang);
      this.sendSocketNotification("TASKS", { tasks, lang: data.lang });
      this.broadcastTasks(tasks);
    }
  },

  loadTasks() {
    try {
      if (!fs.existsSync(this.tasksFile)) {
        fs.writeFileSync(this.tasksFile, JSON.stringify({ tasks: [], lang: "nl" }, null, 2), "utf8");
      }
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
    } catch (e) {
      console.error("Fout bij laden tasks.json:", e);
      return { tasks: [], lang: "nl" };
    }
  },

  saveTasks(tasks, langToSave) {
    try {
      const data = { tasks, lang: langToSave || "nl" };
      fs.writeFileSync(this.tasksFile, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Fout bij opslaan tasks.json:", e);
    }
  }
});
