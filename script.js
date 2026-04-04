const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxamm2SwAs6rD8EQnyvVcXFedKJa7A5wMrGMpwceWGACxY5J8rxrGeFWP0p2plbcf5Wlg/exec";

let currentUser = null;
let isSignup = false;

// Initialization Logic
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('studyPingUser');
    
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if(loader) loader.style.display = 'none';

        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                initApp();
            } catch(e) {
                showAuth();
            }
        } else {
            showAuth();
        }
    }, 2000);
});

function showAuth() {
    const authView = document.getElementById('view-setup'); // Using your 'view-setup' from HTML
    if(authView) authView.classList.remove('hidden');
}

// Logic for Role Change in Setup
function handleRoleChange() {
    const role = document.getElementById('setup-role').value;
    const teacherFields = document.getElementById('teacher-fields');
    const studentNav = document.getElementById('student-nav-items');
    
    if (role === "Teacher") {
        teacherFields.classList.remove('hidden');
    } else {
        teacherFields.classList.add('hidden');
    }
}

async function finishSetup() {
    const name = document.getElementById('setup-name').value;
    const role = document.getElementById('setup-role').value;
    const grade = document.getElementById('setup-class').value;
    const stream = document.getElementById('setup-stream').value;
    
    if(!name || !grade) return alert("Please enter your name and grade.");

    // Generate a Class Code if Teacher
    let classCode = "";
    if(role === "Teacher") {
        classCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    currentUser = {
        name,
        role,
        grade,
        stream: (grade > 10) ? stream : "General",
        classCode: classCode,
        joinedClass: ""
    };

    localStorage.setItem('studyPingUser', JSON.stringify(currentUser));
    initApp();
}

function initApp() {
    // UI Transitions
    document.getElementById('view-main').classList.remove('hidden');
    document.getElementById('view-setup').classList.add('hidden');
    
    // Set Profile Info
    document.getElementById('side-name').innerText = currentUser.name;
    document.getElementById('side-class').innerText = `Grade ${currentUser.grade} ${currentUser.role}`;
    document.getElementById('page-title').innerText = `Hi, ${currentUser.name.split(' ')[0]}!`;

    // Role-Based UI Adjustments
    const body = document.body;
    const studentItems = document.getElementById('student-nav-items');
    const teacherAssign = document.getElementById('teacher-assign-options');
    const classBrief = document.getElementById('classroom-brief');

    if(currentUser.role === "Teacher") {
        body.classList.add('is-teacher');
        body.classList.remove('is-student');
        if(studentItems) studentItems.classList.add('hidden');
        if(teacherAssign) teacherAssign.classList.remove('hidden');
        
        // Update Teacher Classroom Brief
        classBrief.classList.remove('hidden');
        document.getElementById('class-status-title').innerText = "Teaching Mode";
        document.getElementById('class-status-msg').innerText = `Your Code: ${currentUser.classCode}`;
    } else {
        body.classList.add('is-student');
        body.classList.remove('is-teacher');
        if(studentItems) studentItems.classList.remove('hidden');
        if(teacherAssign) teacherAssign.classList.add('hidden');
        
        // Show classroom status for students
        classBrief.classList.remove('hidden');
        updateStudentClassUI();
    }
}

// Classroom System Logic
function openClassroom() {
    const modal = document.getElementById('classroom-modal');
    modal.classList.remove('hidden');
    
    if(currentUser.role === "Teacher") {
        document.getElementById('teacher-class-view').classList.remove('hidden');
        document.getElementById('student-class-view').classList.add('hidden');
        document.getElementById('generated-class-code').innerText = currentUser.classCode;
    } else {
        document.getElementById('student-class-view').classList.remove('hidden');
        document.getElementById('teacher-class-view').classList.add('hidden');
    }
}

function joinClassroom() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if(code.length < 5) return alert("Enter a valid 6-digit code.");
    
    currentUser.joinedClass = code;
    localStorage.setItem('studyPingUser', JSON.stringify(currentUser));
    
    alert(`Successfully joined class: ${code}`);
    updateStudentClassUI();
    closeAllModals();
}

function updateStudentClassUI() {
    const title = document.getElementById('class-status-title');
    const msg = document.getElementById('class-status-msg');
    
    if(currentUser.joinedClass) {
        title.innerText = "Connected to Class";
        msg.innerText = `Code: ${currentUser.joinedClass} (Syncing tasks...)`;
    } else {
        title.innerText = "Not in a Classroom";
        msg.innerText = "Join a class to receive tasks from your teacher.";
    }
}

// Sidebar & Modals
function toggleSidebar() {
    const side = document.getElementById('sidebar');
    const over = document.getElementById('sidebar-overlay');
    side.classList.toggle('active');
    over.style.display = side.classList.contains('active') ? 'block' : 'none';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.classList.add('hidden'));
}

function openTaskModal() {
    document.getElementById('task-modal').classList.remove('hidden');
}

function navigateTo(viewId) {
    const views = document.querySelectorAll('.page-view');
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    if(viewId === 'view-main') toggleSidebar();
}

function appLogout() {
    localStorage.clear();
    location.reload();
}

// Helper for Grade 11/12 Stream toggle
function toggleStream(prefix) {
    const grade = document.getElementById(`${prefix}-class`).value;
    const streamDiv = document.getElementById(`${prefix}-stream-div`);
    if(grade >= 11) {
        streamDiv.classList.remove('hidden');
    } else {
        streamDiv.classList.add('hidden');
    }
}
// --- TASK MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem('studyPingTasks')) || [];

function saveTask() {
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const pushToStudents = document.getElementById('push-to-students').checked;

    if (!title || !subject || !date) {
        return alert("Please fill in all fields.");
    }

    const newTask = {
        id: Date.now(),
        title,
        subject,
        date,
        priority,
        completed: false,
        creator: currentUser.name,
        classCode: currentUser.role === "Teacher" ? currentUser.classCode : (currentUser.joinedClass || "Personal")
    };

    // 1. Save locally for the user
    tasks.unshift(newTask);
    localStorage.setItem('studyPingTasks', JSON.stringify(tasks));

    // 2. If Teacher and "Push to Students" is checked, send to Google Sheet
    if (currentUser.role === "Teacher" && pushToStudents) {
        pushTaskToDatabase(newTask);
    }

    // 3. UI Updates
    renderTasks();
    closeAllModals();
    clearTaskForm();
}

function clearTaskForm() {
    document.getElementById('task-title').value = "";
    document.getElementById('task-subject').value = "";
    document.getElementById('task-date').value = "";
    document.getElementById('push-to-students').checked = false;
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item prio-${task.priority} ${task.completed ? 'completed' : ''}`;
        item.onclick = () => toggleTaskComplete(task.id);

        item.innerHTML = `
            <div class="task-top">
                <div class="task-title">${task.title}</div>
                <div class="tag type-Homework">${task.subject}</div>
            </div>
            <div class="task-footer">
                <span class="date-badge">📅 ${task.date}</span>
                <span class="task-sub">${task.classCode === "Personal" ? "Me" : "Class: " + task.classCode}</span>
            </div>
        `;
        taskList.appendChild(item);
    });
}

function toggleTaskComplete(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem('studyPingTasks', JSON.stringify(tasks));
    renderTasks();
}

// --- DATABASE SYNC (Google Apps Script) ---
async function pushTaskToDatabase(task) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script execution
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "pushTask",
                task: task,
                classCode: currentUser.classCode
            })
        });
        alert("Task assigned to your class successfully!");
    } catch (error) {
        console.error("Error pushing task:", error);
    }
}

// Update your initApp function to include renderTasks()
const originalInitApp = initApp;
initApp = function() {
    originalInitApp();
    renderTasks();
};