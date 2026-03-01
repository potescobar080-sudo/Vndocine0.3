// ============================================
// VENDOCINE - ADMIN DASHBOARD
// Complete Working Version - Ready to Paste
// ============================================

// Global variables
let currentUser = null;
let chartInstances = {};

// Default data to import if Firebase is empty
const defaultFirebaseData = {
  "auditLog": {
    "system_init": {
      "action": "system_initialized",
      "details": "Vendocine system initialized",
      "timestamp": 1704067200000,
      "user": "system"
    }
  },
  "classes": {
    "Robotics-Class_A": {
      "createdAt": 1770519808817,
      "teacherId": "-OkvC4kKl15ByYzPcRHk",
      "teacherName": "Elrov Escobar"
    },
    "Test 1": {
      "createdAt": 1770534325531,
      "teacherId": "-Okw3RVTPJJ8LVb94vh0",
      "teacherName": "Elrov"
    }
  },
  "settings": {
    "maintenance": false,
    "maxPillsPerMonth": 1,
    "setupComplete": true,
    "systemName": "Vendocine",
    "version": "1.0"
  },
  "students": {
    "-OkveKdGZYHvs_a0urBS": {
      "age": 15,
      "barcodeId": 304189500246,
      "birthDate": "2010-09-24",
      "class": "Robotics-Class_A",
      "createdAt": 1770527475841,
      "email": "suaybaguioangelyn16@gmail.com",
      "gender": "female",
      "id": "-OkveKdGZYHvs_a0urBS",
      "lrn": "128308150139",
      "medicalNotes": "",
      "name": "Angelyn S. Tocmo",
      "parentContact": "09366852639",
      "pillsLeft": 5,
      "pillsPerMonth": 5,
      "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STU2686898",
      "status": "active",
      "teacherId": "-OkvC4kKl15ByYzPcRHk",
      "totalClaims": 0
    }
  },
  "teachers": {
    "-OkvC4kKl15ByYzPcRHk": {
      "class": "Robotics-Class_A",
      "createdAt": 1770519808701,
      "email": "elrovescobar808@gmail.com",
      "employeeId": "09088184444",
      "id": "-OkvC4kKl15ByYzPcRHk",
      "name": "Elrov Escobar",
      "phone": "09101798633",
      "status": "active"
    }
  },
  "users": {
    "-OkvC4lEPmM_k3XLF_8S": {
      "createdAt": 1770519808761,
      "email": "elrovescobar808@gmail.com",
      "lastLogin": 1770672237641,
      "name": "Elrov Escobar",
      "role": "teacher",
      "status": "active",
      "teacherId": "-OkvC4kKl15ByYzPcRHk",
      "uid": "lapN9CrJuTZCF1woH3B1xOjOMCt2"
    },
    "-OkvlmteD9pJ8eaBUFQN": {
      "createdAt": 1770529434429,
      "email": "suaybaguioangelyn16@gmail.com",
      "lastLogin": 1770529436174,
      "role": "student",
      "status": "active",
      "studentId": "-OkveKdGZYHvs_a0urBS",
      "uid": "VTK5nCulMdWpwdlX9f5GkSxTxCz2"
    },
    "-Okvlmtnea_MDfm097s2": {
      "createdAt": 1770529434437,
      "email": "suaybaguioangelyn16@gmail.com",
      "lastLogin": 1770529434437,
      "role": "student",
      "status": "active",
      "studentId": "-OkveKdGZYHvs_a0urBS",
      "uid": "VTK5nCulMdWpwdlX9f5GkSxTxCz2"
    },
    "-Okw3RWWzdh2hcvyCaOu": {
      "createdAt": 1770534325473,
      "email": "potescobar090@gmail.com",
      "name": "Elrov",
      "role": "teacher",
      "status": "active",
      "teacherId": "-Okw3RVTPJJ8LVb94vh0"
    },
    "admin_pre": {
      "createdAt": 1704067200000,
      "email": "potescobar080@gmail.com",
      "isPreRegistered": true,
      "lastLogin": 1770613973269,
      "name": "Administrator",
      "role": "admin",
      "status": "active",
      "uid": "BkwTSoSXkmWBBiLOi5W0JvROPRj1"
    }
  }
};

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin dashboard initializing...");
    
    // Check admin access
    checkAdminAccess();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update time display
    updateTime();
    setInterval(updateTime, 60000);
});

// ============================================
// AUTHENTICATION & ACCESS CONTROL
// ============================================

// Check if user is admin
async function checkAdminAccess() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log("No user logged in, redirecting...");
            window.location.href = 'index.html';
            return;
        }
        
        console.log("User logged in:", user.email);
        currentUser = user;
        
        try {
            // Check if user exists in database
            const userSnapshot = await database.ref('users')
                .orderByChild('email')
                .equalTo(user.email)
                .once('value');
            
            if (!userSnapshot.exists()) {
                // User not in database - check if admin email
                if (user.email === 'admin@vendocine.com' || user.email.includes('admin')) {
                    // Create admin account
                    const adminRef = database.ref('users').push();
                    await adminRef.set({
                        uid: user.uid,
                        email: user.email,
                        role: 'admin',
                        name: 'Administrator',
                        createdAt: Date.now(),
                        lastLogin: Date.now(),
                        status: 'active',
                        isPreRegistered: true
                    });
                    
                    // Update UI and load data
                    updateAdminUI(user.email, 'Administrator');
                    loadDashboardData();
                    
                } else {
                    // Not admin, redirect
                    await auth.signOut();
                    window.location.href = 'index.html';
                }
                
            } else {
                // User exists in database
                const userData = userSnapshot.val();
                const userId = Object.keys(userData)[0];
                const userInfo = userData[userId];
                
                if (userInfo.role !== 'admin') {
                    // Not admin, redirect
                    await auth.signOut();
                    window.location.href = 'index.html';
                    return;
                }
                
                // Update last login
                await database.ref('users/' + userId).update({
                    lastLogin: Date.now(),
                    uid: user.uid
                });
                
                // Update UI
                updateAdminUI(user.email, userInfo.name);
                
                // Load dashboard data
                loadDashboardData();
            }
            
        } catch (error) {
            console.error('Admin access check error:', error);
            showNotification('Authentication error. Please try again.', 'error');
            await auth.signOut();
            window.location.href = 'index.html';
        }
    });
}

// Update admin UI
function updateAdminUI(email, name) {
    const adminNameEl = document.getElementById('admin-name');
    const adminEmailEl = document.getElementById('admin-email');
    
    if (adminNameEl) adminNameEl.textContent = name || 'Administrator';
    if (adminEmailEl) adminEmailEl.textContent = email;
}

// ============================================
// DASHBOARD DATA LOADING
// ============================================

// Load all dashboard data
async function loadDashboardData() {
    console.log("Loading dashboard data...");

    // Check if Firebase is empty and import default data if needed
    await checkAndImportDefaultData();

    // Load statistics
    loadStatistics();

    // Load recent activity
    loadRecentActivity();

    // Load teachers list
    loadTeachersList();

    // Load students list
    loadStudentsList();

    // Load classes list
    loadAllClasses();

    // Load claims list
    loadClaimsList();

    // Load system settings
    loadSystemSettings();
}

// Check if Firebase is empty and import default data
async function checkAndImportDefaultData() {
    try {
        // Check if settings exist
        const settingsSnap = await database.ref('settings').once('value');
        if (settingsSnap.exists()) {
            console.log("Firebase data already exists, skipping import");
            return;
        }

        console.log("Firebase appears empty, importing default data...");

        // Import default data in order
        const importOrder = ['auditLog', 'settings', 'classes', 'teachers', 'students', 'users'];

        for (const collection of importOrder) {
            if (defaultFirebaseData[collection]) {
                await database.ref(collection).set(defaultFirebaseData[collection]);
                console.log(`Imported ${collection}`);
            }
        }

        console.log("Default data imported successfully");
        showNotification('Default system data imported successfully!', 'success');

    } catch (error) {
        console.error('Error checking/importing default data:', error);
        showNotification('Error importing default data: ' + error.message, 'error');
    }
}

// Load statistics
function loadStatistics() {
    // Total Students
    database.ref('students').on('value', (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        updateElementText('total-students', count);
        updateElementText('total-students-stat', count);
    });
    
    // Total Teachers
    database.ref('teachers').on('value', (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        updateElementText('total-teachers', count);
        updateElementText('active-teachers', count);
    });
    
    // Total Classes
    database.ref('classes').on('value', (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        updateElementText('total-classes', count);
        updateElementText('total-classes-stat', count);
    });
    
    // Today's Claims
    const today = new Date().toISOString().split('T')[0];
    database.ref('claims').orderByChild('date').equalTo(today)
        .on('value', (snapshot) => {
            const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
            updateElementText('today-claims', count);
        });
}

// ============================================
// TEACHER MANAGEMENT
// ============================================

// Load teachers list
function loadTeachersList() {
    const teachersDiv = document.getElementById('teachers-table');
    if (!teachersDiv) return;
    
    database.ref('teachers').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            teachersDiv.innerHTML = '<p class="no-data">No teachers registered yet.</p>';
            return;
        }
        
        let html = '<div class="table-header"><div>Name</div><div>Email</div><div>Class</div><div>Actions</div></div>';
        
        snapshot.forEach((child) => {
            const teacher = child.val();
            html += `
                <div class="table-row">
                    <div>${teacher.name}</div>
                    <div>${teacher.email}</div>
                    <div>${teacher.class || 'N/A'}</div>
                    <div>
                        <button onclick="viewTeacher('${child.key}')" class="btn-small">View</button>
                        <button onclick="editTeacher('${child.key}')" class="btn-small">Edit</button>
                        <button onclick="deleteTeacher('${child.key}')" class="btn-small btn-danger">Delete</button>
                    </div>
                </div>
            `;
        });
        
        teachersDiv.innerHTML = html;
    });
}

// Register teacher form handler
document.addEventListener('DOMContentLoaded', function() {
    const teacherForm = document.getElementById('teacher-form');
    if (teacherForm) {
        teacherForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await registerTeacher(e);
        });
    }
});

// Register new teacher
async function registerTeacher(e) {
    const teacherData = {
        name: document.getElementById('teacher-name').value,
        email: document.getElementById('teacher-email').value,
        phone: document.getElementById('teacher-phone').value,
        employeeId: document.getElementById('teacher-employee-id').value,
        class: document.getElementById('teacher-class').value,
        status: 'active',
        createdAt: Date.now()
    };
    
    const resultDiv = document.getElementById('teacher-result');
    
    try {
        // Check if email exists
        const emailCheck = await database.ref('teachers')
            .orderByChild('email')
            .equalTo(teacherData.email)
            .once('value');
        
        if (emailCheck.exists()) {
            showResult('teacher-result', 'Email already registered!', 'error');
            return;
        }
        
        // Add teacher
        const teacherRef = database.ref('teachers').push();
        const teacherId = teacherRef.key;
        
        await teacherRef.set({
            id: teacherId,
            ...teacherData
        });
        
        // Add to users
        await database.ref('users').push().set({
            email: teacherData.email,
            role: 'teacher',
            name: teacherData.name,
            teacherId: teacherId,
            createdAt: Date.now(),
            status: 'active'
        });
        
        // Add class
        if (teacherData.class) {
            await database.ref('classes/' + teacherData.class).set({
                teacherId: teacherId,
                teacherName: teacherData.name,
                createdAt: Date.now()
            });
        }
        
        showResult('teacher-result', '✅ Teacher registered successfully!', 'success');
        e.target.reset();
        loadTeachersList();
        
    } catch (error) {
        console.error('Teacher registration error:', error);
        showResult('teacher-result', '❌ Error: ' + error.message, 'error');
    }
}

// View teacher
async function viewTeacher(teacherId) {
    try {
        const teacherSnap = await database.ref('teachers/' + teacherId).once('value');
        if (!teacherSnap.exists()) {
            showNotification('Teacher not found', 'error');
            return;
        }
        
        const teacher = teacherSnap.val();
        
        // Get students count
        const studentsSnap = await database.ref('students')
            .orderByChild('teacherId')
            .equalTo(teacherId)
            .once('value');
        const studentCount = studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0;
        
        alert(`Teacher Details:\n\nName: ${teacher.name}\nEmail: ${teacher.email}\nClass: ${teacher.class || 'N/A'}\nStudents: ${studentCount}`);
        
    } catch (error) {
        console.error('Error viewing teacher:', error);
        showNotification('Error loading teacher details', 'error');
    }
}

// Delete teacher
async function deleteTeacher(teacherId) {
    if (!confirm('Delete this teacher?')) return;
    
    try {
        await database.ref('teachers/' + teacherId).remove();
        showNotification('Teacher deleted', 'success');
        loadTeachersList();
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showNotification('Error deleting teacher', 'error');
    }
}

// ============================================
// STUDENT MANAGEMENT
// ============================================

// Load students list
function loadStudentsList() {
    const studentsList = document.getElementById('students-list');
    if (!studentsList) return;
    
    database.ref('students').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            studentsList.innerHTML = '<div class="table-row"><div colspan="5">No students found.</div></div>';
            return;
        }
        
        let html = '';
        
        snapshot.forEach((child) => {
            const student = child.val();
            const pillsLeft = student.pillsLeft || 5;
            
            html += `
                <div class="table-row">
                    <td>${student.name}</td>
                    <td>${student.class || 'N/A'}</td>
                    <td>${student.email}</td>
                    <td>
                        <span class="pill-count ${pillsLeft < 3 ? 'low' : ''}">
                            ${pillsLeft}/5
                        </span>
                    </td>
                    <td>
                        <button onclick="viewStudent('${child.key}')" class="btn-small">View</button>
                        <button onclick="resetStudentPills('${child.key}')" class="btn-small">Reset</button>
                    </td>
                </div>
            `;
        });
        
        studentsList.innerHTML = html;
    });
}

// Search students
function searchStudents() {
    const searchTerm = document.getElementById('search-students').value.toLowerCase();
    const rows = document.querySelectorAll('#students-list .table-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// View student
async function viewStudent(studentId) {
    try {
        const studentSnap = await database.ref('students/' + studentId).once('value');
        if (!studentSnap.exists()) {
            showNotification('Student not found', 'error');
            return;
        }
        
        const student = studentSnap.val();
        
        alert(`Student Details:\n\nName: ${student.name}\nEmail: ${student.email}\nClass: ${student.class || 'N/A'}\nLRN: ${student.lrn || 'N/A'}\nPills Left: ${student.pillsLeft || 5}/5`);
        
    } catch (error) {
        console.error('Error viewing student:', error);
        showNotification('Error loading student', 'error');
    }
}

// Reset student pills
async function resetStudentPills(studentId) {
    if (!confirm('Reset pills to 5?')) return;
    
    try {
        await database.ref('students/' + studentId).update({
            pillsLeft: 5,
            lastReset: Date.now()
        });
        showNotification('Pills reset to 5', 'success');
    } catch (error) {
        console.error('Error resetting pills:', error);
        showNotification('Error resetting pills', 'error');
    }
}

// ============================================
// CLASS MANAGEMENT
// ============================================

// Load all classes
async function loadAllClasses() {
    const classesDiv = document.getElementById('classes-list');
    if (!classesDiv) return;

    database.ref('classes').on('value', async (snapshot) => {
        if (!snapshot.exists()) {
            classesDiv.innerHTML = '<div class="table-row"><div colspan="4">No classes found.</div></div>';
            return;
        }

        let html = '';

        for (const [className, classData] of Object.entries(snapshot.val())) {
            // Get teacher name
            let teacherName = 'Not assigned';
            let teacherId = null;
            if (classData.teacherId) {
                teacherId = classData.teacherId;
                const teacherSnap = await database.ref('teachers/' + classData.teacherId).once('value');
                if (teacherSnap.exists()) {
                    teacherName = teacherSnap.val().name;
                }
            }

            // Get student count
            const studentsSnap = await database.ref('students')
                .orderByChild('class')
                .equalTo(className)
                .once('value');
            const studentCount = studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0;

            html += `
                <div class="table-row">
                    <div><strong>${className}</strong></div>
                    <div>${teacherName}</div>
                    <div>${studentCount} students</div>
                    <div>
                        <button onclick="viewClassDetails('${className}')" class="btn-small">View Details</button>
                        <button onclick="accessTeacherDashboard('${teacherId}')" class="btn-small">👨‍🏫 Teacher</button>
                        <button onclick="accessStudentDashboards('${className}')" class="btn-small">👤 Students</button>
                    </div>
                </div>
            `;
        }

        classesDiv.innerHTML = html;
    });
}

// View class students
async function viewClassStudents(className) {
    try {
        const studentsSnap = await database.ref('students')
            .orderByChild('class')
            .equalTo(className)
            .once('value');

        if (!studentsSnap.exists()) {
            showNotification('No students in this class', 'info');
            return;
        }

        let message = `Students in ${className}:\n\n`;
        studentsSnap.forEach((child) => {
            const student = child.val();
            message += `• ${student.name} (${student.email}) - ${student.pillsLeft || 5}/5 pills\n`;
        });

        alert(message);

    } catch (error) {
        console.error('Error viewing class students:', error);
        showNotification('Error loading class students', 'error');
    }
}

// View class details - redirect to dedicated dashboard
function viewClassDetails(className) {
    window.location.href = `class-details.html?class=${encodeURIComponent(className)}`;
}

// Access teacher dashboard
function accessTeacherDashboard(teacherId) {
    if (!teacherId) {
        showNotification('No teacher assigned to this class', 'warning');
        return;
    }

    // Open teacher dashboard in new tab with teacherId parameter
    window.open(`teacher-dashboard.html?teacherId=${teacherId}`, '_blank');
    showNotification('Teacher dashboard opened in new tab', 'success');
}

// Access student dashboards
async function accessStudentDashboards(className) {
    try {
        const studentsSnap = await database.ref('students')
            .orderByChild('class')
            .equalTo(className)
            .once('value');

        if (!studentsSnap.exists()) {
            showNotification('No students in this class', 'info');
            return;
        }

        const studentCount = Object.keys(studentsSnap.val()).length;
        if (studentCount === 1) {
            // Open single student dashboard
            const studentId = Object.keys(studentsSnap.val())[0];
            window.open(`student-dashboard.html?admin=${studentId}`, '_blank');
            showNotification('Student dashboard opened in new tab', 'success');
        } else {
            // Open student selection page
            window.open(`student-dashboard.html?class=${encodeURIComponent(className)}`, '_blank');
            showNotification('Student selection opened in new tab', 'success');
        }

    } catch (error) {
        console.error('Error accessing student dashboards:', error);
        showNotification('Error accessing student dashboards', 'error');
    }
}

// Search classes
function searchClasses() {
    const searchTerm = document.getElementById('search-classes').value.toLowerCase();
    const rows = document.querySelectorAll('#classes-list .table-row');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ============================================
// AUDIT LOG MANAGEMENT
// ============================================

// Store audit entries for export/print functionality
let currentAuditEntries = [];

// Load audit log
function loadAuditLog() {
    const filter = document.getElementById('audit-filter')?.value || 'all';
    const auditList = document.getElementById('audit-list');

    if (!auditList) return;

    let query = database.ref('auditLog').orderByChild('timestamp');

    // Apply time filter
    if (filter === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        query = query.startAt(startOfDay);
    } else if (filter === 'week') {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        query = query.startAt(weekAgo);
    } else if (filter === 'month') {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        query = query.startAt(monthAgo);
    }

    query.limitToLast(50).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            auditList.innerHTML = '<div class="table-row"><div colspan="4">No audit log entries found.</div></div>';
            currentAuditEntries = [];
            return;
        }

        let html = '';
        const auditEntries = [];

        snapshot.forEach((child) => {
            auditEntries.push({ id: child.key, ...child.val() });
        });

        // Sort newest first
        auditEntries.sort((a, b) => b.timestamp - a.timestamp);
        
        // Store for export
        currentAuditEntries = auditEntries;

        for (const entry of auditEntries) {
            const entryDate = new Date(entry.timestamp);
            const dateStr = entryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            html += `
                <div class="table-row">
                    <div>${entry.action || 'N/A'}</div>
                    <div>${entry.details || 'N/A'}</div>
                    <div>${entry.user || 'system'}</div>
                    <div>${dateStr}</div>
                </div>
            `;
        }

        auditList.innerHTML = html;
    });
}

// Filter audit log by specific date
function filterBySpecificDate() {
    const datePicker = document.getElementById('audit-date-picker');
    const selectedDate = datePicker?.value;
    
    if (!selectedDate) {
        showNotification('Please select a date to filter', 'warning');
        return;
    }

    const auditList = document.getElementById('audit-list');
    if (!auditList) return;

    // Convert selected date to timestamp range
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    
    const startOfDay = new Date(year, month, day).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

    const query = database.ref('auditLog')
        .orderByChild('timestamp')
        .startAt(startOfDay)
        .endAt(endOfDay);

    query.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            auditList.innerHTML = '<div class="table-row"><div colspan="4">No audit log entries found for this date.</div></div>';
            currentAuditEntries = [];
            return;
        }

        let html = '';
        const auditEntries = [];

        snapshot.forEach((child) => {
            auditEntries.push({ id: child.key, ...child.val() });
        });

        // Sort newest first
        auditEntries.sort((a, b) => b.timestamp - a.timestamp);
        currentAuditEntries = auditEntries;

        for (const entry of auditEntries) {
            const entryDate = new Date(entry.timestamp);
            const dateStr = entryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            html += `
                <div class="table-row">
                    <div>${entry.action || 'N/A'}</div>
                    <div>${entry.details || 'N/A'}</div>
                    <div>${entry.user || 'system'}</div>
                    <div>${dateStr}</div>
                </div>
            `;
        }

        auditList.innerHTML = html;
        showNotification(`Found ${auditEntries.length} entries for ${selectedDate}`, 'success');
    });
}

// Print audit log
function printAuditLog() {
    // Get current audit entries or fetch them
    if (currentAuditEntries.length === 0) {
        // Fetch current data first
        database.ref('auditLog').orderByChild('timestamp').limitToLast(50).once('value', (snapshot) => {
            if (!snapshot.exists()) {
                showNotification('No audit log entries to print', 'warning');
                return;
            }
            const entries = [];
            snapshot.forEach((child) => {
                entries.push({ id: child.key, ...child.val() });
            });
            entries.sort((a, b) => b.timestamp - a.timestamp);
            generatePrintView(entries);
        });
    } else {
        generatePrintView(currentAuditEntries);
    }
}

// Generate print view
function generatePrintView(entries) {
    // Create print-specific content
    const printWindow = window.open('', '_blank');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vendocine - Audit Log Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .meta { text-align: center; margin-bottom: 20px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .no-data { text-align: center; padding: 20px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>💊 Vendocine - Audit Log Report</h1>
            <div class="meta">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Entries: ${entries.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Details</th>
                        <th>User</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.length === 0 ? '<tr><td colspan="4" class="no-data">No audit log entries found.</td></tr>' : 
                    entries.map(entry => {
                        const entryDate = new Date(entry.timestamp);
                        const dateStr = entryDate.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                        });
                        return `
                            <tr>
                                <td>${entry.action || 'N/A'}</td>
                                <td>${entry.details || 'N/A'}</td>
                                <td>${entry.user || 'system'}</td>
                                <td>${dateStr}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Save audit log as PDF
function saveAuditLogAsPDF() {
    // Get current audit entries or fetch them
    if (currentAuditEntries.length === 0) {
        // Fetch current data first
        database.ref('auditLog').orderByChild('timestamp').limitToLast(50).once('value', (snapshot) => {
            if (!snapshot.exists()) {
                showNotification('No audit log entries to save', 'warning');
                return;
            }
            const entries = [];
            snapshot.forEach((child) => {
                entries.push({ id: child.key, ...child.val() });
            });
            entries.sort((a, b) => b.timestamp - a.timestamp);
            generatePDFView(entries);
        });
    } else {
        generatePDFView(currentAuditEntries);
    }
}

// Generate PDF view (using print to PDF)
function generatePDFView(entries) {
    // Create PDF-specific content
    const printWindow = window.open('', '_blank');
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vendocine - Audit Log Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    padding: 40px; 
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 20px;
                }
                .header h1 { 
                    font-size: 28px; 
                    color: #2E7D32; 
                    margin-bottom: 10px;
                }
                .header .logo { 
                    font-size: 40px; 
                    margin-bottom: 10px;
                }
                .meta { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    color: #666;
                    font-size: 14px;
                }
                .meta span { 
                    margin: 0 10px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    font-size: 12px;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px 12px; 
                    text-align: left;
                }
                th { 
                    background-color: #4CAF50; 
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) { background-color: #f9f9f9; }
                tr:hover { background-color: #f1f1f1; }
                .no-data { 
                    text-align: center; 
                    padding: 40px; 
                    color: #999;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                @page {
                    size: A4;
                    margin: 1cm;
                }
                @media print { 
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">💊</div>
                <h1>Vendocine - Audit Log Report</h1>
            </div>
            <div class="meta">
                <span><strong>Generated:</strong> ${new Date().toLocaleString()}</span>
                <span><strong>Total Entries:</strong> ${entries.length}</span>
                <span><strong>Report Date:</strong> ${currentDate}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 20%">Action</th>
                        <th style="width: 30%">Details</th>
                        <th style="width: 20%">User</th>
                        <th style="width: 30%">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.length === 0 ? '<tr><td colspan="4" class="no-data">No audit log entries found.</td></tr>' : 
                    entries.map(entry => {
                        const entryDate = new Date(entry.timestamp);
                        const dateStr = entryDate.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                        });
                        return `
                            <tr>
                                <td>${entry.action || 'N/A'}</td>
                                <td>${entry.details || 'N/A'}</td>
                                <td>${entry.user || 'system'}</td>
                                <td>${dateStr}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>Vendocine System - Audit Log Report</p>
                <p>This is a system-generated document</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print (which allows Save as PDF)
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// ============================================
// CLAIMS MANAGEMENT
// ============================================

// Load claims list
function loadClaimsList() {
    const filter = document.getElementById('claim-filter')?.value || 'all';
    const claimsList = document.getElementById('claims-list');
    
    if (!claimsList) return;
    
    let query = database.ref('claims').orderByChild('timestamp');
    
    // Apply time filter
    if (filter === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        query = query.startAt(startOfDay);
    } else if (filter === 'week') {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        query = query.startAt(weekAgo);
    } else if (filter === 'month') {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        query = query.startAt(monthAgo);
    }
    
    query.limitToLast(50).on('value', async (snapshot) => {
        if (!snapshot.exists()) {
            claimsList.innerHTML = '<tr><td colspan="4">No claims found</td></tr>';
            return;
        }

        let html = '';
        const claims = [];

        snapshot.forEach((child) => {
            claims.push({ id: child.key, ...child.val() });
        });

        // Sort newest first
        claims.sort((a, b) => b.timestamp - a.timestamp);

        // Get all unique student IDs
        const studentIds = new Set();
        claims.forEach(claim => {
            if (claim.studentId) studentIds.add(claim.studentId);
        });

        // Fetch all student data in parallel
        const studentPromises = Array.from(studentIds).map(id => database.ref('students/' + id).once('value'));
        const studentSnaps = await Promise.all(studentPromises);

        // Create a map of studentId to student data
        const studentMap = {};
        Array.from(studentIds).forEach((id, index) => {
            const snap = studentSnaps[index];
            if (snap.exists()) {
                studentMap[id] = snap.val();
            }
        });

        for (const claim of claims) {
            let studentData = studentMap[claim.studentId];
            let studentName = studentData?.name || 'Unknown';
            let studentClass = studentData?.class || 'N/A';

            // Format date and time separately
            const claimDate = new Date(claim.timestamp);
            const dateStr = claimDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = claimDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            html += `
                <tr>
                    <td>${studentName}</td>
                    <td>${studentClass}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td>${claim.pillsLeft || 0}/5</td>
                </tr>
            `;
        }

        claimsList.innerHTML = html;
    });
}

// ============================================
// SYSTEM SETTINGS
// ============================================

// Load system settings
function loadSystemSettings() {
    // Load pill limit
    database.ref('settings/maxPillsPerMonth').on('value', (snapshot) => {
        const limit = snapshot.val() || 5;
        const pillLimitInput = document.getElementById('pill-limit');
        if (pillLimitInput) {
            pillLimitInput.value = limit;
        }
    });
    
    // Load maintenance mode
    database.ref('settings/maintenance').on('value', (snapshot) => {
        const isMaintenance = snapshot.val() || false;
        const maintenanceToggle = document.getElementById('maintenance-mode');
        const maintenanceStatus = document.getElementById('maintenance-status');
        
        if (maintenanceToggle) {
            maintenanceToggle.checked = isMaintenance;
        }
        if (maintenanceStatus) {
            maintenanceStatus.textContent = isMaintenance 
                ? 'System in maintenance mode' 
                : 'System is operational';
        }
    });
}

// Update pill limit
async function updatePillLimit() {
    const limitInput = document.getElementById('pill-limit');
    if (!limitInput) return;
    
    const limit = parseInt(limitInput.value);
    
    if (isNaN(limit) || limit < 1 || limit > 30) {
        showNotification('Please enter a valid number between 1 and 30', 'error');
        return;
    }
    
    try {
        await database.ref('settings').update({
            maxPillsPerMonth: limit
        });
        showNotification(`Pill limit updated to ${limit}`, 'success');
    } catch (error) {
        console.error('Error updating pill limit:', error);
        showNotification('Error updating pill limit', 'error');
    }
}

// Toggle maintenance mode
async function toggleMaintenance() {
    const maintenanceToggle = document.getElementById('maintenance-mode');
    if (!maintenanceToggle) return;
    
    const isMaintenance = maintenanceToggle.checked;
    
    try {
        await database.ref('settings').update({
            maintenance: isMaintenance
        });
        
        showNotification(
            isMaintenance 
                ? 'Maintenance mode enabled' 
                : 'Maintenance mode disabled',
            'success'
        );
    } catch (error) {
        console.error('Error updating maintenance mode:', error);
        showNotification('Error updating maintenance mode', 'error');
    }
}

// Reset all monthly claims
async function resetMonthlyClaims() {
    if (!confirm('Reset ALL student pill counts? This will set every student to 5 pills.')) {
        return;
    }
    
    try {
        // Get all students
        const studentsSnapshot = await database.ref('students').once('value');
        
        if (!studentsSnapshot.exists()) {
            showNotification('No students found', 'info');
            return;
        }
        
        const updates = {};
        studentsSnapshot.forEach((child) => {
            updates[`students/${child.key}/pillsLeft`] = 5;
        });
        
        await database.ref().update(updates);
        showNotification('All student pills reset to 5', 'success');
        
    } catch (error) {
        console.error('Error resetting claims:', error);
        showNotification('Error resetting claims', 'error');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Setup event listeners
function setupEventListeners() {
    // Teacher form already handled in DOMContentLoaded

    // Search students
    const searchInput = document.getElementById('search-students');
    if (searchInput) {
        searchInput.addEventListener('input', searchStudents);
    }

    // Search classes
    const searchClassesInput = document.getElementById('search-classes');
    if (searchClassesInput) {
        searchClassesInput.addEventListener('input', searchClasses);
    }

    // Audit filter
    const auditFilter = document.getElementById('audit-filter');
    if (auditFilter) {
        auditFilter.addEventListener('change', loadAuditLog);
    }

    // Maintenance toggle
    const maintenanceToggle = document.getElementById('maintenance-mode');
    if (maintenanceToggle) {
        maintenanceToggle.addEventListener('change', toggleMaintenance);
    }

    // Pill limit update
    const updateLimitBtn = document.getElementById('update-pill-limit');
    if (updateLimitBtn) {
        updateLimitBtn.addEventListener('click', updatePillLimit);
    }
}

// Update element text
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// Show result message
function showResult(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : 
                  type === 'error' ? '❌' : 
                  type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    // Style
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        background: ${type === 'success' ? '#4CAF50' : 
                     type === 'error' ? '#f44336' : 
                     type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Update time
function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = 
            now.toLocaleDateString() + ' ' + 
            now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from menu
    document.querySelectorAll('.sidebar-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked item
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'overview': 'Admin Dashboard',
        'register-teacher': 'Register Teacher',
        'manage-students': 'Manage Students',
        'all-classes': 'All Classes',
        'view-claims': 'View Claims',
        'system-settings': 'System Settings'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Admin Dashboard';
    }
}

// Load recent activity (simplified)
function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;
    
    // Simple placeholder
    activityList.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon">📝</div>
            <div class="activity-details">
                <p class="activity-action">System initialized</p>
                <p class="activity-time">Just now</p>
            </div>
        </div>
        <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-details">
                <p class="activity-action">Admin logged in</p>
                <p class="activity-time">Just now</p>
            </div>
        </div>
    `;
}

// ============================================
// USER CREDENTIALS MANAGEMENT
// ============================================

// Load user credentials list
function loadCredentialsList() {
    const credentialsList = document.getElementById('credentials-list');
    if (!credentialsList) return;

    database.ref('users').on('value', async (snapshot) => {
        if (!snapshot.exists()) {
            credentialsList.innerHTML = '<div class="table-row"><div colspan="6">No users found.</div></div>';
            return;
        }

        let html = '';

        for (const [userId, userData] of Object.entries(snapshot.val())) {
            let name = userData.name || 'N/A';
            let role = userData.role || 'N/A';
            let status = userData.status || 'N/A';
            let className = 'N/A';

            // Get class for teachers and students
            if (role === 'teacher' && userData.teacherId) {
                const teacherSnap = await database.ref('teachers/' + userData.teacherId).once('value');
                if (teacherSnap.exists()) {
                    className = teacherSnap.val().class || 'N/A';
                }
            } else if (role === 'student' && userData.studentId) {
                const studentSnap = await database.ref('students/' + userData.studentId).once('value');
                if (studentSnap.exists()) {
                    className = studentSnap.val().class || 'N/A';
                }
            }

            html += `
                <div class="table-row">
                    <div>${name}</div>
                    <div>${userData.email}</div>
                    <div>${role}</div>
                    <div>${className}</div>
                    <div><span class="status-${status}">${status}</span></div>
                    <div>
                        <button onclick="viewUserDetails('${userId}')" class="btn-small">View</button>
                        <button onclick="resetUserPassword('${userId}')" class="btn-small">Reset Password</button>
                    </div>
                </div>
            `;
        }

        credentialsList.innerHTML = html;
    });
}

// Search credentials
function searchCredentials() {
    const searchTerm = document.getElementById('search-credentials').value.toLowerCase();
    const rows = document.querySelectorAll('#credentials-list .table-row');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter by role
function filterByRole(role) {
    const rows = document.querySelectorAll('#credentials-list .table-row');

    rows.forEach(row => {
        if (role === 'all') {
            row.style.display = '';
        } else {
            const roleCell = row.children[2]; // Role is in the 3rd column (index 2)
            const rowRole = roleCell.textContent.toLowerCase();
            row.style.display = rowRole === role ? '' : 'none';
        }
    });
}

// View user details
async function viewUserDetails(userId) {
    try {
        const userSnap = await database.ref('users/' + userId).once('value');
        if (!userSnap.exists()) {
            showNotification('User not found', 'error');
            return;
        }

        const user = userSnap.val();
        let details = `User Details:\n\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}\nName: ${user.name || 'N/A'}\nLast Login: ${user.lastLogin ? formatTimestamp(user.lastLogin) : 'Never'}`;

        if (user.role === 'teacher' && user.teacherId) {
            const teacherSnap = await database.ref('teachers/' + user.teacherId).once('value');
            if (teacherSnap.exists()) {
                const teacher = teacherSnap.val();
                details += `\n\nTeacher Info:\nClass: ${teacher.class || 'N/A'}\nPhone: ${teacher.phone || 'N/A'}\nEmployee ID: ${teacher.employeeId || 'N/A'}`;
            }
        } else if (user.role === 'student' && user.studentId) {
            const studentSnap = await database.ref('students/' + user.studentId).once('value');
            if (studentSnap.exists()) {
                const student = studentSnap.val();
                details += `\n\nStudent Info:\nClass: ${student.class || 'N/A'}\nLRN: ${student.lrn || 'N/A'}\nPills Left: ${student.pillsLeft || 5}`;
            }
        }

        alert(details);
    } catch (error) {
        console.error('Error viewing user details:', error);
        showNotification('Error loading user details', 'error');
    }
}

// Reset user password (placeholder - would need Firebase Admin SDK)
function resetUserPassword(userId) {
    alert('Password reset functionality requires Firebase Admin SDK setup. This is a placeholder.');
}

// Export credentials to CSV
function exportCredentialsCSV() {
    database.ref('users').once('value').then(async (snapshot) => {
        if (!snapshot.exists()) {
            showNotification('No users to export', 'warning');
            return;
        }

        let csv = 'Name,Email,Role,Class,Status,Last Login\n';

        for (const [userId, userData] of Object.entries(snapshot.val())) {
            let name = userData.name || 'N/A';
            let role = userData.role || 'N/A';
            let status = userData.status || 'N/A';
            let className = 'N/A';
            let lastLogin = userData.lastLogin ? formatTimestamp(userData.lastLogin) : 'Never';

            // Get class for teachers and students
            if (role === 'teacher' && userData.teacherId) {
                const teacherSnap = await database.ref('teachers/' + userData.teacherId).once('value');
                if (teacherSnap.exists()) {
                    className = teacherSnap.val().class || 'N/A';
                }
            } else if (role === 'student' && userData.studentId) {
                const studentSnap = await database.ref('students/' + userData.studentId).once('value');
                if (studentSnap.exists()) {
                    className = studentSnap.val().class || 'N/A';
                }
            }

            csv += `"${name}","${userData.email}","${role}","${className}","${status}","${lastLogin}"\n`;
        }

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-credentials.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        showNotification('CSV exported successfully', 'success');
    });
}

// Print credentials
function printCredentials() {
    window.print();
}

// Import Firebase data
async function importFirebaseData() {
    const fileInput = document.getElementById('firebase-import-file');
    if (!fileInput.files.length) {
        showNotification('Please select a JSON file to import', 'warning');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!confirm('This will overwrite existing data. Are you sure you want to continue?')) {
                return;
            }

            // Import data in order
            const importOrder = ['auditLog', 'settings', 'classes', 'teachers', 'students', 'users'];

            for (const collection of importOrder) {
                if (data[collection]) {
                    await database.ref(collection).set(data[collection]);
                }
            }

            showNotification('Data imported successfully!', 'success');

            // Reload dashboard data
            loadDashboardData();

        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing data: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin dashboard initializing...");

    // Check admin access
    checkAdminAccess();

    // Setup event listeners
    setupEventListeners();

    // Update time display
    updateTime();
    setInterval(updateTime, 60000);

    // Load data when sections are shown
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.id === 'user-credentials' && target.style.display !== 'none') {
                    loadCredentialsList();
                } else if (target.id === 'view-claims' && target.style.display !== 'none') {
                    loadAuditLog();
                }
            }
        });
    });

    const credentialsSection = document.getElementById('user-credentials');
    if (credentialsSection) {
        observer.observe(credentialsSection, { attributes: true });
    }

    const auditSection = document.getElementById('view-claims');
    if (auditSection) {
        observer.observe(auditSection, { attributes: true });
    }
});

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    }
    
    .notification.success {
        background: #4CAF50;
    }
    
    .notification.error {
        background: #f44336;
    }
    
    .notification.warning {
        background: #ff9800;
    }
    
    .notification.info {
        background: #2196F3;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .pill-count {
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 0.9em;
    }
    
    .pill-count.low {
        background: #ffebee;
        color: #c62828;
    }
    
    .btn-small {
        padding: 5px 10px;
        font-size: 0.9em;
        margin: 2px;
    }
    
    .btn-danger {
        background: #f44336;
        color: white;
    }
    
    .alert {
        padding: 10px 15px;
        border-radius: 5px;
        margin: 10px 0;
    }
    
    .alert-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .alert-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .no-data {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style);

console.log("Admin dashboard loaded successfully");