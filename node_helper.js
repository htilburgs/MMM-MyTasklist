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

    /* =========================
       API ENDPOINTS
    ========================= */

    // Alle taken ophalen
    this.app.get("/api/tasks", (req, res) => {
      res.json(this.loadTasks());
    });

    // Nieuwe taak
    this.app.post("/api/tasks", (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).send("Geen tekst opgegeven");

      const tasks = this.loadTasks();
      tasks.push({
        id: Date.now(),
        text,
        done: false
      });

      this.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // Toggle taak
    this.app.post("/api/toggle/:id", (req, res) => {
      const tasks = this.toggleTask(req.params.id);
      this.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // Verwijder taak
    this.app.post("/api/delete/:id", (req, res) => {
      const id = Number(req.params.id);
      const tasks = this.loadTasks().filter(t => t.id !== id);

      this.saveAndBroadcast(tasks);
      res.sendStatus(200);
    });

    // Vertalingen
    this.app.get("/api/lang", (req, res) => {
      const lang = req.query.lang || "nl";
      const file = path.join(__dirname, "translations", `${lang}.json`);

      if (!fs.existsSync(file)) {
        return res.json({});
      }

      res.json(JSON.parse(fs.readFileSync(file, "utf8")));
    });

    this.app.listen(8123, () =>
      console.log("MMM-MyTasklist webinterface draait op poort 8123")
    );
  },

  /* =========================
     SOCKET COMMUNICATIE
  ========================= */

  socketNotificationReceived(notification, payload) {
    if (notification === "GET_TASKS") {
      this.sendSocketNotification("TASKS", this.loadTasks());
    }

    if (notification === "TOGGLE_TASK") {
      co
