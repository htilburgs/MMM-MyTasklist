const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

module.exports = NodeHelper.create({
  start() {
    this.tasksFile = path.join(__dirname, "tasks.json");
    this.clients = [];
    this.initStorage();
    this.setupServer();
    console.log("MMM-MyTasklist v2 helper gestart");
  },

  /* =====================
   * Storage
   * ===================== */

  initStorage() {
    if (!fs.existsSync(this.tasksFile)) {
      fs.writeFileSync(
        this.tasksFile,
        JSON.stringify(
          { settings: { lang: "nl" }, tasks: [] },
          null,
          2
        ),
        "utf8"
      );
    }
  },

  loadData() {
    try {
      return JSON.parse(fs.readFileSync(this.tasksFile, "utf8"));
    } catch {
      return { settings: { lang: "nl" }, tasks: [] };
    }
  },

  saveData(data) {
    fs.writeFileSync(this.tasksFile, JSON.stringify(data, null, 2), "utf8");
  },

  /* =====================
   * Server
   * ===================== */

  setupServer() {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));

    this.setupApi();
    this.setupWebSocket();

    this.server = this.app.listen(8448, () =>
      console.log("Webinterface draait op poort 8448")
    );
  },

  /* =====================
   * API
   * ===================== */

  setupApi() {
    /* ---- SETTINGS ---- */

    this.app.get("/api/settings", (req, res) => {
      const data = this.loadData();
      res.json(data.settings);
    });

    this.app.patch("/api/settings", (req, res) => {
      const data = this.loadData();
      data.settings = { ...data.settings, ...req.body };
      this.saveData(data);

      this.broadcast({ type: "SETTINGS", settings: data.settings });
      this.sendSocketNotification("SETTINGS", data.settings);

      res.json(data.settings);
    });

    /* ---- TRANSLATIONS ---- */

    this.app.get("/api/translations", (req, res) => {
      const lang = req.query.lang || "nl";
      try {
        res.json(
          require(path.join(__dirname, "translations", `${lang}.json`))
        );
      } catch {
        res.json({});
      }
    });

    /* ---- TASKS ---- */

    this.app.get("/api/tasks", (req, res) => {
      const data = this.loadData();
      res.json(data.tasks);
    });

    this.app.post("/api/tasks", (req, res) => {
      if (!req.body.text?.trim()) {
        return res.status(400).send("Geen tekst");
      }

      const data = this.loadData();
      data.tasks.push({
        id: Date.now(),
        text: req.body.text.trim(),
        done: false
      });

      this.saveData(data);
      this.broadcast({ type: "TASKS", tasks: data.tasks });

      res.json(data.tasks);
    });

    this.app.patch("/api/tasks/:id", (req, res) => {
      const data = this.loadData();
      const task = data.tasks.find(t => t.id == req.params.id);
      if (!task) return res.status(404).send("Niet gevonden");

      task.done = !task.done;
      this.saveData(data);
      this.broadcast({ type: "TASKS", tasks: data.tasks });

      res.json(task);
    });

    this.app.put("/api/tasks/:id", (req, res) => {
      const data = this.loadData();
      const task = data.tasks.find(t => t.id == req.params.id);
      if (!task || !req.body.text?.trim())
        return res.status(400).send("Ongeldig");

      task.text = req.body.text.trim();
      this.saveData(data);
      this.broadcast({ type: "TASKS", tasks: data.tasks });

      res.json(task);
    });

    this.app.delete("/api/tasks/:id", (req, res) => {
      const data = this.loadData();
      data.tasks = data.tasks.filter(t => t.id != req.params.id);

      this.saveData(data);
      this.broadcast({ type: "TASKS", tasks: data.tasks });

      res.json(data.tasks);
    });

    this.app.post("/api/tasks/reorder", (req, res) => {
      const { orderedIds } = req.body;
      const data = this.loadData();

      data.tasks = orderedIds
        .map(id => data.tasks.find(t => t.id == id))
        .filter(Boolean);

      this.saveData(data);
      this.broadcast({ type: "TASKS", tasks: data.tasks });

      res.json(data.tasks);
    });
  },

  /* =====================
   * WebSocket
   * ===================== */

  setupWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on("connection", ws => {
      this.clients.push(ws);
      const data = this.loadData();

      ws.send(JSON.stringify({
        type: "INIT",
        tasks: data.tasks,
        settings: data.settings
      }));

      ws.on("close", () => {
        this.clients = this.clients.filter(c => c !== ws);
      });
    });
  },

  broadcast(payload) {
    const msg = JSON.stringify(payload);
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  },

  /* =====================
   * MagicMirror socket
   * ===================== */

  socketNotificationReceived(notification, payload) {
    const data = this.loadData();

    if (notification === "GET_DATA") {
      this.sendSocketNotification("INIT", data);
    }
  }
});
