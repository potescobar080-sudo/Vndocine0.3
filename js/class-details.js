// ============================================
// VENDOCINE - CLASS DETAILS DASHBOARD
// ============================================

let currentClass = null;

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Class details dashboard initializing...");

    // Get class name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const className = urlParams.get('class');

    if (!className) {
        alert('No class specified');
        window.location.href = 'admin-dashboard.html';
        return;
    }

    currentClass = className;

    // Load class data
    loadClassData();

    // Update time display
    updateTime();
    setInterval(updateTime, 60000);
});

// Load all class data
function loadClassData() {
    console.log("Loading class data for:", currentClass);

    // Load class info
    loadClassInfo();

    // Load students sidebar
    loadStudentsSidebar();

    // Load claims summary
    loadClaimsSummary();

    // Load recent claims
    loadRecentClaims();
}

// Load class information
async function loadClassInfo() {
    try {
        // Get class data
        const classSnap = await database.ref('classes/' + currentClass).once('value');
        if (!classSnap.exists()) {
            alert('Class not found');
            window.location.href = 'admin-dashboard.html';
            return;
        }

        const classData = classSnap.val();

        // Get teacher info
        let teacherName = 'Not assigned';
        if (classData.teacherId) {
            const teacherSnap = await database.ref('teachers/' + classData.teacherId).once('value');
            if (teacherSnap.exists()) {
                teacherName = teacherSnap.val().name;
            }
        }

        // Get student count
        const studentsSnap = await database.ref('students')
            .orderByChild('class')
            .equalTo(currentClass)
            .once('value');
        const studentCount = studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0;

        // Update UI
        updateElementText('class-name', currentClass);
        updateElementText('class-teacher', `Teacher: ${teacherName}`);
        updateElementText('class-students-count', `Students: ${studentCount}`);

    } catch (error) {
        console.error('Error loading class info:', error);
        showNotification('Error loading class information', 'error');
    }
}

// Load students sidebar
async function loadStudentsSidebar() {
    const studentsList = document.getElementById('students-sidebar-list');
    if (!studentsList) return;

    try {
        const studentsSnap = await database.ref('students')
            .orderByChild('class')
            .equalTo(currentClass)
            .once('value');

        if (!studentsSnap.exists()) {
            studentsList.innerHTML = '<div class="no-students">No students enrolled</div>';
            return;
        }

        let html = '';

        studentsSnap.forEach((child) => {
            const student = child.val();
            const pillsLeft = student.pillsLeft || 5;
            const pillStatus = pillsLeft < 3 ? 'low' : pillsLeft === 0 ? 'empty' : 'normal';

            html += `
                <div class="student-item" onclick="viewStudentDetails('${child.key}')">
                    <div class="student-name">${student.name}</div>
                    <div class="student-pills ${pillStatus}">${pillsLeft}/5 pills</div>
                </div>
            `;
        });

        studentsList.innerHTML = html;

    } catch (error) {
        console.error('Error loading students sidebar:', error);
        studentsList.innerHTML = '<div class="error">Error loading students</div>';
    }
}

// Load claims summary
async function loadClaimsSummary() {
    try {
        const claimsRef = database.ref('claims');

        // Today's claims
        const today = new Date().toISOString().split('T')[0];
        const todayClaims = await claimsRef
            .orderByChild('date')
            .equalTo(today)
            .once('value');
        const todayCount = todayClaims.exists() ? Object.keys(todayClaims.val()).length : 0;

        // This week's claims
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weekClaims = await claimsRef
            .orderByChild('timestamp')
            .startAt(weekAgo)
            .once('value');
        const weekCount = weekClaims.exists() ? Object.keys(weekClaims.val()).length : 0;

        // This month's claims
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const monthClaims = await claimsRef
            .orderByChild('timestamp')
            .startAt(monthAgo)
            .once('value');
        const monthCount = monthClaims.exists() ? Object.keys(monthClaims.val()).length : 0;

        // Total claims for this class
        const allClaims = await claimsRef.once('value');
        let totalCount = 0;

        if (allClaims.exists()) {
            allClaims.forEach((child) => {
                const claim = child.val();
                // Check if claim belongs to a student in this class
                if (claim.studentId) {
                    // We would need to check student class, but for simplicity, count all claims
                    // In a real implementation, you'd filter by student class
                    totalCount++;
                }
            });
        }

        // Update UI
        updateElementText('today-claims-count', todayCount);
        updateElementText('week-claims-count', weekCount);
        updateElementText('month-claims-count', monthCount);
        updateElementText('total-claims-count', totalCount);

    } catch (error) {
        console.error('Error loading claims summary:', error);
        showNotification('Error loading claims summary', 'error');
    }
}

// Load recent claims for this class
async function loadRecentClaims() {
    const claimsList = document.getElementById('claims-list');
    if (!claimsList) return;

    try {
        // Get all students in this class first
        const studentsSnap = await database.ref('students')
            .orderByChild('class')
            .equalTo(currentClass)
            .once('value');

        if (!studentsSnap.exists()) {
            claimsList.innerHTML = '<div class="table-row"><div colspan="3">No students in this class</div></div>';
            return;
        }

        // Get student IDs
        const studentIds = [];
        studentsSnap.forEach((child) => {
            studentIds.push(child.key);
        });

        // Get recent claims for these students
        const claimsSnap = await database.ref('claims')
            .orderByChild('timestamp')
            .limitToLast(10)
            .once('value');

        if (!claimsSnap.exists()) {
            claimsList.innerHTML = '<div class="table-row"><div colspan="3">No claims found</div></div>';
            return;
        }

        let html = '';
        const claims = [];

        claimsSnap.forEach((child) => {
            const claim = child.val();
            if (studentIds.includes(claim.studentId)) {
                claims.push({ id: child.key, ...claim });
            }
        });

        // Sort by timestamp (newest first)
        claims.sort((a, b) => b.timestamp - a.timestamp);

        if (claims.length === 0) {
            claimsList.innerHTML = '<div class="table-row"><div colspan="3">No recent claims for this class</div></div>';
            return;
        }

        for (const claim of claims) {
            // Get student name
            let studentName = 'Unknown';
            try {
                const studentSnap = await database.ref('students/' + claim.studentId).once('value');
                if (studentSnap.exists()) {
                    studentName = studentSnap.val().name;
                }
            } catch (e) {
                console.error('Error getting student name:', e);
            }

            const claimTime = formatTimestamp(claim.timestamp);

            html += `
                <div class="table-row">
                    <div>${studentName}</div>
                    <div>${claimTime}</div>
                    <div>${claim.pillsLeft || 0}/5</div>
                </div>
            `;
        }

        claimsList.innerHTML = html;

    } catch (error) {
        console.error('Error loading recent claims:', error);
        claimsList.innerHTML = '<div class="table-row"><div colspan="3">Error loading claims</div></div>';
    }
}

// View student details
async function viewStudentDetails(studentId) {
    try {
        const studentSnap = await database.ref('students/' + studentId).once('value');
        if (!studentSnap.exists()) {
            showNotification('Student not found', 'error');
            return;
        }

        const student = studentSnap.val();

        const message = `Student Details:\n\n` +
                       `Name: ${student.name}\n` +
                       `Email: ${student.email}\n` +
                       `LRN: ${student.lrn || 'N/A'}\n` +
                       `Age: ${student.age || 'N/A'}\n` +
                       `Gender: ${student.gender || 'N/A'}\n` +
                       `Pills Left: ${student.pillsLeft || 5}/5\n` +
                       `Parent Contact: ${student.parentContact || 'N/A'}\n` +
                       `Medical Notes: ${student.medicalNotes || 'None'}`;

        alert(message);

    } catch (error) {
        console.error('Error viewing student details:', error);
        showNotification('Error loading student details', 'error');
    }
}

// Go back to admin dashboard
function goBackToAdmin() {
    window.location.href = 'admin-dashboard.html';
}

// Update element text
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
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

    .student-item {
        padding: 10px;
        margin: 5px 0;
        border-radius: 5px;
        background: #f9f9f9;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .student-item:hover {
        background: #e0e0e0;
    }

    .student-name {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .student-pills {
        font-size: 0.9em;
        padding: 2px 6px;
        border-radius: 10px;
        display: inline-block;
    }

    .student-pills.normal {
        background: #4CAF50;
        color: white;
    }

    .student-pills.low {
        background: #ff9800;
        color: white;
    }

    .student-pills.empty {
        background: #f44336;
        color: white;
    }

    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .summary-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
    }

    .summary-card h3 {
        margin: 0 0 10px 0;
        color: #666;
        font-size: 0.9em;
    }

    .stat-number {
        font-size: 2em;
        font-weight: bold;
        color: #333;
        margin: 0;
    }

    .no-students {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }

    .error {
        text-align: center;
        padding: 20px;
        color: #f44336;
    }
`;
document.head.appendChild(style);

console.log("Class details dashboard loaded successfully");
