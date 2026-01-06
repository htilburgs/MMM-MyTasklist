async function fetchTasks() {
    const res = await fetch("/tasks");
    const tasks = await res.json();
    const ul = document.getElementById("taskList");
    ul.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        if (task.done) li.classList.add("done");

        li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" ${task.done ? "checked" : ""} 
                       onchange="toggleTask(${index}, this.checked)">
                <span>${task.text}</span>
            </div>
            <button class="delete" onclick="deleteTask(${index})">✖</button>
        `;
        ul.appendChild(li);
    });
}

async function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();
    if (!text) return;

    await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    input.value = "";
    fetchTasks();
}

async function toggleTask(index, done) {
    await fetch(`/tasks/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done })
    });
}

async function deleteTask(index) {
    await fetch(`/tasks/${index}`, { method: "DELETE" });
}

fetchTasks();
