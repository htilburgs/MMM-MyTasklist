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

    const sendUpdated = (tasksData, res) => {
      this.saveTasks(tasksData);
      this.broadcastTasks(tasksData);
      this.sendSocketNotification("TASKS", tasksData.tasks); // alleen array voor Mirror
      if(res) res.json(tasksData);
    };

    // Add task
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if(!text) return res.status(400).send("Geen tekst opgegeven");

      const tasksData = this.loadTasks();
      tasksData.tasks.push({ id: Date.now(), text, done: false });
      sendUpdated(tasksData, res);
    });

    // Toggle task
    this.app.post("/api/toggle/:id", (req, res) => {
      const tasksData = this.loadTasks();
      const task = tasksData.tasks.find(t => t.id == req.params.id);
      if(task) task.done = !task.done;
      sendUpdated(tasksData, res);
    });

    // Delete task
    this.app.post("/api/delete/:id", (req, res) => {
      const tasksData = this.loadTasks();
      tasksData.tasks = tasksData.tasks.filter(t => t.id != req.params.id);
      sendUpdated(tasksData, res);
    });

    // Get tasks
    this.app.get("/api/tasks", (req, res) => res.json(this.loadTasks()));

    // Translations
    this.app.get("/api/lang", (req, res) => {
      const lang = req.query.lang || "nl";
      try {
        const translations = require(path.join(__dirname, "translations", `${lang}.json`));
        res.json(translations);
      } catch { res.json({}); }
    });

    const server = this.app.listen(8123, () => console.log("Webinterface draait op poort 8123"));

    // WebSocket
    this.wss = new WebSocket.Server({ server });
    this.wss.on("connection", ws => {
      this.clients.push(ws);
      ws.send(JSON.stringify({ type: "TASKS", tasks: this.loadTasks() }));

      ws.on("close", () => {
        this.clients = this.clients.filter(c => c !== ws);
      });
    });
  },

  broadcastTasks(tasksData) {
    const message = JSON.stringify({ type: "TASKS", tasks: tasksData });
    this.clients.forEach(ws => { if(ws.readyState===WebSocket.OPEN) ws.send(message); });
  },

  socketNotificationReceived(notification, payload) {
    if(notification === "GET_TASKS") {
      const tasksData = this.loadTasks();
      this.sendSocketNotification("TASKS", tasksData.tasks); // array voor Mirror
    }
    if(notification === "TOGGLE_TASK") {
      const tasksData = this.loadTasks();
      const task = tasksData.tasks.find(t => t.id === payload);
      if(task) task.done = !task.done;
      this.saveTasks(tasksData);
      this.sendSocketNotification("TASKS", tasksData.tasks);
      this.broadcastTasks(tasksData);
    }
  },

  loadTasks() {
    try {
      if(!fs.existsSync(this.tasksFile)) {
        const defaultData = { tasks_title: "Mijn Taken", tasks: [] };
        fs.writeFileSync(this.tasksFile, JSON.stringify(defaultData, null, 2), "utf8");
      }
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
    } catch(e) { return { tasks_title: "Mijn Taken", tasks: [] }; }
  },

  saveTasks(tasksData) {
    try { fs.writeFileSync(this.tasksFile, JSON.stringify(tasksData, null, 2), "utf8"); } 
    catch(e) { console.error("Fout bij opslaan tasks.json:", e); }
  }
});
