const STORAGE_KEY = "todo.tasks.v1";

const form = document.getElementById("add-form");
const input = document.getElementById("new-task");
const list = document.getElementById("list");
const emptyState = document.getElementById("empty");
const countEl = document.getElementById("count");
const clearDoneBtn = document.getElementById("clear-done");
const filterButtons = [...document.querySelectorAll(".filter")];
const dateEl = document.getElementById("date");

const state = {
  tasks: load(),
  filter: "all",
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch {
    /* storage unavailable — app still works for this session */
  }
}

function visibleTasks() {
  if (state.filter === "active") return state.tasks.filter((t) => !t.done);
  if (state.filter === "done") return state.tasks.filter((t) => t.done);
  return state.tasks;
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  state.tasks.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed, done: false });
  save();
  render();
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  save();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  save();
  render();
}

function clearDone() {
  state.tasks = state.tasks.filter((t) => !t.done);
  save();
  render();
}

function render() {
  list.replaceChildren();

  for (const task of visibleTasks()) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " is-done" : "");

    const toggle = document.createElement("label");
    toggle.className = "task__toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task__check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.done ? "not done" : "done"}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const box = document.createElement("span");
    box.className = "task__box";
    box.setAttribute("aria-hidden", "true");

    toggle.append(checkbox, box);

    const text = document.createElement("span");
    text.className = "task__text";
    text.textContent = task.text;
    text.addEventListener("click", () => toggleTask(task.id));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task__delete";
    del.textContent = "\u00d7";
    del.title = "Delete task";
    del.setAttribute("aria-label", `Delete "${task.text}"`);
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(toggle, text, del);
    list.append(li);
  }

  const remaining = state.tasks.filter((t) => !t.done).length;
  const doneCount = state.tasks.length - remaining;
  countEl.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
  clearDoneBtn.disabled = doneCount === 0;

  emptyState.hidden = state.tasks.length !== 0;
  if (!emptyState.hidden) {
    emptyState.textContent =
      state.filter === "done" ? "No completed tasks yet." :
      state.filter === "active" ? "All tasks are done. Nice work!" :
      "Nothing here yet. Add your first task above.";
  }

  for (const btn of filterButtons) {
    btn.classList.toggle("is-active", btn.dataset.filter === state.filter);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(input.value);
  input.value = "";
  input.focus();
});

clearDoneBtn.addEventListener("click", clearDone);

for (const btn of filterButtons) {
  btn.addEventListener("click", () => {
    state.filter = btn.dataset.filter;
    render();
  });
}

dateEl.textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

render();

/* Offline support / installable app. Needs http(s), so it is skipped on file://
   (browsers log a CORS error for the manifest on file://, hence the same check). */
if (location.protocol === "http:" || location.protocol === "https:") {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.append(manifest);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        /* offline mode unavailable — the app still works normally */
      });
    });
  }
}
