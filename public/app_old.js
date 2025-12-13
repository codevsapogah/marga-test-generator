// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Activate nav tab
    event.target.classList.add('active');

    // Load data for the tab if needed
    if (tabName === 'students') {
        loadStudents();
    }
}

// Student Management
document.getElementById('student-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('student-firstname').value.trim();
    const lastName = document.getElementById('student-lastname').value.trim();
    const classLevel = document.getElementById('student-class').value;
    const email = document.getElementById('student-email').value.trim();

    try {
        const response = await fetch('/api/students/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                classLevel: parseInt(classLevel),
                email: email || null
            })
        });

        const data = await response.json();

        const resultDiv = document.getElementById('student-result');

        if (data.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <strong>Успех!</strong> Студент зарегистрирован.<br>
                    <strong>Номер студента:</strong> ${data.student.displayId}<br>
                    <strong>Для бланка ответов:</strong> ${data.student.studentId}
                </div>
            `;

            // Reset form
            e.target.reset();

            // Reload students list
            loadStudents();

            // Clear message after 5 seconds
            setTimeout(() => {
                resultDiv.innerHTML = '';
            }, 5000);
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-error">
                    <strong>Ошибка:</strong> ${data.message}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('student-result').innerHTML = `
            <div class="alert alert-error">
                <strong>Ошибка:</strong> Не удалось зарегистрировать студента. ${error.message}
            </div>
        `;
    }
});

// Load all students
async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        const data = await response.json();

        const tbody = document.getElementById('students-list');

        if (data.success && data.students.length > 0) {
            tbody.innerHTML = data.students.map(student => `
                <tr>
                    <td><span class="badge badge-info">${student.displayId}</span></td>
                    <td>${student.firstName}</td>
                    <td>${student.lastName}</td>
                    <td>${student.classLevel}</td>
                    <td>${student.email || '—'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        Студенты не найдены. Зарегистрируйте первого студента выше.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        document.getElementById('students-list').innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Ошибка загрузки студентов
                </td>
            </tr>
        `;
    }
}

// Search students
let searchTimeout;
async function searchStudents() {
    const query = document.getElementById('student-search').value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {
        loadStudents();
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            const tbody = document.getElementById('students-list');

            if (data.success && data.students.length > 0) {
                tbody.innerHTML = data.students.map(student => `
                    <tr>
                        <td><span class="badge badge-info">${student.displayId}</span></td>
                        <td>${student.firstName}</td>
                        <td>${student.lastName}</td>
                        <td>${student.classLevel}</td>
                        <td>${student.email || '—'}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            Студенты не найдены
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Load students on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
});
