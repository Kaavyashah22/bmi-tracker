let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser");
let darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;
let bmiHistory = [];

const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");
const calculateBtn = document.getElementById("calculateBtn");
const bmiValueSpan = document.getElementById("bmiValue");
const bmiCategoryP = document.getElementById("bmiCategory");
const progressFill = document.getElementById("progressFill");
const healthTipP = document.getElementById("healthTip");
const newTipBtn = document.getElementById("newTipBtn");
const workoutList = document.getElementById("workoutList");
const historyList = document.getElementById("bmiHistoryList");
const streakCountSpan = document.getElementById("streakCount");
const logoutBtn = document.getElementById("logoutBtn");
const darkModeBtn = document.getElementById("toggleDarkMode");

const resultSection = document.getElementById("result-section");
const tipSection = document.getElementById("tip-section");
const workoutSection = document.getElementById("workout-section");
const historySection = document.getElementById("history-section");
const streakSection = document.getElementById("streak-section");

const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authToggleBtn = document.getElementById("authToggleBtn");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const authMessage = document.getElementById("authMessage");

const chartCanvas = document.getElementById("bmiChart");
let bmiChartInstance = null;

// Removed lottieLeftContainer and lottieRightContainer declarations

function calculateBMI(height, weight) {
    if (height <= 0 || weight <= 0 || isNaN(height) || isNaN(weight)) {
        console.error("Invalid height or weight for BMI calculation.");
        return 0;
    }
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

function categorizeBMI(bmi) {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    return "obese";
}

function getRandomTip(category) {
    const tips = {
        underweight: [
            "Focus on nutrient-dense foods to gain weight healthily.",
            "Incorporate strength training to build muscle mass.",
            "Eat regular meals and snacks throughout the day.",
            "Consider adding healthy fats like avocados and nuts to your diet.",
        ],
        normal: [
            "Maintain a balanced diet with plenty of fruits and vegetables.",
            "Stay active with regular physical activity you enjoy.",
            "Ensure you get adequate sleep for overall well-being.",
            "Practice mindful eating to stay in tune with your body's hunger cues.",
        ],
        overweight: [
            "Prioritize whole foods and reduce processed items.",
            "Increase your daily physical activity, even short walks help.",
            "Control portion sizes to manage calorie intake.",
            "Drink plenty of water and limit sugary beverages.",
        ],
        obese: [
            "Consult with a healthcare provider or a registered dietitian for personalized advice.",
            "Start with gentle, low-impact exercises like walking or swimming.",
            "Focus on making sustainable lifestyle changes rather than quick fixes.",
            "Build a support system to help you on your health journey.",
        ],
    };
    const options = tips[category.toLowerCase()] || tips["normal"];
    return options[Math.floor(Math.random() * options.length)];
}

function updateWorkoutList(category) {
    const workouts = {
        underweight: ["Push-ups (modified if needed)", "Squats with bodyweight", "Lunges", "Plank holds", "Bicep curls with light weights"],
        normal: ["Jogging or running", "Cycling (indoor or outdoor)", "Yoga or Pilates", "Swimming laps", "Dancing"],
        overweight: ["Brisk walking", "Elliptical trainer", "Water aerobics", "Strength training with weights", "Stretching routines"],
        obese: ["Chair exercises (seated marching, arm raises)", "Light walking in short intervals", "Seated leg lifts", "Wall push-ups", "Consult a physio for guided exercises"],
    };
    workoutList.innerHTML = "";
    const categoryWorkouts = workouts[category.toLowerCase()] || [];
    if (categoryWorkouts.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No specific workout suggestions for this category, consult a professional.";
        workoutList.appendChild(li);
    } else {
        categoryWorkouts.forEach((exercise) => {
            const li = document.createElement("li");
            li.textContent = exercise;
            workoutList.appendChild(li);
        });
    }
}

function updateProgressBar(bmi) {
    const minBmiDisplay = 15;
    const maxBmiDisplay = 35;
    let percentage;

    if (bmi < minBmiDisplay) {
        percentage = 0;
    } else if (bmi > maxBmiDisplay) {
        percentage = 100;
    } else {
        percentage = ((bmi - minBmiDisplay) / (maxBmiDisplay - minBmiDisplay)) * 100;
    }
    progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;

    const category = categorizeBMI(bmi);
    if (category === "underweight") {
        progressFill.style.backgroundColor = "#3498db";
    } else if (category === "normal") {
        progressFill.style.backgroundColor = "#2ecc71";
    } else if (category === "overweight") {
        progressFill.style.backgroundColor = "#f39c12";
    } else {
        progressFill.style.backgroundColor = "#e74c3c";
    }
}

function updateBmiHistoryUI() {
    historyList.innerHTML = "";
    if (bmiHistory.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No BMI entries yet. Calculate your BMI to see history!";
        historyList.appendChild(li);
        return;
    }
    [...bmiHistory].reverse().forEach((entry) => {
        const li = document.createElement("li");
        const date = new Date(entry.date).toLocaleDateString();
        li.textContent = `${date} - BMI: ${entry.bmi.toFixed(2)} (${entry.category})`;
        historyList.appendChild(li);
    });
}

function updateStreak() {
    let streak = 0;
    if (!currentUser || !users[currentUser] || !users[currentUser].history || users[currentUser].history.length === 0) {
        streakCountSpan.textContent = 0;
        return;
    }

    const uniqueDates = [...new Set(users[currentUser].history.map(entry => {
        const date = new Date(entry.date);
        return date.toISOString().slice(0, 10);
    }))].sort((a, b) => new Date(b) - new Date(a));

    if (uniqueDates.length === 0) {
        streakCountSpan.textContent = 0;
        return;
    }

    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    let checkDateStr = checkDate.toISOString().slice(0, 10);

    if (uniqueDates[0] !== checkDateStr) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = checkDate.toISOString().slice(0, 10);
    }

    for (const dateStr of uniqueDates) {
        if (dateStr === checkDateStr) {
            streak++;
        } else {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = checkDate.toISOString().slice(0, 10);
    }
    streakCountSpan.textContent = streak;
}

function updateChart() {
    if (bmiChartInstance) {
        bmiChartInstance.destroy();
    }

    if (!chartCanvas || bmiHistory.length === 0) {
        if (!historySection.classList.contains("hidden")) {
            chartCanvas.style.display = 'none';
        }
        return;
    }
    chartCanvas.style.display = 'block';

    const sortedBmiHistory = [...bmiHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = sortedBmiHistory.map((entry) => {
        const date = new Date(entry.date);
        return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    });
    const data = sortedBmiHistory.map((entry) => entry.bmi);

    bmiChartInstance = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "BMI Over Time",
                    data: data,
                    borderColor: darkMode ? "#7cb5ec" : "#3498db",
                    backgroundColor: darkMode ? "rgba(124, 181, 236, 0.2)" : "rgba(52, 152, 219, 0.2)",
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: darkMode ? '#7cb5ec' : '#3498db',
                    pointBorderColor: darkMode ? '#7cb5ec' : '#3498db',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: darkMode ? '#7cb5ec' : '#3498db',
                    pointHoverBorderColor: darkMode ? '#7cb5ec' : '#3498db',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'BMI Value',
                        color: darkMode ? '#eee' : '#333'
                    },
                    grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: darkMode ? '#eee' : '#333'
                    },
                    min: 15,
                    max: 35
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        color: darkMode ? '#eee' : '#333'
                    },
                    grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: darkMode ? '#eee' : '#333',
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0,
                    },
                    type: 'category'
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: darkMode ? '#eee' : '#333'
                    }
                },
                tooltip: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                    titleColor: darkMode ? '#333' : '#eee',
                    bodyColor: darkMode ? '#333' : '#eee',
                    borderColor: darkMode ? '#ccc' : '#555',
                    borderWidth: 1,
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(sortedBmiHistory[tooltipItems[0].dataIndex].date).toLocaleDateString();
                        },
                        label: function(tooltipItem) {
                            return `BMI: ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                }
            }
        },
    });
}

// Removed loadLottieAnimations function

function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveDarkMode() {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
}

function saveBmiHistory() {
    if (currentUser && users[currentUser]) {
        users[currentUser].history = bmiHistory;
        saveUsers();
    }
}

function loadBmiHistoryForCurrentUser() {
    if (currentUser && users[currentUser] && users[currentUser].history) {
        bmiHistory = users[currentUser].history;
    } else {
        bmiHistory = [];
    }
}

function showContentSections() {
    resultSection.classList.remove("hidden");
    tipSection.classList.remove("hidden");
    workoutSection.classList.remove("hidden");
    historySection.classList.remove("hidden");
    streakSection.classList.remove("hidden");
}

function hideContentSections() {
    resultSection.classList.add("hidden");
    tipSection.classList.add("hidden");
    workoutSection.classList.add("hidden");
    historySection.classList.add("hidden");
    streakSection.classList.add("hidden");
}

function resetInputs() {
    heightInput.value = "";
    weightInput.value = "";
    heightInput.focus();
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add("dark-mode");
        darkModeBtn.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        darkModeBtn.textContent = "🌗 Dark Mode";
    }
    if (bmiChartInstance) {
        updateChart();
    }
}

function toggleDarkModeUI() {
    darkMode = !darkMode;
    applyDarkMode(darkMode);
    saveDarkMode();
}

function openAuthModal(isSignup = false) {
    if (authModal) {
        authModal.style.display = "flex";
        authMessage.textContent = "";
        usernameInput.value = "";
        passwordInput.value = "";

        if (isSignup) {
            authTitle.textContent = "Sign Up";
            authSubmitBtn.textContent = "Sign Up";
            authToggleBtn.innerHTML = "Already have an account? <button type='button' class='link-button'>Login</button>";
        } else {
            authTitle.textContent = "Login";
            authSubmitBtn.textContent = "Login";
            authToggleBtn.innerHTML = "Don't have an account? <button type='button' class='link-button'>Sign Up</button>";
        }
        usernameInput.focus();
    }
}

function closeAuthModal() {
    if (authModal) {
        authModal.style.display = "none";
    }
}

function loginUser(username, password) {
    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem("currentUser", currentUser);
        loadBmiHistoryForCurrentUser();
        updateAllUI();
        showContentSections();
        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
        }
        closeAuthModal();
    } else {
        authMessage.textContent = "Invalid username or password.";
    }
}

function signupUser(username, password) {
    if (users[username]) {
        authMessage.textContent = "Username already exists.";
    } else if (username.length < 3 || password.length < 3) {
        authMessage.textContent = "Username and password must be at least 3 characters.";
    } else {
        users[username] = { password: password, history: [] };
        saveUsers();
        loginUser(username, password);
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    bmiHistory = [];
    if (bmiChartInstance) {
        bmiChartInstance.destroy();
        bmiChartInstance = null;
    }
    hideContentSections();
    if (logoutBtn) {
        logoutBtn.style.display = "none";
    }
    openAuthModal(false);
}

function updateAllUI() {
    updateBmiHistoryUI();
    updateStreak();
    updateChart();
}

document.addEventListener("DOMContentLoaded", () => {
    applyDarkMode(darkMode);

    if (currentUser && users[currentUser]) {
        loadBmiHistoryForCurrentUser();
        updateAllUI();
        showContentSections();
        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
        }
    } else {
        currentUser = null;
        localStorage.removeItem("currentUser");
        hideContentSections();
        openAuthModal(false);
    }

    // Removed call to loadLottieAnimations();
});

if (darkModeBtn) {
    darkModeBtn.addEventListener("click", toggleDarkModeUI);
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        logoutUser();
    });
}

if (authToggleBtn) {
    authToggleBtn.addEventListener("click", (event) => {
        if (event.target.classList.contains('link-button')) {
            if (authTitle.textContent === "Login") {
                openAuthModal(true);
            } else {
                openAuthModal(false);
            }
        }
    });
}

if (authSubmitBtn) {
    authSubmitBtn.addEventListener("click", () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username.length < 3 || password.length < 3) {
            authMessage.textContent = "Username and password must be at least 3 characters.";
            return;
        }
        authMessage.textContent = "";

        if (authTitle.textContent === "Login") {
            loginUser(username, password);
        } else {
            signupUser(username, password);
        }
    });
}

if (calculateBtn) {
    calculateBtn.addEventListener("click", () => {
        if (!currentUser) {
            authMessage.textContent = "Please login to track your BMI.";
            openAuthModal(false);
            return;
        }
        authMessage.textContent = "";

        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);

        if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
            const inputSectionError = document.querySelector('.input-section .error-message');
            if(inputSectionError) {
                inputSectionError.textContent = "Please enter valid positive numbers for height (cm) and weight (kg).";
            } else {
                 alert("Please enter valid positive numbers for height (cm) and weight (kg).");
            }
            return;
        }

        const bmi = calculateBMI(height, weight);
        const category = categorizeBMI(bmi);

        bmiValueSpan.textContent = bmi.toFixed(2);
        bmiCategoryP.textContent = category.charAt(0).toUpperCase() + category.slice(1);

        updateProgressBar(bmi);
        healthTipP.textContent = getRandomTip(category);
        updateWorkoutList(category);

        const today = new Date().toISOString().slice(0, 10);

        const existingEntryIndex = bmiHistory.findIndex(entry => entry.date === today);
        if (existingEntryIndex !== -1) {
            bmiHistory[existingEntryIndex] = { date: today, bmi: bmi, category: category };
        } else {
            bmiHistory.push({ date: today, bmi: bmi, category: category });
        }
        saveBmiHistory();

        updateAllUI();
        showContentSections();
    });
}

if (newTipBtn) {
    newTipBtn.addEventListener("click", () => {
        if (!bmiValueSpan.textContent || !currentUser) {
            alert("Please calculate your BMI first or login.");
            return;
        }
        const currentCategory = bmiCategoryP.textContent.toLowerCase();
        if (currentCategory) {
            healthTipP.textContent = getRandomTip(currentCategory);
        }
    });
}

if (authModal) {
    authModal.addEventListener('click', (event) => {
        if (event.target === authModal && !currentUser) {
            closeAuthModal();
        }
    });
}
