const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const langSelect = document.getElementById("langSelect");
const addBtn = document.getElementById("addBtn");
const filterBtns = document.querySelectorAll(".filter-btn");

let tasks = [];
let translations = {};
let lang = navigator.language.startsWith("en") ? "en" :
           navigator.language.startsWith("de") ? "de" :
           navigator.language.startsWith("fr") ? "fr" : "nl";
langSelect.value = lang;
let currentFilter = "all";

const ws = new WebSocket(`ws://${window.location.hostname}:8123`);
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if(data.type==="TASKS"){ tasks=data.tasks; renderTasks(); }
};

async function loadTranslations(){
  try{ const res=await fetch(`/api/lang?lang=${lang}`); translations=await res.json(); }catch{ translations={}; }
  applyTranslations();
}

function applyTranslations(){
  taskText.placeholder = translations.PLACEHOLDER||"New task...";
  addBtn.textContent = translations.ADD_BUTTON||"Add";
  document.querySelectorAll(".delete-btn").forEach(btn=>btn.textContent=translations.DELETE_BUTTON||"Delete");
}

langSelect.addEventListener("change", async()=>{ lang=langSelect.value; await loadTranslations(); });

function renderTasks(){
  taskList.innerHTML="";
  let filtered = tasks;
  if(currentFilter==="active") filtered = tasks.filter(t=>!t.done);
  else if(currentFilter==="done") filtered = tasks.filter(t=>t.done);

  filtered.forEach(task=>{
    const li=document.createElement("li");
    li.dataset.id=task.id;
    li.classList.toggle("done",task.done);

    // Drag handle
    const handle=document.createElement("span");
    handle.className="drag-handle";
    handle.textContent="≡";
    li.appendChild(handle);

    // Label + checkbox
    const label=document.createElement("label");
    const checkbox=document.createElement("input");
    checkbox.type="checkbox";
    checkbox.checked=task.done;
    checkbox.addEventListener("change",()=>toggleTask(task.id));
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(task.text));
    li.appendChild(label);

    // Delete button
    const deleteBtn=document.createElement("button");
    deleteBtn.className="delete-btn";
    deleteBtn.addEventListener("click",()=>deleteTask(task.id));
    li.appendChild(deleteBtn);

    // Drag & Drop
    handle.addEventListener("mousedown",()=>{ li.draggable=true; });

    li.addEventListener("dragstart",()=>{ li.classList.add("dragging"); });

    li.addEventListener("dragover", e=>{
      e.preventDefault();
      const dragging=document.querySelector(".dragging");
      const after=getDragAfterElement(taskList,e.clientY);

      taskList.querySelectorAll(".drop-target").forEach(el=>el.classList.remove("drop-target"));

      if(!after) taskList.appendChild(dragging);
      else {
        after.classList.add("drop-target");
        taskList.insertBefore(dragging,after);
      }
    });

    li.addEventListener("dragend", async()=>{
      li.classList.remove("dragging");
      li.draggable=false;
      taskList.querySelectorAll(".drop-target").forEach(el=>el.classList.remove("drop-target"));

      const orderedIds=[...taskList.children].map(li=>Number(li.dataset.id));
      await fetch("/api/reorder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderedIds})});
    });

    taskList.appendChild(li);
  });

  applyTranslations();
}

// Helper for drag position
function getDragAfterElement(container,y){
  const draggable=[...container.querySelectorAll("li:not(.dragging)")];
  return draggable.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset) return {offset,element:child};
    else return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

// Task actions
taskForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const text=taskText.value.trim();
  if(!text) return;
  await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
  taskText.value="";
});

async function toggleTask(id){ await fetch(`/api/toggle/${id}`,{method:"POST"}); }
async function deleteTask(id){ await fetch(`/api/delete/${id}`,{method:"POST"}); }

// Filters
filterBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    filterBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter=btn.dataset.filter;
    renderTasks();
  });
});

// Init
async function init(){
  await loadTranslations();
  try{ const res=await fetch("/api/tasks"); tasks=await res.json(); }catch{ tasks=[]; }
  renderTasks();
}
init();
