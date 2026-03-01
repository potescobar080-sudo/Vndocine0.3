// Student Dashboard Functions
let studentId = null;
let studentData = null;
let isTeacherView = false;

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if teacher is viewing a student dashboard
    const urlParams = new URLSearchParams(window.location.search);
    const viewStudentId = urlParams.get('view');
    const adminStudentId = urlParams.get('admin');
    const className = urlParams.get('class');

    if (adminStudentId) {
        checkAdminViewAccess(adminStudentId);
    } else if (viewStudentId) {
        checkTeacherViewAccess(viewStudentId);
    } else if (className) {
        showStudentSelectionForAdmin(className);
    } else {
        checkStudentAccess();
    }
});

// Check if user is student
async function checkStudentAccess() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const userSnapshot = await database.ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value');

        if (!userSnapshot.exists()) {
            window.location.href = 'index.html';
            return;
        }

        const userData = userSnapshot.val();
        const userId = Object.keys(userData)[0];
        const userInfo = userData[userId];

        if (userInfo.role !== 'student') {
            window.location.href = 'index.html';
            return;
        }

        studentId = userInfo.studentId;

        if (studentId) {
            loadStudentData();
        } else {
            // Find student by email
            const studentSnap = await database.ref('students')
                .orderByChild('email')
                .equalTo(user.email)
                .once('value');

            if (studentSnap.exists()) {
                const studentData = studentSnap.val();
                studentId = Object.keys(studentData)[0];

                // Update user record with studentId
                await database.ref('users/' + userId).update({
                    studentId: studentId
                });

                loadStudentData();
            } else {
                window.location.href = 'index.html';
            }
        }
    });
}

// Check if teacher is viewing student dashboard
async function checkTeacherViewAccess(viewStudentId) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const userSnapshot = await database.ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value');

        if (!userSnapshot.exists()) {
            window.location.href = 'index.html';
            return;
        }

        const userData = userSnapshot.val();
        const userId = Object.keys(userData)[0];
        const userInfo = userData[userId];

        if (userInfo.role !== 'teacher') {
            window.location.href = 'index.html';
            return;
        }

        // Verify teacher has access to this student
        const teacherId = userInfo.teacherId;
        const teacherSnap = await database.ref('teachers/' + teacherId).once('value');

        if (!teacherSnap.exists()) {
            window.location.href = 'index.html';
            return;
        }

        const teacher = teacherSnap.val();
        const studentSnap = await database.ref('students/' + viewStudentId).once('value');

        if (!studentSnap.exists()) {
            window.location.href = 'teacher-dashboard.html';
            return;
        }

        const student = studentSnap.val();

        // Check if student belongs to teacher's class
        if (student.class !== teacher.class) {
            window.location.href = 'teacher-dashboard.html';
            return;
        }

        // Set teacher view mode
        isTeacherView = true;
        studentId = viewStudentId;

        // Update UI for teacher view
        document.querySelector('.sidebar-header h2').textContent = '👁️ Student View';
        document.querySelector('.sidebar-header p').textContent = 'Viewing as Teacher';
        document.getElementById('page-title').textContent = `Viewing ${student.name}'s Dashboard`;

        // Add back button
        const sidebarMenu = document.querySelector('.sidebar-menu');
        const backButton = document.createElement('li');
        backButton.innerHTML = '<a href="#" onclick="goBackToTeacher()" class="logout-btn">⬅️ Back to Teacher Dashboard</a>';
        sidebarMenu.insertBefore(backButton, sidebarMenu.firstChild);

        loadStudentData();
    });
}

// Check if admin is viewing student dashboard
async function checkAdminViewAccess(adminStudentId) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const userSnapshot = await database.ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value');

        if (!userSnapshot.exists()) {
            window.location.href = 'index.html';
            return;
        }

        const userData = userSnapshot.val();
        const userId = Object.keys(userData)[0];
        const userInfo = userData[userId];

        if (userInfo.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        // Verify student exists
        const studentSnap = await database.ref('students/' + adminStudentId).once('value');

        if (!studentSnap.exists()) {
            window.location.href = 'admin-dashboard.html';
            return;
        }

        const student = studentSnap.val();

        // Set admin view mode
        isTeacherView = true; // Reuse the same flag for admin view
        studentId = adminStudentId;

        // Update UI for admin view
        document.querySelector('.sidebar-header h2').textContent = '👁️ Student View';
        document.querySelector('.sidebar-header p').textContent = 'Viewing as Admin';
        document.getElementById('page-title').textContent = `Viewing ${student.name}'s Dashboard`;

        // Add back button
        const sidebarMenu = document.querySelector('.sidebar-menu');
        const backButton = document.createElement('li');
        backButton.innerHTML = '<a href="#" onclick="goBackToAdmin()" class="logout-btn">⬅️ Back to Admin Dashboard</a>';
        sidebarMenu.insertBefore(backButton, sidebarMenu.firstChild);

        loadStudentData();
    });
}

// Load student data
function loadStudentData() {
    if (!studentId) return;
    
    // Load student information
    database.ref('students/' + studentId).on('value', async (snapshot) => {
        if (!snapshot.exists()) {
            window.location.href = 'index.html';
            return;
        }
        
        studentData = snapshot.val();
        
        // Update profile information
        document.getElementById('student-name').textContent = studentData.name;
        document.getElementById('profile-name').textContent = studentData.name;
        document.getElementById('profile-email').textContent = studentData.email;
        document.getElementById('profile-lrn').textContent = studentData.lrn || 'N/A';
        document.getElementById('profile-age').textContent = studentData.age || 'N/A';
        document.getElementById('profile-gender').textContent = studentData.gender || 'N/A';
        document.getElementById('profile-birthdate').textContent = studentData.birthDate || 'N/A';
        document.getElementById('profile-class').textContent = 'Class: ' + (studentData.class || 'N/A');
        document.getElementById('student-class').textContent = 'Class: ' + (studentData.class || 'N/A');
        document.getElementById('profile-parent').textContent = studentData.parentContact || 'N/A';
        
        // Get teacher name
        if (studentData.teacherId) {
            const teacherSnap = await database.ref('teachers/' + studentData.teacherId).once('value');
            if (teacherSnap.exists()) {
                document.getElementById('profile-teacher').textContent = teacherSnap.val().name;
            }
        }
        
        // Update barcode information
        document.getElementById('barcode-name').textContent = studentData.name;
        document.getElementById('barcode-class').textContent = 'Class: ' + (studentData.class || 'N/A');
        document.getElementById('barcode-id').textContent = studentData.barcodeId || 'N/A';
        document.getElementById('barcode-lrn').textContent = studentData.lrn || 'N/A';
        
        if (studentData.qrCode) {
            document.getElementById('barcode-image').src = studentData.qrCode;
        } else if (studentData.barcodeId) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentData.barcodeId)}`;
            document.getElementById('barcode-image').src = qrCodeUrl;
        }
        
        // Update pill counter
        updatePillCounter();
        
        // Load claims
        loadMyClaims();
    });
}

// Update pill counter
function updatePillCounter() {
    if (!studentData) return;
    
    const pillsLeft = studentData.pillsLeft || 5;
    
    // Update pill counter text
    document.getElementById('pills-remaining').textContent = `${pillsLeft}/5`;
    
    // Update visual pills
    const pillVisual = document.getElementById('pill-visual');
    pillVisual.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const pill = document.createElement('div');
        pill.className = 'pill';
        
        if (i < pillsLeft) {
            pill.classList.add('pill-available');
            pill.innerHTML = '💊';
        } else {
            pill.classList.add('pill-used');
            pill.innerHTML = '💊';
        }
        
        pillVisual.appendChild(pill);
    }
    
    // Update last claim
    if (studentData.lastClaim) {
        document.getElementById('last-claim').textContent = formatTimestamp(studentData.lastClaim);
    }
}

// Load student's audit logs
function loadMyClaims() {
    if (!studentId || !studentData) return;

    const claimsList = document.getElementById('my-claims-list');

    database.ref('auditLog').orderByChild('user').equalTo(studentData.name)
        .on('value', (snapshot) => {
            if (!snapshot.exists()) {
                claimsList.innerHTML = '<div class="table-row"><div colspan="3">No audit logs yet.</div></div>';
                document.getElementById('total-claims').textContent = '0 entries';
                document.getElementById('month-claims').textContent = '0 entries';
                return;
            }

            let html = '';
            let totalEntries = 0;
            let monthEntries = 0;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const auditEntries = [];

            snapshot.forEach((child) => {
                const entry = child.val();
                auditEntries.push({ id: child.key, ...entry });
            });

            // Sort by timestamp (newest first)
            auditEntries.sort((a, b) => b.timestamp - a.timestamp);

            for (const entry of auditEntries) {
                totalEntries++;

                // Check if entry is from this month
                const entryDate = new Date(entry.timestamp);
                if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
                    monthEntries++;
                }

                html += `
                    <div class="table-row">
                        <div>${entry.action || 'N/A'}</div>
                        <div>${entry.details || 'N/A'}</div>
                        <div>${formatTimestamp(entry.timestamp)}</div>
                    </div>
                `;
            }

            claimsList.innerHTML = html;
            document.getElementById('total-claims').textContent = `${totalEntries} entries`;
            document.getElementById('month-claims').textContent = `${monthEntries} entries`;
        });
}

// Print barcode
function printBarcode() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Barcode</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .barcode-print { text-align: center; }
                .barcode-print img { max-width: 300px; }
                .student-info { margin: 20px 0; }
                @media print { 
                    button { display: none; } 
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="barcode-print">
                <h2>Vendocine Medication Barcode</h2>
                <div class="student-info">
                    <h3>${studentData.name}</h3>
                    <p>Class: ${studentData.class || 'N/A'}</p>
                    <p>Barcode ID: ${studentData.barcodeId || 'N/A'}</p>
                    <p>LRN: ${studentData.lrn || 'N/A'}</p>
                </div>
                <img src="${document.getElementById('barcode-image').src}" alt="Barcode">
                <p><em>Scan this barcode to claim medication</em></p>
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Download barcode
function downloadBarcode() {
    const link = document.createElement('a');
    link.href = document.getElementById('barcode-image').src;
    link.download = `barcode-${studentData.barcodeId || 'student'}.png`;
    link.click();
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Add active class to clicked menu item
    event.target.classList.add('active');
    
    // Update page title
    const titles = {
        'my-profile': 'My Profile',
        'my-claims': 'My Claims',
        'my-barcode': 'My Barcode'
    };
    
    document.getElementById('page-title').textContent = titles[sectionId] || 'Student Dashboard';
}

// Go back to teacher dashboard
function goBackToTeacher() {
    window.location.href = 'teacher-dashboard.html';
}

// Go back to admin dashboard
function goBackToAdmin() {
    window.location.href = 'admin-dashboard.html';
}

// Show student selection for admin
async function showStudentSelectionForAdmin() {
    try {
        const studentsSnap = await database.ref('students').once('value');

        if (!studentsSnap.exists()) {
            document.querySelector('.main-content').innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>No Students Found</h2>
                    <p>There are no students registered in the system.</p>
                    <button onclick="goBackToAdmin()" class="btn-secondary">Back to Admin Dashboard</button>
                </div>
            `;
            return;
        }

        let studentList = '<div style="max-width: 800px; margin: 0 auto; padding: 20px;">';
        studentList += '<h2>Select a Student to View Dashboard</h2>';
        studentList += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">';

        studentsSnap.forEach((child) => {
            const student = child.val();
            studentList += `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; cursor: pointer; transition: background 0.3s;" onclick="viewStudentAsAdmin('${child.key}')">
                    <h3 style="margin: 0 0 10px 0;">${student.name}</h3>
                    <p style="margin: 5px 0; color: #666;"><strong>Class:</strong> ${student.class || 'N/A'}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>LRN:</strong> ${student.lrn || 'N/A'}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Pills Left:</strong> ${student.pillsLeft || 5}/5</p>
                </div>
            `;
        });

        studentList += '</div>';
        studentList += '<div style="text-align: center; margin-top: 30px;">';
        studentList += '<button onclick="goBackToAdmin()" class="btn-secondary">Back to Admin Dashboard</button>';
        studentList += '</div></div>';

        document.querySelector('.main-content').innerHTML = studentList;

    } catch (error) {
        console.error('Error loading student selection:', error);
        document.querySelector('.main-content').innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>Error Loading Students</h2>
                <p>There was an error loading the student list.</p>
                <button onclick="goBackToAdmin()" class="btn-secondary">Back to Admin Dashboard</button>
            </div>
        `;
    }
}

// View student dashboard as admin
function viewStudentAsAdmin(studentId) {
    window.location.href = `student-dashboard.html?admin=${studentId}`;
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}
