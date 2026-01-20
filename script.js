/**
 * Daily Focus Timer - Main Logic
 * Handles timer countdown, user input, and daily session tracking via LocalStorage.
 */

// --- DOM Elements ---
const timerDisplay = document.getElementById('timer-display');
const statusMessage = document.getElementById('status-message');
const minutesInput = document.getElementById('minutes-input');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionCountDisplay = document.getElementById('session-count');
const inputSection = document.getElementById('input-section');

// --- State Variables ---
let countdown;          // Stores the setInterval ID
let timeLeft;           // Current time in seconds
let isRunning = false;  // Is the timer currently active?

// --- Constants ---
const SESSION_KEY = 'daily_focus_sessions'; // Key for localStorage

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadDailyStats();
});

// --- Event Listeners ---

// Start Button Click
startBtn.addEventListener('click', () => {
    if (isRunning) return; // Prevent multiple clicks

    const minutes = parseInt(minutesInput.value);

    // Basic Validation
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
        alert('Please enter a valid time between 1 and 180 minutes.');
        return;
    }

    startTimer(minutes * 60);
});

// Reset Button Click
resetBtn.addEventListener('click', resetTimer);

// --- Timer Logic ---

/**
 * Starts the countdown timer
 * @param {number} durationSeconds - The total time in seconds
 */
function startTimer(durationSeconds) {
    // 1. Set state
    isRunning = true;
    timeLeft = durationSeconds;
    
    // 2. Update UI for active state
    inputSection.style.display = 'none'; // Hide input during focus
    startBtn.style.display = 'none';     // Hide start button
    resetBtn.style.display = 'inline-block';
    statusMessage.textContent = 'Stay Focused...';
    
    // 3. Update display immediately so we don't wait 1 second
    updateDisplay(timeLeft);

    // 4. Start Interval
    countdown = setInterval(() => {
        timeLeft--;
        updateDisplay(timeLeft);

        // Check if finished
        if (timeLeft <= 0) {
            completeSession();
        }
    }, 1000);
}

/**
 * Handles the completion of a session
 */
function completeSession() {
    clearInterval(countdown);
    isRunning = false;

    // Update UI
    timerDisplay.textContent = "00:00";
    statusMessage.textContent = "Session Complete!";
    document.title = "Session Complete!"; // Notify via tab title

    // Update Stats
    incrementDailyCount();

    // Show reset button clearly or maybe 'New Session' logic?
    // For simplicity, we just leave it at "Session Complete" until user hits Reset.
}

/**
 * Resets the timer to the initial state
 */
function resetTimer() {
    // Stop the interval
    clearInterval(countdown);
    isRunning = false;

    // Reset UI
    const defaultMinutes = 25;
    minutesInput.value = defaultMinutes;
    updateDisplay(defaultMinutes * 60);
    
    statusMessage.textContent = "Ready to Focus?";
    document.title = "Daily Focus Timer";
    
    inputSection.style.display = 'flex'; // Show input again
    startBtn.style.display = 'inline-block';
}

/**
 * Updates the big timer text (MM:SS)
 * @param {number} seconds 
 */
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // Pad with leading zeros (e.g., 5 -> "05")
    const displayString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    timerDisplay.textContent = displayString;
    document.title = `(${displayString}) Focus Timer`;
}

// --- LocalStorage Logic ---

/**
 * Loads daily stats from LocalStorage.
 * Resets the count if the stored date is not today.
 */
function loadDailyStats() {
    const today = new Date().toDateString();
    const storedData = localStorage.getItem(SESSION_KEY);

    if (storedData) {
        const { date, count } = JSON.parse(storedData);
        
        if (date === today) {
            // It's the same day, restore count
            sessionCountDisplay.textContent = count;
        } else {
            // New day, reset count
            saveStats(today, 0);
        }
    } else {
        // No data, initialize
        saveStats(today, 0);
    }
}

/**
 * Increases the completed session count by 1
 */
function incrementDailyCount() {
    const today = new Date().toDateString();
    let currentCount = parseInt(sessionCountDisplay.textContent) || 0;
    
    const newCount = currentCount + 1;
    sessionCountDisplay.textContent = newCount;
    saveStats(today, newCount);
}

/**
 * Saves the date and count to LocalStorage
 * @param {string} date - Date string
 * @param {number} count - Session count
 */
function saveStats(date, count) {
    const data = { date, count };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
