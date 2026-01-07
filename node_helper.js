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

    // =========================
    // API: Get tasks
    // =========================
    this.app.get("/api/tasks", (req, res) => {
      res.json(this.loadTasks());
    });

    // =========================
    // API: Add task
    // =========================
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst");

      const tasks = this.loadTasks();
      tasks.push({
        id: Date.now(),
        text,
        done: false
      });

      this.updateTasks(tasks);
      res.json(tasks);
    });

    // =========================
    // API: Toggle task
    // =========================
    this.app.post("/api/toggle/:id", (req, res) => {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id == req.params.id);
      if (task) task.done = !task.done;

      this.updateTasks(tasks);
      res.json(tasks);
    });

    // =========================
    // API: Delete task
    // =========================
    this.app.post("/api/delete/:id", (req, res) => {
      let tasks = this.loadTasks();
      tasks = tasks.filter(t => t.id != req.params.id);

      this.updateTasks(tasks);
      res.json(tasks);
    });

    // =========================
    // API: Reorder tasks
    // =========================
    this.app.post("/api/reorder", (req, res) => {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds missing" });
      }

      let tasks = this.loadTasks();
      tasks.sort(
        (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
      );

      this.updateTasks(tasks);
      res.json({ success: true });
    });

    // =========================
    // API: Translations
    // =========================
    this.app.get("/api/lang", (req, res) => {
      const lang = req.query.lang || "nl";
      try {
        const file = path.join(__dirname, "translations", `${lang}.json`);
        res.json(JSON.parse(fs.readFileSync(file, "utf8")));
      } catch {
        res.json({});
      }
    });

    // =========================
    // Start HTTP + WebSocket
    // =========================
    const server = this.app.listen(8123, () =>
      console.log("MyTasklist webinterface draait op poort 8123")
    );

    this.wss = new WebSocket.Server({ server });
    this.wss.on("connection", ws => {
      this.clients.push(ws);
      ws.send(JSON.stringify({ type: "TASKS", tasks: this.loadTasks() }));

      ws.on("close", () => {
        this.clients = this.clients.filter(c => c !== ws);
      });
    });
  },

  // =========================
  // Toggle/update vanaf MagicMirror
  // =========================
  socketNotificationReceived(notification, payload) {
    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }

    if (notification === "TOGGLE_TASK") {
      const tasks = this.loadTasks();
      const task = tasks.find(t => t.id === payload);
      if (task) task.done = !task.done;

      // Update tasks.json
      this.updateTasks(tasks);
    }

    if (notification === "DELETE_TASK") {
      let tasks = this.loadTasks();
      tasks = tasks.filter(t => t.id !== payload);
      this.updateTasks(tasks);
    }

    if (notification === "ADD_TASK") {
      const tasks = this.loadTasks();
      tasks.push({ id: Date.now(), text: payload, done: false });
      this.updateTasks(tasks);
    }

    if (notification === "REORDER_TASKS") {
      const { orderedIds } = payload;
      if (!Array.isArray(orderedIds)) return;

      let tasks = this.loadTasks();
      tasks.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
      this.updateTasks(tasks);
    }
  },

  // =========================
  // Update helper
  // =========================
  updateTasks(tasks) {
    this.saveTasks(tasks);
    this.broadcastTasks(tasks);      // browser clients
    this.sendSocketNotification("TASKS", tasks);  // MagicMirror
  },

  // =========================
  // WebSocket broadcast
  // =========================
  broadcastTasks(tasks) {
    const msg = JSON.stringify({ type: "TASKS", tasks });
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  },

  // =========================
  // File handling
  // =========================
  loadTasks() {
    try {
      if (!fs.existsSync(this.tasksFile)) fs.writeFileSync(this.tasksFile, "[]", "utf8");
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
    } catch (e) {
      console.error("Tasks.json lezen mislukt:", e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2), "utf8");
    } catch (e) {
      console.error("Tasks.json opslaan mislukt:", e);
    }
  }

});
