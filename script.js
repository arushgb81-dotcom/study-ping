const DB_TASKS = 'studyping_tasks_v1.5'; const DB_USER = 'studyping_user_v1.5'; const DB_THEME = 'studyping_theme_v1.5'; const DB_STREAK = 'studyping_streak_v1.5'; const DB_CHALLENGE = 'studyping_challenge_last_date';

const SYLLABUS = { "Grammar": { "English": ["Sentences & Nouns", "Pronouns & Adjectives", "Verbs & Adverbs", "Tenses (All forms)", "Active/Passive Voice", "Reported Speech", "Modals & Clauses", "Writing: Letters/Essays"], "Hindi": ["भाषा, लिपि और व्याकरण", "संज्ञा, सर्वनाम, विशेषण", "क्रिया और काल", "संधि और समास", "मुहावरे और लोकोक्तियाँ", "पत्र और निबंध लेखन"] }, "1": { "Math": ["Shapes", "Numbers 1-9", "Addition", "Subtraction"], "English": ["Raindrops", "Marigold"], "Hindi": ["Rimjhim"] }, "2": { "Math": ["Counting", "Lines", "Weight", "Time"], "English": ["Marigold 2"], "Hindi": ["Rimjhim 2"] }, "3": { "EVS": ["Poonam's Day Out", "Water O Water", "Foods We Eat", "Story of Food", "Left-Right"], "Math": ["Where to Look From", "Fun with Numbers", "Give and Take", "Time Goes On"] }, "4": { "EVS": ["Going to School", "Ear to Ear", "Valley of Flowers", "A River's Tale", "Spicy Riddles"], "Math": ["Building with Bricks", "Long and Short", "Trip to Bhopal", "Carts and Wheels"] }, "5": { "EVS": ["Super Senses", "Seeds and Seeds", "Sunita in Space", "Blow Hot Blow Cold", "Who will do this work"], "Math": ["The Fish Tale", "Shapes and Angles", "Parts and Wholes", "Smart Charts"] }, "6": { "Science": ["The Wonderful World of Science", "Diversity in Living World", "Mindful Eating", "Magnets", "Motion", "Light Shadows Reflections", "Living Creatures"], "Math": ["Knowing Our Numbers", "Whole Numbers", "Integers", "Fractions", "Decimals", "Algebra", "Ratio and Proportion"], "Hindi": ["Vasant: Woh Chidiya Jo", "Bachpan", "Nadan Dost", "Ticket Album", "Jhansi Ki Rani"], "English": ["Honeysuckle", "A Pact with the Sun"] }, "7": { "Science": ["Nutrition in Plants", "Acids Bases Salts", "Respiration in Organisms", "Transportation", "Electric Current", "Light", "Forests"], "Math": ["Integers", "Fractions & Decimals", "Simple Equations", "Lines and Angles", "Triangles", "Algebraic Expressions"], "Hindi": ["Hum Panchi Unmukt Gagan", "Kathputli", "Mithaiwala", "Neelkant", "Veer Kunwar Singh"] }, "8": { "Science": ["Crop Production", "Microorganisms", "Coal and Petroleum", "Force and Pressure", "Friction", "Sound", "Light"], "Math": ["Rational Numbers", "Linear Equations", "Quadrilaterals", "Squares and Cubes", "Algebraic Identities", "Factorisation"], "Hindi": ["Lakh Ki Chudiyan", "Bus Ki Yatra", "Kabir Ki Sakhiyan", "Sudama Charit"] }, "9": { "Science": ["Matter in Our Surroundings", "Atoms and Molecules", "The Fundamental Unit of Life", "Tissues", "Motion", "Force", "Gravitation", "Work and Energy"], "Math": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations", "Lines and Angles", "Triangles", "Circles", "Surface Areas"], "Hindi": ["Do Bailon Ki Katha", "Lhasa Ki Ore", "Premchand Ke Phate Joote", "Sakhiyan"] }, "10": { "Science": ["Chemical Reactions", "Acids Bases Salts", "Metals Non-Metals", "Carbon Compounds", "Life Processes", "Heredity", "Light", "Electricity", "Magnetic Effects"], "Math": ["Real Numbers", "Polynomials", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Trigonometry", "Circles", "Probability"], "Hindi": ["Pad", "Ram-Lakshman-Parshuram Samvad", "Netaji Ka Chashma", "Balgobin Bhagat"] }, "11": { "Physics": ["Units and Measurements", "Motion in a Straight Line", "Laws of Motion", "Work Energy Power", "Gravitation", "Thermodynamics", "Waves"], "Chemistry": ["Structure of Atom", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Redox Reactions", "Organic Chemistry Basics", "Hydrocarbons"], "Math": ["Sets", "Relations & Functions", "Trigonometric Functions", "Complex Numbers", "Permutations Combinations", "Limits & Derivatives"], "Biology": ["Biological Classification", "Plant Kingdom", "Animal Kingdom", "Cell Cycle", "Photosynthesis", "Respiration", "Body Fluids"] }, "12": { "Physics": ["Electric Charges", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Ray Optics", "Wave Optics", "Semiconductors"], "Chemistry": ["Solutions", "Electrochemistry", "Chemical Kinetics", "Coordination Compounds", "Haloalkanes", "Aldehydes & Ketones", "Biomolecules"], "Math": ["Inverse Trigonometry", "Matrices", "Determinants", "Integrals", "Differential Equations", "Vector Algebra", "Probability"], "Biology": ["Human Reproduction", "Reproductive Health", "Principles of Inheritance", "Molecular Basis", "Evolution", "Biotechnology"] } };

let tasks = []; let user = null; let streakData = { count: 0, lastActiveDate: null }; let currentFilter = 'all';

const questionBank = { "Physics": [ { q: "Unit of Force?", o: ["Newton", "Joule", "Watt", "Pascal"], a: 0 }, { q: "Value of g?", o: ["9.8 m/s²", "10 m/s", "9.8 km/s", "8.9 m/s²"], a: 0 }, { q: "E = mc² is by?", o: ["Newton", "Einstein", "Bohr", "Tesla"], a: 1 }, { q: "Light particle?", o: ["Photon", "Electron", "Proton", "Neutron"], a: 0 }, { q: "Ohm's Law?", o: ["V=IR", "P=VI", "F=ma", "E=hf"], a: 0 } ], "Mathematics": [ { q: "Derivative of x²?", o: ["2x", "x", "2", "x²"], a: 0 }, { q: "Sin(90°)?", o: ["0", "1", "-1", "0.5"], a: 1 }, { q: "Value of Pi?", o: ["3.14", "2.14", "3.41", "3.12"], a: 0 }, { q: "Slope of y=3x+1?", o: ["3", "1", "x", "0"], a: 0 }, { q: "Root of 144?", o: ["10", "11", "12", "13"], a: 2 } ], "Chemistry": [ { q: "Symbol for Gold?", o: ["Ag", "Au", "Fe", "Cu"], a: 1 }, { q: "PH of water?", o: ["7", "1", "14", "5"], a: 0 }, { q: "Atomic number of C?", o: ["6", "12", "8", "14"], a: 0 }, { q: "H2SO4 is?", o: ["Acid", "Base", "Salt", "Gas"], a: 0 }, { q: "Gas in balloons?", o: ["Helium", "Oxygen", "Nitrogen", "Argon"], a: 0 } ], "General": [ { q: "Capital of India?", o: ["Mumbai", "Delhi", "Kolkata", "Chennai"], a: 1 }, { q: "Photosynthesis uses?", o: ["Sunlight", "Moonlight", "Fire", "Heat"], a: 0 }, { q: "Hardest substance?", o: ["Gold", "Iron", "Diamond", "Silver"], a: 2 }, { q: "Human bones count?", o: ["206", "208", "300", "105"], a: 0 }, { q: "Freezing point (C)?", o: ["0", "100", "-10", "32"], a: 0 } ] };

window.onload = () => { try { migrateData(); tasks = JSON.parse(localStorage.getItem(DB_TASKS)) || []; user = JSON.parse(localStorage.getItem(DB_USER)) || null; streakData = JSON.parse(localStorage.getItem(DB_STREAK)) || { count: 0, lastActiveDate: null };

    populateClassDropdown('setup-class');
    populateClassDropdown('edit-class');

    const savedTheme = localStorage.getItem(DB_THEME);
    const toggle = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    }

    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.remove('active');
    if (ov) ov.style.display = 'none';

    checkStreakValidity();
    startSmartPingLoop();
    checkNotifPermissionLogic();
} catch (e) {
    console.error("Initialization Error:", e);
} finally {
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) ls.style.opacity = '0';
        setTimeout(() => {
            if (ls) ls.classList.add('hidden');
            if (!user) navigateTo('view-setup');
            else {
                navigateTo('view-main');
                setFilter('all');
                updateUI();
                renderTasks();
            }
        }, 500);
    }, 1200);
}
};

function migrateData() { if (!localStorage.getItem(DB_USER) && localStorage.getItem('studyping_user_v1.4')) { localStorage.setItem(DB_USER, localStorage.getItem('studyping_user_v1.4')); localStorage.setItem(DB_TASKS, localStorage.getItem('studyping_tasks_v1.4')); localStorage.setItem(DB_STREAK, localStorage.getItem('studyping_streak_v1.4')); localStorage.setItem(DB_THEME, localStorage.getItem('studyping_theme_v1.4')); } }

function toggleSidebar() { const sb = document.getElementById('sidebar'); const ov = document.getElementById('sidebar-overlay'); if (sb && ov) { sb.classList.toggle('active'); if (sb.classList.contains('active')) { ov.style.display = 'block'; } else { ov.style.display = 'none'; } } }

function checkNotifPermissionLogic() { if (!("Notification" in window)) return; const alreadyAsked = localStorage.getItem('studyping_notif_asked'); if (Notification.permission === 'default' && !alreadyAsked && user) { setTimeout(() => { const modal = document.getElementById('notif-modal'); if (modal) modal.classList.remove('hidden'); }, 3000); } }

function requestNotifPermission() { Notification.requestPermission().then(permission => { if (permission === "granted") { new Notification("Study Ping 🧠", { body: "Smart notifications enabled!", icon: 'icon-192.png' }); } localStorage.setItem('studyping_notif_asked', 'true'); closeNotifModal(); }); }

function closeNotifModal() { const modal = document.getElementById('notif-modal'); if (modal) modal.classList.add('hidden'); }

function startSmartPingLoop() { triggerSmartNotification(); setInterval(triggerSmartNotification, 60 * 60 * 1000); }

function triggerSmartNotification() { if (!user) return; const hour = new Date().getHours(); if (hour < 7 || hour > 22) return;

if (Notification.permission === "granted") {
    const todayStr = new Date().toISOString().split('T')[0];
    const tasksToday = tasks.filter(t => t.date === todayStr && !t.completed).length;
    let msg = `You have ${tasksToday} tasks pending.`;
    if (tasksToday === 0) msg = "Great job! Want to learn something new?";

    new Notification("Study Ping 🧠", { body: msg, icon: 'icon-192.png' });
}

if (Math.random() > 0.5) {
    const title = "Study Tip";
    const msg = streakData.count > 2 ? `🔥 ${streakData.count} Day Streak!` : "Stay focused on your goals.";
    showSmartToast(title, msg);
}
}

function showSmartToast(title, msg) { const el = document.getElementById('ping-title'); const msgEl = document.getElementById('ping-msg'); const toast = document.getElementById('smart-ping-toast'); if (el) el.innerText = title; if (msgEl) msgEl.innerText = msg; if (toast) { toast.classList.remove('hidden'); toast.classList.add('slide-in-toast'); setTimeout(() => dismissPing(), 6000); } }

function dismissPing() { const toast = document.getElementById('smart-ping-toast'); if (toast) toast.classList.add('hidden'); }

function navigateTo(viewId) { document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden')); const target = document.getElementById(viewId); if (target) target.classList.remove('hidden');

const sb = document.getElementById('sidebar');
const ov = document.getElementById('sidebar-overlay');
if (sb) sb.classList.remove('active');
if (ov) ov.style.display = 'none';

if (viewId === 'view-main') {
    renderTasks();
    updateUI();
}
if (viewId === 'view-streak') {
    streakData = JSON.parse(localStorage.getItem(DB_STREAK)) || { count: 0, lastActiveDate: null };
    renderStreakPage();
}
}

function checkStreakValidity() { if (!streakData.lastActiveDate) return; const today = new Date(); today.setHours(0, 0, 0, 0); const lastActive = new Date(streakData.lastActiveDate); lastActive.setHours(0, 0, 0, 0); const diffDays = Math.ceil(Math.abs(today - lastActive) / (1000 * 60 * 60 * 24)); if (diffDays > 1) { streakData.count = 0; localStorage.setItem(DB_STREAK, JSON.stringify(streakData)); } }

function incrementStreak() { const todayStr = new Date().toISOString().split('T')[0]; if (streakData.lastActiveDate !== todayStr) { streakData.count++; streakData.lastActiveDate = todayStr; localStorage.setItem(DB_STREAK, JSON.stringify(streakData)); fireConfetti(); updateUI(); renderStreakPage(); return true; } return false; }

function updateStreakOnCompletion(taskDate) { if (incrementStreak()) { setTimeout(() => { alert("🔥 Streak +1! Keep going!"); }, 100); } }

function fireConfetti() { const container = document.getElementById('confetti-container'); if (!container) return; container.innerHTML = ''; const colors = ['#2563EB', '#F59E0B', '#EF4444', '#10B981']; for (let i = 0; i < 30; i++) { const el = document.createElement('div'); el.className = 'confetti'; el.style.left = Math.random() * 100 + 'vw'; el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; el.style.animationDuration = (Math.random() * 2 + 2) + 's'; container.appendChild(el); } setTimeout(() => container.innerHTML = '', 4000); }

function initChallenge() { toggleSidebar(); const todayStr = new Date().toISOString().split('T')[0]; const lastPlayed = localStorage.getItem(DB_CHALLENGE);

document.getElementById('challenge-subject-select').classList.add('hidden');
document.getElementById('challenge-blocked').classList.add('hidden');

if (lastPlayed === todayStr) {
    document.getElementById('challenge-blocked').classList.remove('hidden');
} else {
    document.getElementById('challenge-subject-select').classList.remove('hidden');
    renderSubjectButtons();
}
navigateTo('view-challenge-intro');
}

function renderSubjectButtons() { const container = document.getElementById('subject-buttons'); container.innerHTML = ''; const subjects = (user.class >= 11 && user.stream !== 'General') ? [user.stream, "General"] : ["General", "Mathematics", "Science"];

let availableKeys = [];
if (user.stream === 'Science') availableKeys = ['Physics', 'Chemistry', 'Mathematics'];
else if (user.stream === 'Commerce') availableKeys = ['Mathematics', 'General'];
else availableKeys = ['General', 'Mathematics'];
availableKeys = [...new Set(availableKeys)];

availableKeys.forEach(sub => {
    if (questionBank[sub]) {
        const btn = document.createElement('button');
        btn.className = 'subject-btn';
        btn.innerText = sub;
        btn.onclick = () => startQuiz(sub);
        container.appendChild(btn);
    }
});
}

function startQuiz(subject) { const allQ = questionBank[subject]; challengeState.questions = allQ.sort(() => 0.5 - Math.random()).slice(0, 5); challengeState.score = 0; challengeState.qIndex = 0; navigateTo('view-quiz'); loadQuestion(); }

function loadQuestion() { if (challengeState.qIndex >= 5) { endQuiz(); return; } const qData = challengeState.questions[challengeState.qIndex]; document.getElementById('quiz-q-num').innerText = `Q${challengeState.qIndex + 1}/5`; document.getElementById('quiz-question').innerText = qData.q;

const optsDiv = document.getElementById('quiz-options');
optsDiv.innerHTML = '';
qData.o.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => selectAnswer(btn, idx, qData.a);
    optsDiv.appendChild(btn);
});

clearInterval(challengeState.timer);
let time = 10;
document.getElementById('quiz-timer').innerText = `10s`;
const timerFill = document.getElementById('timer-fill');
if (timerFill) {
    timerFill.style.transition = 'none';
    timerFill.style.width = '100%';
}

setTimeout(() => {
    const fill = document.getElementById('timer-fill');
    if (fill) {
        fill.style.transition = 'width 10s linear';
        fill.style.width = '0%';
    }
}, 100);

challengeState.timer = setInterval(() => {
    time--;
    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) timerEl.innerText = `${time}s`;
    if (time <= 0) {
        clearInterval(challengeState.timer);
        highlightAnswer(null, qData.a);
        setTimeout(() => {
            challengeState.qIndex++;
            loadQuestion();
        }, 1000);
    }
}, 1000);
}

function selectAnswer(btn, selectedIdx, correctIdx) { clearInterval(challengeState.timer); const allBtns = document.querySelectorAll('.option-btn'); allBtns.forEach(b => b.onclick = null); if (selectedIdx === correctIdx) { btn.classList.add('correct'); challengeState.score++; } else { btn.classList.add('wrong'); allBtns[correctIdx].classList.add('correct'); } setTimeout(() => { challengeState.qIndex++; loadQuestion(); }, 1000); }

function highlightAnswer(selectedBtn, correctIdx) { const allBtns = document.querySelectorAll('.option-btn'); if (allBtns[correctIdx]) allBtns[correctIdx].classList.add('correct'); if (selectedBtn) selectedBtn.classList.add('wrong'); }

function endQuiz() { navigateTo('view-quiz-result'); const score = challengeState.score; document.getElementById('result-score').innerText = `${score}/5`; const todayStr = new Date().toISOString().split('T')[0]; localStorage.setItem(DB_CHALLENGE, todayStr); if (score === 5) { document.getElementById('result-emoji').innerText = '🔥'; document.getElementById('result-text').innerText = 'Perfect Score!'; document.getElementById('result-sub').innerText = 'Streak +1 added!'; if (!incrementStreak()) { document.getElementById('result-sub').innerText = 'Streak already active for today!'; } } else { document.getElementById('result-emoji').innerText = '😢'; document.getElementById('result-text').innerText = 'So Close!'; document.getElementById('result-sub').innerText = 'Get 5/5 to increase your streak. Try again tomorrow!'; } }

function renderTasks() { const container = document.getElementById('task-list'); container.innerHTML = ''; let filteredTasks = tasks; const todayStr = new Date().toISOString().split('T')[0]; const searchQ = document.getElementById('task-search').value.toLowerCase();

if (searchQ) {
    filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchQ) || t.subject.toLowerCase().includes(searchQ));
}
if (currentFilter === 'priority') filteredTasks = filteredTasks.filter(t => t.priority === 'High' && !t.completed);
else if (currentFilter === 'today') filteredTasks = filteredTasks.filter(t => t.date === todayStr && !t.completed);
else if (currentFilter === 'exams') {
    filteredTasks = filteredTasks.filter(t => t.type === 'Exam');
    filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
} else {
    filteredTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
}

if (filteredTasks.length === 0) {
    container.innerHTML = `<div style="text-align:center; opacity:0.6; margin-top:50px; font-size:1.2rem;">🍃 No tasks found.</div>`;
    return;
}

filteredTasks.forEach(t => {
    const dateObj = new Date(t.date);
    const dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const div = document.createElement('div');
    div.className = `task-item prio-${t.priority} ${t.completed ? 'completed' : ''}`;
    div.onclick = () => openTaskDetail(t.id);
    div.innerHTML = `
        <div class="task-top">
            <div>
                <div class="task-title">${t.title}</div>
                <div class="task-sub">${t.subject}</div>
            </div>
            ${t.completed ? '<span>✅</span>' : ''}
        </div>
        <div class="task-footer">
            <span class="tag type-${t.type === 'Class Test' ? 'Test' : t.type}">${t.type}</span>
            <div class="date-badge">📅 ${dateDisplay}</div>
        </div>
    `;
    container.appendChild(div);
});
}

function openTaskDetail(id) { const task = tasks.find(t => t.id === id); if (!task) return; document.getElementById('detail-id').value = task.id; document.getElementById('detail-title').value = task.title; document.getElementById('detail-type').value = task.type; document.getElementById('detail-date').value = task.date; document.getElementById('detail-priority').value = task.priority; const toggle = document.getElementById('detail-complete-toggle'); toggle.checked = task.completed; document.getElementById('completion-text').innerText = task.completed ? "Completed ✅" : "Mark as Completed";

const subSelect = document.getElementById('detail-subject');
subSelect.innerHTML = '';
const subjectsMap = {
    Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
    Commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
    Humanities: ["History", "Political Science", "Geography", "Economics", "Psychology", "English"],
    General: ["Mathematics", "English", "Science", "Social Science", "Computer", "Hindi"]
};
let list = subjectsMap.General;
if (user.class >= 11) list = subjectsMap[user.stream] || subjectsMap.General;
list.forEach(s => {
    let opt = document.createElement('option');
    opt.value = s; opt.innerText = s;
    if (s === task.subject) opt.selected = true;
    subSelect.appendChild(opt);
});

const delBtn = document.querySelector('#detail-modal .btn-delete');
if (delBtn) {
    delBtn.style.display = 'block';
    delBtn.style.opacity = task.completed ? '1' : '0.7';
}

document.getElementById('detail-modal').classList.remove('hidden');
}

function updateTaskDetails() { const id = parseInt(document.getElementById('detail-id').value); const title = document.getElementById('detail-title').value; const type = document.getElementById('detail-type').value; const subject = document.getElementById('detail-subject').value; const date = document.getElementById('detail-date').value; const priority = document.getElementById('detail-priority').value;

if (!title || !date) return alert("Title and Date are required");
const taskIndex = tasks.findIndex(t => t.id === id);
if (taskIndex > -1) {
    tasks[taskIndex].title = title;
    tasks[taskIndex].type = type;
    tasks[taskIndex].subject = subject;
    tasks[taskIndex].date = date;
    tasks[taskIndex].priority = priority;
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    closeAllModals();
    renderTasks();
}
}

function toggleTaskCompletion() { const id = parseInt(document.getElementById('detail-id').value); const toggle = document.getElementById('detail-complete-toggle'); const isComplete = toggle.checked; document.getElementById('completion-text').innerText = isComplete ? "Completed ✅" : "Mark as Completed"; const taskIndex = tasks.findIndex(t => t.id === id); if (taskIndex > -1) { if (isComplete && !tasks[taskIndex].completed) { updateStreakOnCompletion(tasks[taskIndex].date); fireConfetti(); } tasks[taskIndex].completed = isComplete; localStorage.setItem(DB_TASKS, JSON.stringify(tasks)); const delBtn = document.querySelector('#detail-modal .btn-delete'); if (delBtn) delBtn.style.opacity = isComplete ? '1' : '0.7'; updateUI(); } }

function deleteTaskFromModal() { const id = parseInt(document.getElementById('detail-id').value); if (confirm("Permanently delete this task?")) { tasks = tasks.filter(t => t.id !== id); localStorage.setItem(DB_TASKS, JSON.stringify(tasks)); closeAllModals(); renderTasks(); } }

function renderStreakPage() { const localStreak = JSON.parse(localStorage.getItem(DB_STREAK)) || { count: 0 }; const count = localStreak.count;

const countEl = document.getElementById('streak-count-large');
if (countEl) countEl.innerText = count;

const currEl = document.getElementById('current-milestone');
if (currEl) currEl.innerText = `${count} Days`;

const milestones = [3, 7, 14, 30, 50, 100];
let nextGoal = milestones.find(m => m > count) || (count + 10);

const nextEl = document.getElementById('next-milestone');
if (nextEl) nextEl.innerText = `Next Goal: ${nextGoal}`;

let percentage = (count / nextGoal) * 100;
if (percentage > 100) percentage = 100;

const barEl = document.getElementById('streak-bar');
if (barEl) barEl.style.width = `${percentage}%`;

const msgEl = document.getElementById('streak-msg');
if (msgEl) {
    if (count === 0) msgEl.innerText = "Start a task or challenge today!";
    else if (count < 3) msgEl.innerText = "You're warming up! Keep going.";
    else if (count < 7) msgEl.innerText = "You're on fire! Almost a week!";
    else msgEl.innerText = "Unstoppable! Incredible consistency.";
}
}

function shareStreak() { const text = `I'm on a ${streakData.count}-day study streak using Study Ping 📚🔥`; if (navigator.share) { navigator.share({ title: 'Study Ping Streak', text: text, url: window.location.href }).catch(console.error); } else { navigator.clipboard.writeText(text); alert("Text copied to clipboard!"); } }

function setFilter(type) { currentFilter = type; renderTasks(); toggleSidebar(); const title = document.getElementById('page-title'); const sub = document.getElementById('page-subtitle'); const streakBadge = document.getElementById('dashboard-streak');

if (type === 'all') {
    title.innerText = `Hi ${user.name}!`;
    sub.innerText = "Here is your study plan.";
    if (streakBadge) streakBadge.classList.remove('hidden');
} else {
    if (streakBadge) streakBadge.classList.add('hidden');
    if (type === 'priority') { title.innerText = "High Priority"; sub.innerText = "Focus on these."; }
    if (type === 'today') { title.innerText = "Due Today"; sub.innerText = "Finish these by tonight."; }
    if (type === 'exams') { title.innerText = "Exams"; sub.innerText = "Upcoming assessments."; }
}
}

function updateUI() { if (!user) return; const nameEl = document.getElementById('side-name'); const classEl = document.getElementById('side-class'); const badge = document.getElementById('dashboard-streak');

if (nameEl) nameEl.innerText = user.name;
if (classEl) {
    let details = `Class ${user.class}`;
    if (user.stream !== 'General') details += ` • ${user.stream}`;
    classEl.innerText = details;
}
if (badge) {
    badge.innerText = `🔥 Streak: ${streakData.count} days`;
    badge.classList.remove('hidden');
}
}

function openTaskModal() { if (!user) return alert("Please complete setup first."); const subSelect = document.getElementById('task-subject'); subSelect.innerHTML = ''; const subjectsMap = { Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"], Commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"], Humanities: ["History", "Political Science", "Geography", "Economics", "Psychology", "English"], General: ["Mathematics", "English", "Science", "Social Science", "Computer", "Hindi"] }; let list = subjectsMap.General; if (user.class >= 11) list = subjectsMap[user.stream] || subjectsMap.General; list.forEach(s => { let opt = document.createElement('option'); opt.value = s; opt.innerText = s; subSelect.appendChild(opt); }); document.getElementById('task-date').valueAsDate = new Date(); document.getElementById('task-modal').classList.remove('hidden'); }
function saveTask() { const title = document.getElementById('task-title').value; const type = document.getElementById('task-type').value; const sub = document.getElementById('task-subject').value; const date = document.getElementById('task-date').value; const prio = document.getElementById('task-priority').value; if (!title || !date) return alert("Title and Date are required!"); const newTask = { id: Date.now(), title, type, subject: sub, date, priority: prio, completed: false }; tasks.push(newTask); localStorage.setItem(DB_TASKS, JSON.stringify(tasks)); document.getElementById('task-title').value = ''; closeAllModals(); renderTasks(); }
function populateClassDropdown(id) { const sel = document.getElementById(id); if (!sel) return; sel.innerHTML = '<option value="" disabled selected>Select Class</option>'; for (let i = 1; i <= 12; i++) { let opt = document.createElement('option'); opt.value = i; opt.innerText = `Class ${i}`; sel.appendChild(opt); } }
function toggleStream(mode) { const clsId = mode === 'setup' ? 'setup-class' : 'edit-class'; const divId = mode === 'setup' ? 'setup-stream-div' : 'edit-stream-div'; const val = document.getElementById(clsId).value; const div = document.getElementById(divId); if (val == "11" || val == "12") div.classList.remove('hidden'); else div.classList.add('hidden'); }
function finishSetup() { const roleSelect = document.getElementById('setup-role'); const role = roleSelect ? roleSelect.value : 'Student'; const name = document.getElementById('setup-name').value;
if (role === 'Teacher') {
const subjects = document.getElementById('teacher-subjects').value;
const classes = document.getElementById('teacher-classes').value;
if (!name) return alert("Please enter your Name.");
user = { name, role: 'Teacher', subjects, classes, class: 'Teacher', stream: 'General' };
} else {
const cls = document.getElementById('setup-class').value;
const streamVal = document.getElementById('setup-stream').value;
if (!name || !cls) return alert("Please enter Name and Class");
let finalStream = 'General';
if (cls == "11" || cls == "12") {
if (!streamVal) return alert("Please select a stream");
finalStream = streamVal;
}
user = { name, class: cls, stream: finalStream, role: 'Student' };
}
localStorage.setItem(DB_USER, JSON.stringify(user));
localStorage.setItem('show_welcome', 'true');
navigateTo('view-main');
setFilter('all');
}
function handleRoleChange() { const role = document.getElementById('setup-role').value; const tFields = document.getElementById('teacher-fields'); const sClass = document.getElementById('setup-class'); const sStream = document.getElementById('setup-stream-div'); if (role === 'Teacher') { tFields.classList.remove('hidden'); sClass.classList.add('hidden'); sStream.classList.add('hidden'); } else { tFields.classList.add('hidden'); sClass.classList.remove('hidden'); toggleStream('setup'); } }
function openEditModal() { document.getElementById('edit-name').value = user.name; document.getElementById('edit-class').value = user.class; toggleStream('edit'); if (user.class >= 11) document.getElementById('edit-stream').value = user.stream; document.getElementById('edit-modal').classList.remove('hidden'); toggleSidebar(); }
function saveProfileChanges() { const name = document.getElementById('edit-name').value; const cls = document.getElementById('edit-class').value; const streamVal = document.getElementById('edit-stream').value; if (!name || !cls) return alert("Fields cannot be empty"); let finalStream = 'General'; if (cls == "11" || cls == "12") finalStream = streamVal; user.name = name; user.class = cls; user.stream = finalStream; localStorage.setItem(DB_USER, JSON.stringify(user)); closeAllModals(); updateUI(); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')); }
function toggleTheme(checkbox) { if (checkbox.checked) { document.body.classList.add('dark-mode'); localStorage.setItem(DB_THEME, 'dark'); } else { document.body.classList.remove('dark-mode'); localStorage.setItem(DB_THEME, 'light'); } }
function openTutorials() { document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden')); const view = document.getElementById('view-tutorials'); if (view) view.classList.remove('hidden');
const sb = document.getElementById('sidebar');
const ov = document.getElementById('sidebar-overlay');
if (sb) sb.classList.remove('active');
if (ov) ov.style.display = 'none';
const list = document.getElementById('tut-subject-list');
list.innerHTML = '';
let subjects = [];
if (SYLLABUS[user.class]) {
subjects = Object.keys(SYLLABUS[user.class]);
} else {
subjects = ["Math", "English", "Science"];
}
subjects.push("Grammar");
subjects.forEach(sub => {
const div = document.createElement('div');
div.className = 'task-item';
div.style.cursor = 'pointer';
div.innerHTML = `<strong>${sub}</strong><span style="float:right">📚</span>`;
div.onclick = () => showChapters(sub);
list.appendChild(div);
});
}
function showChapters(subject) { document.getElementById('tut-subject-container').classList.add('hidden'); document.getElementById('tut-chapter-container').classList.remove('hidden'); document.getElementById('tut-active-subject').innerText = `${subject} Chapters`;
const list = document.getElementById('tut-chapter-list');
list.innerHTML = '';
let chapters = [];
if (subject === "Grammar") {
chapters = [...SYLLABUS.Grammar.English, ...SYLLABUS.Grammar.Hindi];
} else if (SYLLABUS[user.class] && SYLLABUS[user.class][subject]) {
chapters = SYLLABUS[user.class][subject];
} else {
chapters = ["Chapter 1: Basics", "Chapter 2: Advanced"];
}
chapters.forEach(chap => {
const div = document.createElement('div');
div.className = 'task-item';
div.style.marginBottom = "10px";
div.innerHTML = `
    <span>${chap}</span>
    <button class="btn-primary"
        style="margin-top:10px; padding:8px; font-size:0.9rem;"
        onclick="openYouTubeSearch('${subject}', '${chap}')">
        ▶ Search on YouTube
    </button>
`;

list.appendChild(div);
});
}
function openYouTubeSearch(subject, chapter) {
    const query = `Class ${user.class} ${subject} ${chapter} explanation`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}

function closeTutorialChapters() { document.getElementById('tut-chapter-container').classList.add('hidden'); document.getElementById('tut-subject-container').classList.remove('hidden'); }
function appLogout() { localStorage.removeItem(DB_USER); window.location.reload(); }
function postInitChecks() { if (localStorage.getItem('show_welcome') === 'true' && user) { const welcomeModal = document.getElementById('welcome-modal'); if (welcomeModal) { document.getElementById('welcome-title').innerText = `Welcome to Study Ping, ${user.name} 👋`; welcomeModal.classList.remove('hidden'); } localStorage.removeItem('show_welcome'); } }
function dismissWelcome() { document.getElementById('welcome-modal').classList.add('hidden'); checkNotifPermissionLogic(); }
setTimeout(postInitChecks, 2000);