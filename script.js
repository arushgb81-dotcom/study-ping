// Local Storage Keys
const DB_TASKS = 'studyping_tasks_pro';
const DB_USER = 'studyping_user_pro';

let tasks = JSON.parse(localStorage.getItem(DB_TASKS)) || [];
let user = JSON.parse(localStorage.getItem(DB_USER)) || null;
let currentFilter = 'all';

// --- INITIAL LOAD SEQUENCE ---
window.onload = () => {
    const loader = document.getElementById('loading-screen');
    
    // Always show loader for 2 seconds for that "smooth" feel
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.classList.add('hidden');
            
            // Step 2: Check for User
            if (!user) {
                document.getElementById('setup-screen').classList.remove('hidden');
            } else {
                launchApp();
            }
        }, 600);
    }, 2000);
};

// --- SETUP ACCOUNT ---
function completeSetup() {
    const nameInput = document.getElementById('user-name-input').value;
    const classInput = document.getElementById('user-class-input').value;

    if (nameInput.trim() && classInput.trim()) {
        user = { name: nameInput, class: classInput };
        localStorage.setItem(DB_USER, JSON.stringify(user));
        document.getElementById('setup-screen').classList.add('hidden');
        launchApp();
    } else {
        alert("Please fill in both fields to create your account.");
    }
}

function launchApp() {
    document.getElementById('app-shell').classList.remove('hidden');
    updateUIStrings();
    renderTasks();
}

function updateUIStrings() {
    document.getElementById('greet-name').innerText = `Hi ${user.name}! 👋`;
    document.getElementById('greet-class').innerText = `Your Current Class: ${user.class}`;
    document.getElementById('side-name').innerText = user.name;
    document.getElementById('side-class').innerText = user.class;
}

// --- SIDEBAR & NAVIGATION ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

document.getElementById('menu-btn').onclick = toggleSidebar;

function filterView(view) {
    currentFilter = view;
    document.getElementById('view-label').innerText = view.toUpperCase() + " TASKS";
    
    // Update Active UI in sidebar
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');

    toggleSidebar();
    renderTasks();
}

// --- TASK MODAL ---
function openModal() { document.getElementById('task-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('task-modal').classList.add('hidden'); }

// --- TASK ACTIONS ---
function addTask() {
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const type = document.getElementById('task-type').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;

    if (!title || !subject || !date) return alert("Please fill all required fields!");

    const newTask = {
        id: Date.now(),
        title, subject, type, date, priority,
        completed: false
    };

    tasks.push(newTask);
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    closeModal();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    renderTasks();
}

function toggleStatus(id) {
    tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    renderTasks();
}

// --- RENDER ENGINE ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';

    let filtered = [...tasks].sort((a,b) => new Date(a.date) - new Date(b.date));

    // Filter Logic
    if (currentFilter === 'priority') filtered = filtered.filter(t => t.priority === 'High');
    if (currentFilter === 'exams') filtered = filtered.filter(t => t.type === 'Exam' || t.type === 'Test');
    if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date === today);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; opacity:0.5;">No tasks found here.</p>`;
        return;
    }

    filtered.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
            <div onclick="toggleStatus(${task.id})" style="flex-grow:1; cursor:pointer;">
                <strong style="display:block; font-size:1.1rem;">${task.title}</strong>
                <small style="color:#64748B;">${task.subject} • ${task.type} • ${task.date}</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:0.8rem; font-weight:bold; color:var(--primary);">${task.priority}</span>
                <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:var(--red); font-size:1.2rem; cursor:pointer;">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- PROFILE EDIT ---
function openEditProfile() { document.getElementById('edit-modal').classList.remove('hidden'); }
function closeEditProfile() { document.getElementById('edit-modal').classList.add('hidden'); }
function saveProfileEdit() {
    user.name = document.getElementById('edit-name-input').value;
    user.class = document.getElementById('edit-class-input').value;
    localStorage.setItem(DB_USER, JSON.stringify(user));
    updateUIStrings();
    closeEditProfile();
}