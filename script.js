// --- DATABASE KEYS ---
const DB_TASKS = 'studyping_tasks_v1.3';
const DB_USER = 'studyping_user_v1.3';
const DB_THEME = 'studyping_theme_v1.3';
const DB_STREAK = 'studyping_streak_v1.3';

// --- STATE MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem(DB_TASKS)) || [];
let user = JSON.parse(localStorage.getItem(DB_USER)) || null;
let streakData = JSON.parse(localStorage.getItem(DB_STREAK)) || { count: 0, lastActiveDate: null };
let currentFilter = 'all';

// --- SUBJECT MAP ---
const subjectsMap = {
    Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
    Commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
    Humanities: ["History", "Political Science", "Geography", "Economics", "Psychology", "English"],
    General: ["Mathematics", "English", "Science", "Social Science", "Computer", "Hindi"]
};

// --- INITIALIZATION ---
window.onload = () => {
    populateClassDropdown('setup-class');
    populateClassDropdown('edit-class');

    // Load Theme
    const savedTheme = localStorage.getItem(DB_THEME);
    const toggle = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if(toggle) toggle.checked = true;
    }

    checkStreakValidity();

    // Loading Screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            if (!user) navigateTo('view-setup');
            else {
                navigateTo('view-main');
                setFilter('all');
                updateUI();
                renderTasks(); // FIX 1: Explicit render on load
            }
        }, 500);
    }, 1200);
};

// --- NAVIGATION ---
function navigateTo(viewId) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').style.display = 'none';

    if(viewId === 'view-main') {
        renderTasks(); // FIX 1: Render when returning to dashboard
        updateUI();
    }
    if(viewId === 'view-streak') renderStreakPage();
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

// --- STREAK LOGIC ---
function checkStreakValidity() {
    if (!streakData.lastActiveDate) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const lastActive = new Date(streakData.lastActiveDate);
    lastActive.setHours(0,0,0,0);
    
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        streakData.count = 0;
        localStorage.setItem(DB_STREAK, JSON.stringify(streakData));
    }
}

function updateStreakOnCompletion(taskDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const tDate = new Date(taskDate);
    tDate.setHours(0,0,0,0);

    if (todayDate <= tDate) {
        if (streakData.lastActiveDate !== todayStr) {
            streakData.count++;
            streakData.lastActiveDate = todayStr;
            localStorage.setItem(DB_STREAK, JSON.stringify(streakData));
            alert("🔥 Streak Increased! Great job!");
            updateUI(); // FIX 2: Update badge immediately
        }
    }
}

// STREAK PAGE LOGIC (UPDATED)
function renderStreakPage() {
    const count = streakData.count;
    document.getElementById('streak-count-large').innerText = count;
    document.getElementById('current-milestone').innerText = `${count} Days`;
    
    // Milestones: 3, 7, 14, 30, 50, 100
    const milestones = [3, 7, 14, 30, 50, 100];
    let nextGoal = milestones.find(m => m > count) || (count + 10);
    
    document.getElementById('next-milestone').innerText = `Next Goal: ${nextGoal}`;
    
    // Calculate progress percentage
    let prevGoal = 0; // simplistic progress from 0
    let percentage = (count / nextGoal) * 100;
    if(percentage > 100) percentage = 100;
    
    document.getElementById('streak-bar').style.width = `${percentage}%`;

    // Messages
    const msgEl = document.getElementById('streak-msg');
    if(count === 0) msgEl.innerText = "Start a task today to light the fire!";
    else if(count < 3) msgEl.innerText = "You're warming up! Keep going.";
    else if(count < 7) msgEl.innerText = "You're on fire! Almost a week!";
    else msgEl.innerText = "Unstoppable! Incredible consistency.";
}

function shareStreak() {
    const text = `I'm on a ${streakData.count}-day study streak using Study Ping 📚🔥`;
    if (navigator.share) {
        navigator.share({ title: 'Study Ping Streak', text: text, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text);
        alert("Text copied to clipboard!");
    }
}

// --- TASK RENDERING ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    
    let filteredTasks = tasks;
    const todayStr = new Date().toISOString().split('T')[0];

    if (currentFilter === 'priority') filteredTasks = tasks.filter(t => t.priority === 'High' && !t.completed);
    else if (currentFilter === 'today') filteredTasks = tasks.filter(t => t.date === todayStr && !t.completed);
    else if (currentFilter === 'exams') {
        filteredTasks = tasks.filter(t => t.type === 'Exam');
        filteredTasks.sort((a,b) => new Date(a.date) - new Date(b.date));
    } else {
        filteredTasks.sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
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

// --- TASK ACTIONS ---
function openTaskDetail(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('detail-id').value = task.id;
    document.getElementById('detail-title').value = task.title;
    document.getElementById('detail-type').value = task.type;
    document.getElementById('detail-date').value = task.date;
    document.getElementById('detail-priority').value = task.priority;
    
    const toggle = document.getElementById('detail-complete-toggle');
    toggle.checked = task.completed;
    document.getElementById('completion-text').innerText = task.completed ? "Completed ✅" : "Mark as Completed";

    const subSelect = document.getElementById('detail-subject');
    subSelect.innerHTML = '';
    let list = subjectsMap.General;
    if (user.class >= 11) list = subjectsMap[user.stream] || subjectsMap.General;
    list.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s; opt.innerText = s;
        if(s === task.subject) opt.selected = true;
        subSelect.appendChild(opt);
    });

    document.getElementById('detail-modal').classList.remove('hidden');
}

function updateTaskDetails() {
    const id = parseInt(document.getElementById('detail-id').value);
    const title = document.getElementById('detail-title').value;
    const type = document.getElementById('detail-type').value;
    const subject = document.getElementById('detail-subject').value;
    const date = document.getElementById('detail-date').value;
    const priority = document.getElementById('detail-priority').value;

    if(!title || !date) return alert("Title and Date are required");
    const taskIndex = tasks.findIndex(t => t.id === id);
    if(taskIndex > -1) {
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

function toggleTaskCompletion() {
    const id = parseInt(document.getElementById('detail-id').value);
    const toggle = document.getElementById('detail-complete-toggle');
    const isComplete = toggle.checked;
    
    document.getElementById('completion-text').innerText = isComplete ? "Completed ✅" : "Mark as Completed";

    const taskIndex = tasks.findIndex(t => t.id === id);
    if(taskIndex > -1) {
        if (isComplete && !tasks[taskIndex].completed) {
            updateStreakOnCompletion(tasks[taskIndex].date);
        }
        tasks[taskIndex].completed = isComplete;
        localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
        updateUI(); // FIX 2: Update badge immediately
    }
}

function deleteTaskFromModal() {
    const id = parseInt(document.getElementById('detail-id').value);
    if(confirm("Permanently delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
        closeAllModals();
        renderTasks();
    }
}

function setFilter(type) {
    currentFilter = type;
    renderTasks();
    toggleSidebar();
    const title = document.getElementById('page-title');
    const sub = document.getElementById('page-subtitle');
    const streakBadge = document.getElementById('dashboard-streak');

    if (type === 'all') {
        title.innerText = `Hi ${user.name}!`;
        sub.innerText = "Here is your study plan.";
        streakBadge.classList.remove('hidden');
    } else {
        streakBadge.classList.add('hidden');
        if (type === 'priority') { title.innerText = "High Priority"; sub.innerText = "Focus on these."; }
        if (type === 'today') { title.innerText = "Due Today"; sub.innerText = "Finish these by tonight."; }
        if (type === 'exams') { title.innerText = "Exams"; sub.innerText = "Upcoming assessments."; }
    }
}

function updateUI() {
    if(!user) return;
    document.getElementById('greet-name').innerText = `Hi ${user.name}!`;
    document.getElementById('side-name').innerText = user.name;
    let details = `Class ${user.class}`;
    if(user.stream !== 'General') details += ` • ${user.stream}`;
    document.getElementById('side-class').innerText = details;
    
    // Update Streak Badge
    const badge = document.getElementById('dashboard-streak');
    badge.innerText = `🔥 Streak: ${streakData.count} days`;
    badge.classList.remove('hidden');
}

// --- HELPERS ---
function openTaskModal() {
    if(!user) return alert("Please complete setup first.");
    const subSelect = document.getElementById('task-subject');
    subSelect.innerHTML = '';
    let list = subjectsMap.General;
    if (user.class >= 11) list = subjectsMap[user.stream] || subjectsMap.General;
    list.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s; opt.innerText = s;
        subSelect.appendChild(opt);
    });
    document.getElementById('task-date').valueAsDate = new Date();
    document.getElementById('task-modal').classList.remove('hidden');
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const type = document.getElementById('task-type').value;
    const sub = document.getElementById('task-subject').value;
    const date = document.getElementById('task-date').value;
    const prio = document.getElementById('task-priority').value;

    if(!title || !date) return alert("Title and Date are required!");
    const newTask = { id: Date.now(), title, type, subject: sub, date, priority: prio, completed: false };
    tasks.push(newTask);
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    document.getElementById('task-title').value = '';
    closeAllModals();
    renderTasks();
}

function populateClassDropdown(id) {
    const sel = document.getElementById(id);
    if(!sel) return;
    sel.innerHTML = '<option value="" disabled selected>Select Class</option>';
    for(let i=1; i<=12; i++) {
        let opt = document.createElement('option');
        opt.value = i; opt.innerText = `Class ${i}`;
        sel.appendChild(opt);
    }
}
function toggleStream(mode) {
    const clsId = mode === 'setup' ? 'setup-class' : 'edit-class';
    const divId = mode === 'setup' ? 'setup-stream-div' : 'edit-stream-div';
    const val = document.getElementById(clsId).value;
    const div = document.getElementById(divId);
    if(val == "11" || val == "12") div.classList.remove('hidden');
    else div.classList.add('hidden');
}
function finishSetup() {
    const name = document.getElementById('setup-name').value;
    const cls = document.getElementById('setup-class').value;
    const streamVal = document.getElementById('setup-stream').value;
    if(!name || !cls) return alert("Please enter Name and Class");
    let finalStream = 'General';
    if(cls == "11" || cls == "12") {
        if(!streamVal) return alert("Please select a stream");
        finalStream = streamVal;
    }
    user = { name, class: cls, stream: finalStream };
    localStorage.setItem(DB_USER, JSON.stringify(user));
    navigateTo('view-main');
    setFilter('all');
}
function openEditModal() {
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-class').value = user.class;
    toggleStream('edit'); 
    if(user.class >= 11) document.getElementById('edit-stream').value = user.stream;
    document.getElementById('edit-modal').classList.remove('hidden');
    toggleSidebar();
}
function saveProfileChanges() {
    const name = document.getElementById('edit-name').value;
    const cls = document.getElementById('edit-class').value;
    const streamVal = document.getElementById('edit-stream').value;
    if(!name || !cls) return alert("Fields cannot be empty");
    let finalStream = 'General';
    if(cls == "11" || cls == "12") finalStream = streamVal;
    user.name = name;
    user.class = cls;
    user.stream = finalStream;
    localStorage.setItem(DB_USER, JSON.stringify(user));
    closeAllModals();
    updateUI();
}
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')); }
function toggleTheme(checkbox) {
    if(checkbox.checked) { document.body.classList.add('dark-mode'); localStorage.setItem(DB_THEME, 'dark'); } 
    else { document.body.classList.remove('dark-mode'); localStorage.setItem(DB_THEME, 'light'); }
}