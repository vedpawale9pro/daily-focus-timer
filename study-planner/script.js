/**
 * Study Planner with AI Import
 * Handles manual task entry, JSON import, storage persistence, and statistics.
 */

// --- Constants ---
const STORAGE_KEY = 'study_planner_tasks';
const DATE_KEY = 'study_planner_date';

// --- State ---
let tasks = [];

// --- DOM Elements ---
const subjectInput = document.getElementById('subject-input');
const topicInput = document.getElementById('topic-input');
const timeInput = document.getElementById('time-input');
const addTaskBtn = document.getElementById('add-task-btn');

const jsonInput = document.getElementById('json-input');
const importBtn = document.getElementById('import-btn');
const importError = document.getElementById('import-error');

const taskList = document.getElementById('task-list');
const clearAllBtn = document.getElementById('clear-all-btn');

const statsTotal = document.getElementById('stats-total');
const statsCompleted = document.getElementById('stats-completed');
const progressBar = document.getElementById('progress-bar');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkDayReset();
    loadTasks();
    renderTasks();
    updateStats();
});

// --- Event Listeners ---
addTaskBtn.addEventListener('click', addManualTask);
importBtn.addEventListener('click', importJsonTasks);
clearAllBtn.addEventListener('click', clearAllTasks);

// --- Core Functions ---

/**
 * Loads tasks from localStorage
 */
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

/**
 * Saves tasks to localStorage
 */
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateStats();
}

/**
 * Checks if the day has changed. If so, clears completed tasks (or all tasks depending on preference).
 * The requirement says "Automatically reset tasks when the date changes".
 */
function checkDayReset() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(DATE_KEY);

    if (lastDate !== today) {
        // New day detected
        tasks = []; // Reset all tasks
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        localStorage.setItem(DATE_KEY, today);
    }
}

/**
 * Adds a single manual task
 */
function addManualTask() {
    const subject = subjectInput.value.trim();
    const topic = topicInput.value.trim();
    const minutes = parseInt(timeInput.value);

    if (!subject || !topic || isNaN(minutes) || minutes <= 0) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const newTask = {
        id: Date.now(),
        subject,
        topic,
        minutes,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Clear inputs
    subjectInput.value = '';
    topicInput.value = '';
    timeInput.value = '';
}

/**
 * Imports tasks from JSON
 */
function importJsonTasks() {
    const rawJson = jsonInput.value.trim();
    importError.textContent = ''; // Clear errors

    if (!rawJson) {
        importError.textContent = 'Please paste some JSON first.';
        return;
    }

    try {
        const data = JSON.parse(rawJson);

        if (!Array.isArray(data)) {
            throw new Error("JSON must be an array of objects.");
        }

        // Validate and Sanitize
        const newTasks = [];
        data.forEach((item, index) => {
            if (!item.subject || !item.topic || !item.minutes) {
                throw new Error(`Item at index ${index} is missing fields.`);
            }
            newTasks.push({
                id: Date.now() + index, // Ensure unique IDs
                subject: item.subject,
                topic: item.topic,
                minutes: parseInt(item.minutes),
                completed: false
            });
        });

        // Merging new tasks
        tasks = [...tasks, ...newTasks];
        saveTasks();
        renderTasks();

        jsonInput.value = ''; // Clear textarea
        alert(`Successfully imported ${newTasks.length} tasks.`);

    } catch (e) {
        importError.textContent = 'Invalid JSON: ' + e.message;
    }
}

/**
 * Renders the task list to the DOM
 */
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No tasks for today. Start planning!</div>';
        return;
    }

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;

        div.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    data-id="${task.id}">
                <div class="task-info">
                    <h3>${escapeHtml(task.subject)}</h3>
                    <p>${escapeHtml(task.topic)}</p>
                </div>
            </div>
            <div class="task-time">${task.minutes} min</div>
        `;

        taskList.appendChild(div);
    });

    // Add listeners to new checkboxes
    document.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', toggleTask);
    });
}

/**
 * Toggles completion status of a task
 */
function toggleTask(e) {
    const id = parseInt(e.target.getAttribute('data-id'));
    const task = tasks.find(t => t.id === id);

    if (task) {
        task.completed = e.target.checked;
        saveTasks();

        // Optimistic UI update for smoothness
        const item = e.target.closest('.task-item');
        if (task.completed) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }

        updateStats(); // Re-calc stats
    }
}

/**
 * Clear all tasks manually
 */
function clearAllTasks() {
    if (confirm("Are you sure you want to clear all tasks for today?")) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
}

/**
 * Updates the stats section
 */
function updateStats() {
    const total = tasks.reduce((sum, t) => sum + t.minutes, 0);
    const completed = tasks
        .filter(t => t.completed)
        .reduce((sum, t) => sum + t.minutes, 0);

    statsTotal.textContent = `${total} min`;
    statsCompleted.textContent = `${completed} min`;

    // Progress Bar
    const percent = total === 0 ? 0 : (completed / total) * 100;
    progressBar.style.width = `${percent}%`;
}

/**
 * Helper to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
