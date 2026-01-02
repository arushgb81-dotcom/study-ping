// --- DATABASE KEYS ---
const DB_TASKS = 'studyping_tasks_v1.2';
const DB_USER = 'studyping_user_v1.2';
const DB_THEME = 'studyping_theme_v1.2';

// --- STATE MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem(DB_TASKS)) || [];
let user = JSON.parse(localStorage.getItem(DB_USER)) || null;
let currentFilter = 'all'; // 'all', 'priority', 'today', 'exams'

// --- SUBJECT MAPPING (Update 3) ---
const subjectsMap = {
    Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
    Commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
    Humanities: ["History", "Political Science", "Geography", "Economics", "Psychology", "English"],
    General: ["Mathematics", "English", "Science", "Social Science", "Computer", "Hindi"] // For Class < 11
};

// --- INITIALIZATION ---
window.onload = () => {
    // 1. Populate Setup & Edit Class Dropdowns
    populateClassDropdown('setup-class');
    populateClassDropdown('edit-class');

    // 2. Load Theme
    const savedTheme = localStorage.getItem(DB_THEME);
    const toggle = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if(toggle) toggle.checked = true;
    }

    // 3. Loading Animation & Routing
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            if (!user) navigateTo('view-setup');
            else {
                navigateTo('view-main');
                setFilter('all'); // Default view
            }
        }, 500);
    }, 1200);
};

// --- NAVIGATION & ROUTING ---
function navigateTo(viewId) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    // Close sidebar logic
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').style.display = 'none';

    if(viewId === 'view-main') {
        updateUI();
    }
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

// --- FILTER LOGIC (Updates 5, 6, 7) ---
function setFilter(type) {
    currentFilter = type;
    renderTasks();
    toggleSidebar(); // Close sidebar after selection
    
    // Update Page Titles based on filter
    const title = document.getElementById('page-title');
    const sub = document.getElementById('page-subtitle');
    
    if (type === 'all') {
        title.innerText = `Hi ${user.name}! 👋`;
        sub.innerText = "Here is your study plan.";
    } else if (type === 'priority') {
        title.innerText = "🔥 High Priority";
        sub.innerText = "Focus on these first.";
    } else if (type === 'today') {
        title.innerText = "⏰ Due Today";
        sub.innerText = "Tasks to finish by tonight.";
    } else if (type === 'exams') {
        title.innerText = "📝 Exams";
        sub.innerText = "Upcoming assessments.";
    }
}

// --- TASK RENDERING CORE ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    
    let filteredTasks = [];
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. FILTERING
    if (currentFilter === 'all') {
        filteredTasks = tasks;
    } else if (currentFilter === 'priority') {
        // Update 5: Show ONLY High priority
        filteredTasks = tasks.filter(t => t.priority === 'High');
    } else if (currentFilter === 'today') {
        // Update 6: Show ONLY Due Today
        filteredTasks = tasks.filter(t => t.date === todayStr);
    } else if (currentFilter === 'exams') {
        // Update 7: Show ONLY Exams, Sorted by date
        filteredTasks = tasks.filter(t => t.type === 'Exam');
        filteredTasks.sort((a,b) => new Date(a.date) - new Date(b.date));
    }

    // 2. SORTING (Default: Date ascending)
    if (currentFilter !== 'exams') {
        filteredTasks.sort((a,b) => new Date(a.date) - new Date(b.date));
    }

    // 3. EMPTY STATE
    if (filteredTasks.length === 0) {
        let msg = "No tasks found.";
        if (currentFilter === 'today') msg = "No tasks due today! 🎉";
        if (currentFilter === 'priority') msg = "No high priority tasks.";
        if (currentFilter === 'exams') msg = "No upcoming exams.";
        
        container.innerHTML = `<div style="text-align:center; opacity:0.6; margin-top:50px;">
            <div style="font-size:3rem;">🍃</div>
            <p>${msg}</p>
        </div>`;
        return;
    }

    // 4. GENERATE HTML
    filteredTasks.forEach(t => {
        // Format Date nicely
        const dateObj = new Date(t.date);
        const dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const div = document.createElement('div');
        div.className = `task-item prio-${t.priority}`;
        div.innerHTML = `
            <div class="task-top">
                <div>
                    <div class="task-title">${t.title}</div>
                    <div class="task-sub">
                        <span>${t.subject}</span>
                    </div>
                </div>
                <button onclick="deleteTask(${t.id})" style="background:none; border:none; color:#ef4444; font-size:1.1rem; opacity:0.6;">🗑️</button>
            </div>
            <div class="task-footer">
                <span class="tag type-${t.type === 'Class Test' ? 'Test' : t.type}">${t.type}</span>
                <div class="date-badge">📅 ${dateDisplay}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- ADD TASK LOGIC (Updates 2, 3, 4) ---
function openTaskModal() {
    if(!user) return alert("Please complete setup first.");

    // Update 3: Populate Subjects dynamically
    const subSelect = document.getElementById('task-subject');
    subSelect.innerHTML = '';
    
    // Determine subject list based on user details
    let list = subjectsMap.General;
    if (user.class >= 11) {
        list = subjectsMap[user.stream] || subjectsMap.General;
    }

    list.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s; opt.innerText = s;
        subSelect.appendChild(opt);
    });
    
    // Set default date to today
    document.getElementById('task-date').valueAsDate = new Date();
    
    document.getElementById('task-modal').classList.remove('hidden');
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const type = document.getElementById('task-type').value; // Update 2
    const sub = document.getElementById('task-subject').value;
    const date = document.getElementById('task-date').value;
    const prio = document.getElementById('task-priority').value; // Update 4

    if(!title || !date) return alert("Title and Date are required!");

    const newTask = { 
        id: Date.now(), 
        title, 
        type, 
        sub: sub || 'General', // Fallback
        subject: sub || 'General', 
        date, 
        priority: prio, 
        completed: false 
    };
    
    tasks.push(newTask);
    localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
    
    // Reset and Close
    document.getElementById('task-title').value = '';
    closeAllModals();
    
    // Refresh view
    renderTasks();
}

function deleteTask(id) {
    if(confirm("Delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem(DB_TASKS, JSON.stringify(tasks));
        renderTasks();
    }
}

// --- USER SETUP & PROFILE ---
function populateClassDropdown(id) {
    const sel = document.getElementById(id);
    if(!sel) return;
    sel.innerHTML = '<option value="" disabled selected>Select Class</option>';
    for(let i=1; i<=12; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `Class ${i}`;
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
    // Stream is mandatory only for 11/12
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

function updateUI() {
    if(!user) return;
    document.getElementById('greet-name').innerText = `Hi ${user.name}!`; // In case header exists
    document.getElementById('side-name').innerText = user.name;
    let details = `Class ${user.class}`;
    if(user.stream !== 'General') details += ` • ${user.stream}`;
    document.getElementById('side-class').innerText = details;
}

// --- UTILITIES ---
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

function toggleTheme(checkbox) {
    if(checkbox.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem(DB_THEME, 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem(DB_THEME, 'light');
    }
}