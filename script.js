// --- DATA STORAGE ---
const DB_TASKS = 'studyping_tasks_v5';
const DB_USER = 'studyping_user_v5';

let tasks = JSON.parse(localStorage.getItem(DB_TASKS)) || [];
let user = JSON.parse(localStorage.getItem(DB_USER)) || null;
let currentFilter = 'all';

// --- INITIAL LOAD SEQUENCE ---
window.onload = () => {
    const loader = document.getElementById('loading-screen');
    
    // Always show loader for 2 seconds for a professional feel
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.classList.add('hidden');
            
            // Check for profile AFTER loading
            if (!user) {
                document.getElementById('setup-screen').classList.remove('hidden');
            } else {
                launchApp();
            }
        }, 600);
    }, 2000);
};

// --- ACCOUNT SETUP ---
function completeSetup() {
    const name = document.getElementById('user-name-input').value;
    const cls = document.getElementById('user-class-input').value;

    if (name.trim() && cls.trim()) {
        user = { name, class: cls };
        localStorage.setItem(DB_USER, JSON.stringify(user));
        document.getElementById('setup-screen').classList.add('hidden');
        launchApp();
    } else {
        alert("Please enter your name and class!");
    }
}

function launchApp() {
    document.getElementById('app-shell').classList.remove('hidden');
    updateUI();
    renderTasks();
}

function updateUI() {
    document.getElementById('greet-name').innerText = `Hi ${user.name}! 👋`;
    document.getElementById('greet-class').innerText = `Your Current Class: ${user.class}`;
    document.getElementById('side-name').innerText = user.name;
    document.getElementById('side-class').innerText = user.class;
}

// --- SIDEBAR LOGIC (Fixing the "not working" issue) ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('active');
        overlay.style.display = 'block';
    }
}

function filterView(view) {
    currentFilter = view;
    
    // Update the heading on the dashboard
    const titles = {
        all: "Upcoming Tasks",
        priority: "⭐ Priority Tasks",
        today: "⏰ Due Today",
        exams: "🚨 Exams Corner"
    };
    document.getElementById('greet-class').innerText = titles[view] || "Tasks";
    
    toggleSidebar(); // Close sidebar after clicking
    renderTasks();
}

// --- MODAL CONTROLS ---
function openModal() { document.getElementById('task-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('task-modal').classList.add('hidden'); }
function openEditProfile() { 
    document.getElementById('edit-name-input').value = user.name;
    document.getElementById('edit-class-input').value = user.class;
    document.getElementById('edit-modal').classList.remove('hidden'); 
    toggleSidebar();
}
function closeEditProfile() { document.getElementById('edit-modal').classList.add('hidden'); }

// --- PROFILE EDIT ---
function saveProfileEdit() {
    const newName = document.getElementById('edit-name-input').value;
    const newCls = document.getElementById('edit-class-input').value;
    
    if(newName && newCls) {
        user.name = newName;
        user.class = newCls;
        localStorage.setItem(DB_USER, JSON.stringify(user));
        updateUI();
        closeEditProfile();
    }
}

// --- TASK CRUD ---
function addTask() {
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const type = document.getElementById('task-type').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;

    if (!title || !subject || !date) return alert("Fill in the Title, Subject, and Date!");

    tasks.push({ id: Date.now(), title, subject, type, date, priority, completed: false });
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    
    // Reset form
    document.getElementById('task-title').value = '';
    closeModal();
    renderTasks();
}

function deleteTask(id) {
    if(confirm("Delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
        renderTasks();
    }
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

    // Filters
    if (currentFilter === 'priority') filtered = filtered.filter(t => t.priority === 'High');
    if (currentFilter === 'exams') filtered = filtered.filter(t => t.type === 'Exam' || t.type === 'Test');
    if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date === today);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px; opacity:0.5;">No tasks found.</p>`;
        return;
    }

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'task-item'; // Styles from CSS
        div.style = `background:white; padding:15px; border-radius:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border-left:6px solid #2563EB; box-shadow:0 4px 6px rgba(0,0,0,0.05); ${t.completed ? 'opacity:0.5;' : ''}`;
        
        div.innerHTML = `
            <div onclick="toggleStatus(${t.id})" style="flex-grow:1; cursor:pointer;">
                <strong style="${t.completed ? 'text-decoration:line-through;' : ''}">${t.title}</strong>
                <div style="font-size:0.8rem; color:#64748B;">${t.subject} • ${t.date}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.2rem;">${t.completed ? '✅' : '⭕'}</span>
                <button onclick="deleteTask(${t.id})" style="background:none; border:none; color:#EF4444; cursor:pointer;">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}