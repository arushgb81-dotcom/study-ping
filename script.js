// --- 1. FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- 2. CONFIGURATIONS ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbymWu_i4KnXpm1NE7_6KYuuvoTtwcVaUBsTDc_wCYaIv4rwPSSsaR5nf2q0l9hGsj1H0g/exec"; 

const firebaseConfig = {
    apiKey: "AIzaSyDroObfzJe-HHt28NnLQP_sXlR86NfWlQc",
    authDomain: "study-ping.firebaseapp.com",
    projectId: "study-ping",
    storageBucket: "study-ping.firebasestorage.app",
    messagingSenderId: "931243619756",
    appId: "1:931243619756:web:306a07f95772850dbb7609",
    measurementId: "G-E7KHQKEQS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Local Database Keys
const DB_THEME = 'studyping_theme_v2.0';
const DB_STREAK = 'studyping_streak_v2.0';
const DB_CHALLENGE = 'studyping_challenge_last_date';

// App Variables
let currentUserData = null;
let tasks = [];
let currentFilter = 'all';

// Streak Data (Kept local)
let streakData = JSON.parse(localStorage.getItem(DB_STREAK)) || { count: 0, lastActiveDate: null, goal: 3 };
if (typeof streakData.goal === 'undefined') streakData.goal = 3;

let botsData = JSON.parse(localStorage.getItem('studyping_bots')) || [
    { name: "Alex 🤖", streak: 5 }, { name: "Mia 📚", streak: 2 }, { name: "Noah 📝", streak: 8 }, { name: "Emma 🎓", streak: 4 }
];

// --- 3. GOOGLE SHEETS CONNECTION ---
async function sendDataToSheet(name, email, role, classCode) {
    if (!GOOGLE_SCRIPT_URL) return;
    const dataToSend = { name: name, email: email, role: role, classCode: classCode || "N/A" };
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        console.log("Roster info sent to Google Sheet!");
    } catch (error) {
        console.error("Failed to send data to sheet:", error);
    }
}

// --- 4. FIREBASE AUTHENTICATION (Login & Signup) ---
async function signupUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value; 
    const name = document.getElementById('setup-name').value;
    const role = document.getElementById('setup-role').value;
    const errEl = document.getElementById('auth-error');

    if (!email || !name || !password) return errEl.innerText = "Email, Name, and Password required.";

    let classVal = document.getElementById('setup-class')?.value || null;
    if (role === 'Student' && !classVal) return errEl.innerText = "Students must select a class.";

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        currentUserData = {
            uid: uid,
            name: name,
            email: email,
            role: role,
            class: classVal,
            completedTasks: []
        };
        await setDoc(doc(db, "users", uid), currentUserData);

        sendDataToSheet(name, email, role, classVal);
    } catch (error) {
        if(error.code === 'auth/email-already-in-use') {
            errEl.innerText = "An account with this email already exists! Please login.";
        } else if(error.code === 'auth/weak-password') {
            errEl.innerText = "Password must be at least 6 characters.";
        } else {
            errEl.innerText = "Error: " + error.message;
        }
    }
}

async function loginUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value; 
    const errEl = document.getElementById('auth-error');

    if (!email || !password) return errEl.innerText = "Enter both email and password.";

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errEl.innerText = "Incorrect email or password. Please try again.";
    }
}

async function appLogout() {
    await signOut(auth);
    tasks = [];
    currentUserData = null;
    toggleSidebar(false);
    navigateTo('view-setup');
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    switchAuthTab('login');
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            currentUserData.uid = user.uid;
            if(!currentUserData.completedTasks) currentUserData.completedTasks = [];

            hideLoadingScreen();
            navigateTo(currentUserData.role === 'Teacher' ? 'view-teacher-dash' : 'view-main');
            updateUIBasedOnRole();
            fetchTasks(); 
        } else {
            hideLoadingScreen();
            navigateTo('view-setup');
        }
    } else {
        currentUserData = null;
        hideLoadingScreen();
        navigateTo('view-setup');
    }
});

// --- 5. FIRESTORE DATABASE (TASKS) ---
async function fetchTasks() {
    if (!currentUserData) return;
    tasks = [];
    
    try {
        if (currentUserData.role === 'Teacher') {
            const q = query(collection(db, "tasks"), where("teacherId", "==", currentUserData.uid));
            const snap = await getDocs(q);
            snap.forEach(doc => tasks.push({id: doc.id, ...doc.data()}));
            updateTeacherStats();
        } else {
            const classQ = query(collection(db, "tasks"), where("class", "==", currentUserData.class));
            const studentQ = query(collection(db, "tasks"), where("studentId", "==", currentUserData.uid));
            
            const [classSnap, studentSnap] = await Promise.all([getDocs(classQ), getDocs(studentQ)]);
            classSnap.forEach(doc => tasks.push({id: doc.id, ...doc.data()}));
            studentSnap.forEach(doc => tasks.push({id: doc.id, ...doc.data()}));
            
            tasks = Array.from(new Map(tasks.map(t => [t.id, t])).values()).filter(t => t.teacherId || t.studentId);
            renderTasks();
        }
    } catch(e) { console.error("Fetch Tasks Error:", e); }
}

async function savePerforma() {
    const pClass = document.getElementById('perf-class').value;
    const pSub = document.getElementById('perf-subject').value;
    const pTaught = document.getElementById('perf-taught').value;
    const pHw = document.getElementById('perf-hw').value;
    const pNext = document.getElementById('perf-next').value;

    if (!pClass || !pTaught || !pHw) return alert("Class, Taught, and Homework are required!");

    const performaData = {
        class: pClass,
        teacherId: currentUserData.uid,
        subject: pSub,
        taught: pTaught,
        homework: pHw,
        nextPlan: pNext,
        timestamp: new Date().toISOString(),
        title: "Class Update: " + pSub,
        type: "Homework",
        date: new Date().toISOString().split('T')[0],
        priority: "High",
        completed: false
    };

    try {
        await addDoc(collection(db, "tasks"), performaData);
        closeAllModals();
        fetchTasks();
        alert("Performa sent successfully!");
    } catch(e) { console.error(e); }
}

async function saveTask() {
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    if (!title || !date) return alert("Title and Date required!");

    const newTaskData = {
        title: title,
        type: document.getElementById('task-type').value,
        subject: document.getElementById('task-subject').value,
        date: date,
        priority: document.getElementById('task-priority').value,
        class: currentUserData.class,
        studentId: currentUserData.uid, 
        completed: false
    };

    try {
        await addDoc(collection(db, "tasks"), newTaskData);
        closeAllModals();
        fetchTasks();
    } catch(e) { console.error(e); }
}

function toggleTaskCompletion() {
    const id = document.getElementById('detail-id').value;
    const isComplete = document.getElementById('detail-complete-toggle').checked;
    document.getElementById('completion-text').innerText = isComplete ? "Completed ✅" : "Mark as Completed";
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = isComplete;

    if (isComplete) {
        incrementStreak();
        document.getElementById('delete-timer-msg').classList.remove('hidden');
        
        setTimeout(async () => {
            if (task.studentId) {
                await deleteDoc(doc(db, "tasks", id));
            } 
            else if (task.teacherId) {
                if (!currentUserData.completedTasks) currentUserData.completedTasks = [];
                if (!currentUserData.completedTasks.includes(id)) {
                    currentUserData.completedTasks.push(id);
                    await updateDoc(doc(db, "users", currentUserData.uid), {
                        completedTasks: currentUserData.completedTasks
                    });
                }
            }
            closeAllModals();
            fetchTasks();
        }, 4000); 
    }
    renderTasks();
}

function renderTasks() {
    const pContainer = document.getElementById('performa-list');
    const tContainer = document.getElementById('task-list');
    if (!pContainer || !tContainer) return;
    
    pContainer.innerHTML = ''; tContainer.innerHTML = '';
    let filteredTasks = tasks;
    const searchQ = document.getElementById('task-search')?.value.toLowerCase() || "";
    
    if (searchQ) filteredTasks = filteredTasks.filter(t => t.title?.toLowerCase().includes(searchQ) || t.subject?.toLowerCase().includes(searchQ));

    if (currentFilter === 'priority') filteredTasks = filteredTasks.filter(t => t.priority === 'High' && !t.completed);
    else if (currentFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(t => t.date === todayStr && !t.completed);
    } else if (currentFilter === 'exams') {
        filteredTasks = filteredTasks.filter(t => t.type === 'Exam');
    }

    let performaCount = 0; let taskCount = 0;

    filteredTasks.forEach(t => {
        if (currentUserData.completedTasks && currentUserData.completedTasks.includes(t.id)) return;

        if (t.teacherId && t.class === currentUserData.class) {
            performaCount++;
            const div = document.createElement('div');
            div.className = `performa-card ${t.completed ? 'completed' : ''}`;
            div.onclick = () => openTaskDetail(t.id);
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <h4>${t.subject} Update</h4><span class="r-date">${t.date}</span>
                </div>
                <p><strong>Taught:</strong> ${t.taught}</p><p><strong>Homework:</strong> ${t.homework}</p>
            `;
            pContainer.appendChild(div);
        } else if (t.studentId === currentUserData.uid) {
            taskCount++;
            const div = document.createElement('div');
            div.className = `task-item prio-${t.priority} ${t.completed ? 'completed' : ''}`;
            div.onclick = () => openTaskDetail(t.id);
            div.innerHTML = `
                <div class="task-top">
                    <div><div class="task-title">${t.title}</div><div class="task-sub">${t.subject}</div></div>
                    ${t.completed ? '<span>✅</span>' : ''}
                </div>
                <div class="task-footer">
                    <span class="tag type-${t.type === 'Class Test' ? 'Test' : t.type}">${t.type}</span>
                    <div class="date-badge">📅 ${t.date}</div>
                </div>
            `;
            tContainer.appendChild(div);
        }
    });

    if (performaCount === 0) pContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No recent updates.</p>`;
    if (taskCount === 0) tContainer.innerHTML = `<div style="text-align:center; opacity:0.6; margin-top:20px;">🍃 No personal tasks.</div>`;
}

function updateTeacherStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('count-performa').innerText = tasks.length;
    const uniqueClasses = new Set(tasks.map(t => t.class));
    document.getElementById('count-classes').innerText = uniqueClasses.size;
    const todayCount = tasks.filter(t => t.timestamp && t.timestamp.startsWith(todayStr)).length;
    document.getElementById('count-today').innerText = todayCount;
    renderTeacherRecords();
}

function renderTeacherRecords() {
    const list = document.getElementById('teacher-activity-list');
    if (!list) return;
    list.innerHTML = '';
    if (tasks.length === 0) { list.innerHTML = '<p style="color: var(--text-muted);">No records found. 🍃</p>'; return; }
    
    const sortedTasks = [...tasks].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    sortedTasks.forEach(t => {
        const dateDisplay = new Date(t.timestamp || t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        const div = document.createElement('div');
        div.className = 'record-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h4>Class ${t.class} - ${t.subject}</h4>
                <span class="r-date">${dateDisplay}</span>
            </div>
            <p><strong>Taught:</strong> ${t.taught || 'N/A'}</p>
            <p><strong>Homework:</strong> ${t.homework || 'N/A'}</p>
            <p><strong>Next Plan:</strong> ${t.nextPlan || 'N/A'}</p>
        `;
        list.appendChild(div);
    });
}

// --- 6. UI & HELPER FUNCTIONS ---
function hideLoadingScreen() {
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.style.opacity = '0'; setTimeout(() => { ls.classList.add('hidden'); }, 300); }
}

function toggleSidebar(forceOpen = null) {
    const studentSidebar = document.getElementById('sidebar');
    const teacherSidebar = document.getElementById('teacher-sidebar');
    let activeSidebar = studentSidebar;
    let activeOverlay = document.getElementById('sidebar-overlay');

    if (currentUserData && currentUserData.role === 'Teacher') {
        activeSidebar = teacherSidebar;
        activeOverlay = document.getElementById('teacher-sidebar-overlay');
    }

    if (!activeSidebar || !activeOverlay) return;

    if (forceOpen === true) {
        activeSidebar.classList.add('active'); activeOverlay.style.display = 'block';
    } else if (forceOpen === false) {
        activeSidebar.classList.remove('active'); activeOverlay.style.display = 'none';
        if (studentSidebar) studentSidebar.classList.remove('active');
        if (teacherSidebar) teacherSidebar.classList.remove('active');
        document.getElementById('sidebar-overlay').style.display = 'none';
        document.getElementById('teacher-sidebar-overlay').style.display = 'none';
    } else {
        activeSidebar.classList.toggle('active');
        activeOverlay.style.display = activeSidebar.classList.contains('active') ? 'block' : 'none';
    }
}

function navigateTo(viewId) {
    if (viewId === 'view-main' && currentUserData && currentUserData.role === 'Teacher') viewId = 'view-teacher-dash';
    document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    toggleSidebar(false); 
    if (viewId === 'view-main' || viewId === 'view-teacher-dash') {
        updateUIBasedOnRole();
        if (currentUserData && currentUserData.role === 'Teacher') updateTeacherStats();
        else { renderTasks(); updateStreakUI(); }
    }
    if (viewId === 'view-streak') renderStreakPage();
}

function showTeacherSection(section) {
    document.getElementById('teacher-dashboard-section').classList.add('hidden');
    document.getElementById('teacher-records-section').classList.add('hidden');
    if (section === 'dashboard') document.getElementById('teacher-dashboard-section').classList.remove('hidden');
    else if (section === 'records') document.getElementById('teacher-records-section').classList.remove('hidden');
}

function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login').classList.toggle('active', isLogin);
    document.getElementById('tab-signup').classList.toggle('active', !isLogin);
    document.getElementById('signup-fields').classList.toggle('hidden', isLogin);
    document.getElementById('auth-title').innerText = isLogin ? "Welcome Back ✨" : "Create Account 🚀";
    document.getElementById('auth-subtitle').innerText = isLogin ? "Login to continue." : "Set up your profile.";
    document.getElementById('btn-submit-auth').innerText = isLogin ? "Login 🚀" : "Sign Up ✨";
    document.getElementById('btn-submit-auth').onclick = isLogin ? loginUser : signupUser;
    document.getElementById('auth-error').innerText = "";
}

function handleRoleChange() {
    const role = document.getElementById('setup-role').value;
    const tFields = document.getElementById('teacher-fields');
    const sClass = document.getElementById('setup-class');
    if (role === 'Teacher') {
        if (tFields) tFields.classList.remove('hidden');
        if (sClass) sClass.classList.add('hidden');
    } else {
        if (tFields) tFields.classList.add('hidden');
        if (sClass) sClass.classList.remove('hidden');
    }
}

function populateClassDropdown(id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>Select Class 🎒</option>';
    for (let i = 8; i <= 12; i++) {
        let opt = document.createElement('option'); opt.value = `${i}`; opt.innerText = `Class ${i}`; sel.appendChild(opt);
    }
}

function toggleStream(mode) {
    let clsId = mode === 'edit' ? 'edit-class' : 'setup-class';
    let divId = mode === 'edit' ? 'edit-stream-div' : 'setup-stream-div';
    const val = document.getElementById(clsId); const div = document.getElementById(divId);
    if (!val || !div) return;
    if (val.value == "11" || val.value == "12") div.classList.remove('hidden'); else div.classList.add('hidden');
}

function updateUIBasedOnRole() {
    if (!currentUserData) return;
    if (currentUserData.role === 'Teacher') {
        const welcomeEl = document.getElementById('teacher-welcome');
        if (welcomeEl) welcomeEl.innerText = `👩‍🏫 Welcome, ${currentUserData.name}`;
    } else {
        const sideName = document.getElementById('side-name');
        const classEl = document.getElementById('side-class');
        if (sideName) sideName.innerText = currentUserData.name;
        if (classEl) classEl.innerText = `Class ${currentUserData.class}`;
        updateStreakUI();
    }
}

function openEditModal() {
    document.getElementById('edit-name').value = currentUserData.name;
    document.getElementById('edit-class').value = currentUserData.class || "";
    toggleStream('edit'); document.getElementById('edit-modal').classList.remove('hidden'); toggleSidebar(false);
}

async function saveProfileChanges() {
    const name = document.getElementById('edit-name').value;
    const cls = document.getElementById('edit-class').value;
    if (!name) return alert("Name cannot be empty");
    
    currentUserData.name = name;
    currentUserData.class = cls;
    
    try {
        await updateDoc(doc(db, "users", currentUserData.uid), { name: name, class: cls });
        closeAllModals();
        updateUIBasedOnRole();
        fetchTasks();
    } catch(e) { console.error(e); }
}

function openPerformaModal() {
    document.getElementById('perf-taught').value = ''; document.getElementById('perf-hw').value = ''; document.getElementById('perf-next').value = '';
    document.getElementById('performa-modal').classList.remove('hidden');
}

function openTaskModal() {
    const subSelect = document.getElementById('task-subject');
    if (subSelect) {
        subSelect.innerHTML = '';
        ["Math", "Science", "English", "Hindi", "Social Science"].forEach(s => {
            let opt = document.createElement('option'); opt.value = s; opt.innerText = s; subSelect.appendChild(opt);
        });
    }
    document.getElementById('task-date').valueAsDate = new Date();
    document.getElementById('task-modal').classList.remove('hidden');
}

function openTaskDetail(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('detail-id').value = task.id;
    document.getElementById('detail-title').value = task.title || `Class Update: ${task.subject}`;
    document.getElementById('detail-complete-toggle').checked = task.completed;
    document.getElementById('completion-text').innerText = task.completed ? "Completed ✅" : "Mark as Completed";
    document.getElementById('delete-timer-msg').classList.add('hidden');
    document.getElementById('detail-modal').classList.remove('hidden');
}

function filterTasksBySearch() { renderTasks(); }

function setFilter(type) {
    currentFilter = type; renderTasks(); toggleSidebar(false);
    const title = document.getElementById('page-title');
    if (title) {
        if (type === 'all') title.innerText = `Hi ${currentUserData.name}! 👋`;
        else if (type === 'priority') title.innerText = "High Priority 🚩";
        else if (type === 'today') title.innerText = "Due Today ⏰";
        else if (type === 'exams') title.innerText = "Exams 📝";
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    const tMsg = document.getElementById('delete-timer-msg'); if(tMsg) tMsg.classList.add('hidden');
}

function toggleTheme(checkbox) {
    document.body.classList.toggle('dark-mode', checkbox.checked);
    localStorage.setItem(DB_THEME, checkbox.checked ? 'dark' : 'light');
}

// --- 7. STREAK, GAME & NOTIFICATIONS ---
function updateStreakUI() {
    const dashCount = document.getElementById('dash-streak-count');
    const badge = document.getElementById('dashboard-streak-container');
    const bar = document.getElementById('dash-streak-bar');
    const goalText = document.getElementById('dash-streak-goal-text');
    if (dashCount) dashCount.innerText = streakData.count;
    if (badge) badge.classList.remove('hidden');
    if (bar && goalText) {
        let pct = (streakData.count / streakData.goal) * 100;
        bar.style.width = `${Math.min(pct, 100)}%`;
        goalText.innerText = `Goal: ${streakData.goal} Days 🎯`;
    }
}

function incrementStreak() {
    const todayStr = new Date().toISOString().split('T')[0];
    if (streakData.lastActiveDate !== todayStr) {
        streakData.count++;
        streakData.lastActiveDate = todayStr;
        if (streakData.count >= streakData.goal) { streakData.goal += 3; startConfetti(); }
        localStorage.setItem(DB_STREAK, JSON.stringify(streakData));
        botsData.forEach(b => b.streak++); localStorage.setItem('studyping_bots', JSON.stringify(botsData));
        updateStreakUI();
        return true;
    }
    return false;
}

function checkStreakValidity() {
    if (!streakData.lastActiveDate) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lastActive = new Date(streakData.lastActiveDate); lastActive.setHours(0, 0, 0, 0);
    if (Math.ceil(Math.abs(today - lastActive) / (1000 * 60 * 60 * 24)) > 1) {
        streakData.count = 0; streakData.goal = 3; localStorage.setItem(DB_STREAK, JSON.stringify(streakData));
    }
}

function renderStreakPage() {
    const count = streakData.count; const goal = streakData.goal;
    document.getElementById('streak-count-large').innerText = count;
    document.getElementById('current-milestone').innerText = `${count} Days`;
    document.getElementById('next-milestone').innerText = `Next Goal: ${goal}`;
    document.getElementById('streak-bar').style.width = `${Math.min((count / goal) * 100, 100)}%`;
}

function shareStreak() {
    const text = `I'm on a ${streakData.count}-day study streak! 🔥 Join me on Study Ping.`;
    if (navigator.share) navigator.share({ title: 'Study Ping Streak', text: text, url: window.location.href }).catch(console.error);
    else alert(text);
}

function openLeaderboard() {
    navigateTo('view-leaderboard');
    const list = document.getElementById('leaderboard-list'); list.innerHTML = "";
    let allUsers = [...botsData];
    if (currentUserData && currentUserData.role === 'Student') allUsers.push({ name: currentUserData.name + " (You)", streak: streakData.count, isMe: true });
    allUsers.sort((a, b) => b.streak - a.streak);
    allUsers.forEach((u, idx) => {
        const item = document.createElement('div'); item.className = "feature-block";
        item.style.display = "flex"; item.style.justifyContent = "space-between"; item.style.alignItems = "center";
        if (u.isMe) { item.style.borderLeft = "4px solid var(--accent)"; item.style.backgroundColor = "rgba(245, 158, 11, 0.1)"; }
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        item.innerHTML = `<div><strong style="font-size:1.2rem;">${medal}</strong> <span style="margin-left:10px; font-weight: ${u.isMe ? 'bold' : 'normal'};">${u.name}</span></div><div class="tag type-Exam" style="background:var(--accent); color: white;">🔥 ${u.streak}</div>`;
        list.appendChild(item);
    });
}

function dismissPing() { document.getElementById('smart-ping-toast').classList.add('hidden'); }
function closeNotifModal() { document.getElementById('notif-modal').classList.add('hidden'); localStorage.setItem('studyping_notif_asked', 'true'); }
function requestNotifPermission() {
    localStorage.setItem('studyping_notif_asked', 'true');
    Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification("Study Ping 🧠", { body: "Smart notifications enabled!"});
        closeNotifModal();
    });
}
function checkNotifPermissionLogic() {
    if (!("Notification" in window)) return;
    const alreadyAsked = localStorage.getItem('studyping_notif_asked');
    if (Notification.permission === 'default' && !alreadyAsked) { setTimeout(() => { document.getElementById('notif-modal').classList.remove('hidden'); }, 4000); }
}

const questionBank = {
    "Math": [ { q: "What is 5 + 7?", options: ["10", "12", "14", "15"], ans: "12" }, { q: "Square root of 25?", options: ["4", "5", "6", "25"], ans: "5" }, { q: "Value of Pi roughly?", options: ["3.14", "2.14", "3.41", "3.12"], ans: "3.14" }, { q: "100 / 4?", options: ["20", "25", "30", "50"], ans: "25" }, { q: "12 - 8 = ?", options: ["2", "3", "4", "5"], ans: "4" } ],
    "Science": [ { q: "Gas humans breathe?", options: ["Oxygen", "Carbon", "Helium", "Nitrogen"], ans: "Oxygen" }, { q: "Water boils at?", options: ["50°C", "100°C", "150°C", "200°C"], ans: "100°C" }, { q: "Center of solar system?", options: ["Earth", "Sun", "Moon", "Mars"], ans: "Sun" }, { q: "Hardest substance?", options: ["Gold", "Iron", "Diamond", "Silver"], ans: "Diamond" }, { q: "Formula for Water?", options: ["H2O", "CO2", "O2", "NaCl"], ans: "H2O" } ],
    "English": [ { q: "Past tense of Run?", options: ["Runned", "Ran", "Running", "Runs"], ans: "Ran" }, { q: "Plural of Child?", options: ["Childs", "Childrens", "Children", "Childes"], ans: "Children" }, { q: "Synonym for Happy?", options: ["Sad", "Angry", "Joyful", "Tired"], ans: "Joyful" }, { q: "Opposite of Hot?", options: ["Warm", "Boiling", "Cold", "Spicy"], ans: "Cold" }, { q: "A person who writes books?", options: ["Doctor", "Author", "Painter", "Singer"], ans: "Author" } ],
    "Social Science": [ { q: "Capital of India?", options: ["Delhi", "Mumbai", "Kolkata", "Chennai"], ans: "Delhi" }, { q: "National Animal of India?", options: ["Lion", "Tiger", "Elephant", "Leopard"], ans: "Tiger" }, { q: "First President of India?", options: ["Nehru", "Gandhi", "Patel", "Bose"], ans: "Nehru" }, { q: "Number of continents?", options: ["5", "6", "7", "8"], ans: "7" }, { q: "Largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], ans: "Pacific" } ],
    "Hindi": [ { q: "National Language of India?", options: ["English", "Hindi", "Tamil", "Punjabi"], ans: "Hindi" }, { q: "Opposite of Din (Day)?", options: ["Raat", "Subah", "Shaam", "Dopahar"], ans: "Raat" }, { q: "Synonym for Jal (Water)?", options: ["Aag", "Pani", "Hawa", "Dharti"], ans: "Pani" }, { q: "Vowel in Hindi?", options: ["Ka", "Kha", "Ga", "Aa"], ans: "Aa" }, { q: "Color of Sky?", options: ["Lal", "Neela", "Peela", "Hara"], ans: "Neela" } ]
};

let currentQuestions = [], currentQIndex = 0, score = 0, gameTimer, timeLeft = 10;
function initChallenge() {
    if (currentUserData && currentUserData.role === 'Teacher') return alert("Students only!");
    toggleSidebar(false);
    const todayStr = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(DB_CHALLENGE) === todayStr) {
        document.getElementById('challenge-blocked').classList.remove('hidden'); document.getElementById('challenge-subject-select').classList.add('hidden');
    } else {
        document.getElementById('challenge-blocked').classList.add('hidden'); document.getElementById('challenge-subject-select').classList.remove('hidden');
        const container = document.getElementById('subject-buttons'); container.innerHTML = '';
        Object.keys(questionBank).forEach(sub => {
            const btn = document.createElement('button'); btn.className = 'subject-btn'; btn.innerText = sub;
            btn.onclick = () => startQuiz(sub); container.appendChild(btn);
        });
    }
    navigateTo('view-challenge-intro');
}
function startQuiz(subject) {
    currentQuestions = questionBank[subject].sort(() => 0.5 - Math.random()).slice(0, 5);
    score = 0; currentQIndex = 0; navigateTo('view-quiz'); loadQuestion();
}
function loadQuestion() {
    if (currentQIndex >= 5) return endQuiz();
    const qData = currentQuestions[currentQIndex];
    document.getElementById('quiz-q-num').innerText = `Q${currentQIndex + 1}/5`; document.getElementById('quiz-question').innerText = qData.q;
    const optsDiv = document.getElementById('quiz-options'); optsDiv.innerHTML = '';
    qData.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = opt;
        btn.onclick = () => selectAnswer(btn, opt, qData.ans); optsDiv.appendChild(btn);
    });
    clearInterval(gameTimer); timeLeft = 10; document.getElementById('quiz-timer').innerText = `10s`;
    const fill = document.getElementById('timer-fill'); fill.style.transition = 'none'; fill.style.width = '100%';
    setTimeout(() => { fill.style.transition = 'width 10s linear'; fill.style.width = '0%'; }, 50);
    gameTimer = setInterval(() => {
        timeLeft--; document.getElementById('quiz-timer').innerText = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(gameTimer); document.querySelectorAll('.option-btn').forEach(b => { b.onclick = null; if(b.innerText === qData.ans) b.classList.add('correct'); });
            setTimeout(() => { currentQIndex++; loadQuestion(); }, 1000);
        }
    }, 1000);
}
function selectAnswer(btn, selectedOption, correctAns) {
    if(gameTimer) clearInterval(gameTimer); document.querySelectorAll('.option-btn').forEach(b => b.onclick = null);
    if (selectedOption === correctAns) { btn.classList.add('correct'); score++; } 
    else { btn.classList.add('wrong'); document.querySelectorAll('.option-btn').forEach(b => { if (b.innerText === correctAns) b.classList.add('correct'); }); }
    setTimeout(() => { currentQIndex++; loadQuestion(); }, 1000);
}
function endQuiz() {
    navigateTo('view-quiz-result'); localStorage.setItem(DB_CHALLENGE, new Date().toISOString().split('T')[0]);
    const rc = document.getElementById('result-container-ui');
    if (score === 5) { rc.innerHTML = `<div class="win-ui"><div class="streak-fire">🏆</div><h1>Perfect Score!</h1><p>Streak +1 added!</p><button class="btn-primary" onclick="navigateTo('view-main')">Continue</button></div>`; incrementStreak(); startConfetti(); } 
    else { rc.innerHTML = `<div class="lose-ui"><div class="streak-fire">😢</div><h1>Try Again!</h1><p>You scored ${score}/5. You need 5/5 to increase your streak.</p><button class="btn-primary" onclick="navigateTo('view-main')">Continue</button></div>`; }
}
function startConfetti() {
    const canvas = document.getElementById('canvas-confetti'); canvas.classList.remove('hidden'); const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let pieces = Array.from({length:100},()=>({ x:Math.random()*canvas.width, y:Math.random()*canvas.height-canvas.height, w:Math.random()*10+5, h:Math.random()*10+5, dy:Math.random()*3+2, color:`hsl(${Math.random()*360},100%,50%)` }));
    function animate() {
        ctx.clearRect(0,0,canvas.width,canvas.height); let active = false;
        pieces.forEach(p => { p.y += p.dy; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); if(p.y < canvas.height) active = true; });
        if(active) requestAnimationFrame(animate); else canvas.classList.add('hidden');
    } animate();
}

const SYLLABUS = {
    "8": { "Math": ["Rational Numbers", "Linear Equations"], "Science": ["Crop Production", "Microorganisms"], "English": ["Honeydew", "It So Happened"], "Hindi": ["Vasant", "Bharat Ki Khoj"], "Social Science": ["Resources", "Our Pasts III"] },
    "9": { "Math": ["Number Systems", "Polynomials"], "Science": ["Matter", "Atoms"], "English": ["Beehive", "Moments"], "Hindi": ["Kshitij", "Kritika"], "Social Science": ["French Revolution", "India - Size and Location"] },
    "10": { "Math": ["Real Numbers", "Polynomials"], "Science": ["Chemical Reactions", "Life Processes"], "English": ["First Flight", "Footprints"], "Hindi": ["Kshitij II", "Kritika II"], "Social Science": ["Nationalism in India", "Power Sharing"] },
};
function openTutorials() {
    navigateTo('view-tutorials');
    const list = document.getElementById('tut-subject-list'); list.innerHTML = '';
    let classLevel = currentUserData ? currentUserData.class : "10";
    let subjects = ["Math", "Science", "English"];
    if (SYLLABUS[classLevel]) subjects = Object.keys(SYLLABUS[classLevel]);
    subjects.forEach(sub => {
        const div = document.createElement('div'); div.className = 'task-item';
        div.innerHTML = `<strong>${sub}</strong><span style="float:right">📚</span>`;
        div.onclick = () => showChapters(sub, classLevel); list.appendChild(div);
    });
}
function showChapters(subject, classLevel) {
    document.getElementById('tut-subject-container').classList.add('hidden'); document.getElementById('tut-chapter-container').classList.remove('hidden');
    document.getElementById('tut-active-subject').innerText = `${subject} Chapters`;
    const list = document.getElementById('tut-chapter-list'); list.innerHTML = '';
    let chapters = SYLLABUS[classLevel] && SYLLABUS[classLevel][subject] ? SYLLABUS[classLevel][subject] : ["Basics", "Advanced"];
    chapters.forEach(chap => {
        const div = document.createElement('div'); div.className = 'task-item';
        div.innerHTML = `<span>${chap}</span><button class="btn-primary" style="margin-top:10px; padding:8px;" onclick="openYouTubeSearch('${subject}', '${chap}')">▶ Search on YouTube</button>`;
        list.appendChild(div);
    });
}
function closeTutorialChapters() { document.getElementById('tut-chapter-container').classList.add('hidden'); document.getElementById('tut-subject-container').classList.remove('hidden'); }
function openYouTubeSearch(subject, chapter) { window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`Class ${currentUserData.class} ${subject} ${chapter} explanation`)}`, '_blank'); }

// --- 8. WINDOW BINDINGS ---
// Because this file is a 'module', the HTML buttons cannot "see" these functions unless we attach them to the 'window'.
window.signupUser = signupUser;
window.loginUser = loginUser;
window.appLogout = appLogout;
window.switchAuthTab = switchAuthTab;
window.handleRoleChange = handleRoleChange;
window.toggleStream = toggleStream;
window.toggleSidebar = toggleSidebar;
window.navigateTo = navigateTo;
window.showTeacherSection = showTeacherSection;
window.openEditModal = openEditModal;
window.saveProfileChanges = saveProfileChanges;
window.openPerformaModal = openPerformaModal;
window.savePerforma = savePerforma;
window.openTaskModal = openTaskModal;
window.saveTask = saveTask;
window.openTaskDetail = openTaskDetail;
window.toggleTaskCompletion = toggleTaskCompletion;
window.filterTasksBySearch = filterTasksBySearch;
window.setFilter = setFilter;
window.closeAllModals = closeAllModals;
window.toggleTheme = toggleTheme;
window.shareStreak = shareStreak;
window.openLeaderboard = openLeaderboard;
window.dismissPing = dismissPing;
window.closeNotifModal = closeNotifModal;
window.requestNotifPermission = requestNotifPermission;
window.initChallenge = initChallenge;
window.startQuiz = startQuiz;
window.selectAnswer = selectAnswer;
window.openTutorials = openTutorials;
window.showChapters = showChapters;
window.closeTutorialChapters = closeTutorialChapters;
window.openYouTubeSearch = openYouTubeSearch;

// Init Settings
window.onload = function() {
    populateClassDropdown('setup-class');
    populateClassDropdown('perf-class');
    populateClassDropdown('edit-class');
    const savedTheme = localStorage.getItem(DB_THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (document.getElementById('theme-toggle')) document.getElementById('theme-toggle').checked = true;
        if (document.getElementById('teacher-theme-toggle')) document.getElementById('teacher-theme-toggle').checked = true;
    }
    toggleSidebar(false);
    switchAuthTab('login');
    checkStreakValidity();
    checkNotifPermissionLogic();
};
