// MARGA - Math Assessment Recognition & Grading Automation
// Main frontend application

// Global state
let allProblems = [];
let allStudents = [];
let allTests = [];

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    // Load data for the tab
    if (tabName === 'students') {
        loadStudents();
    } else if (tabName === 'trash') {
        loadTrash();
    } else if (tabName === 'problems') {
        loadProblems();
    } else if (tabName === 'tests') {
        loadTests();
        loadTestsForScanning();
    } else if (tabName === 'scan') {
        loadTestsForScanning();
    } else if (tabName === 'results') {
        loadTestsForResults();
    }
}

// ============================================================================
// STUDENTS TAB
// ============================================================================

document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentData = {
        firstName: document.getElementById('student-firstname').value.trim(),
        lastName: document.getElementById('student-lastname').value.trim(),
        classLevel: parseInt(document.getElementById('student-class').value),
        email: document.getElementById('student-email').value.trim() || null
    };

    try {
        const response = await fetch('/api/students/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (result.success) {
            showResult('student-result',
                `✅ Студент зарегистрирован! Номер: ${result.displayId}`,
                'success');
            document.getElementById('student-form').reset();
            loadStudents();
        } else {
            showResult('student-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showResult('student-result', `❌ Ошибка: ${error.message}`, 'error');
    }
});

async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        const result = await response.json();

        if (result.success) {
            allStudents = result.students;
            displayStudents(allStudents);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('students-list');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет студентов</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.displayId}</td>
            <td>${student.firstName}</td>
            <td>${student.lastName}</td>
            <td>${student.classLevel} класс</td>
            <td>${student.email || '-'}</td>
            <td>
                <button class="btn btn-warning btn-small" onclick='editStudent(${JSON.stringify(student)})'>
                    ✏️ Изменить
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteStudent('${student.id}')">
                    🗑️ Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

function searchStudents() {
    const query = document.getElementById('student-search').value.toLowerCase();
    const filtered = allStudents.filter(s =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.displayId.toLowerCase().includes(query)
    );
    displayStudents(filtered);
}

// Edit student modal
function editStudent(student) {
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-firstname').value = student.firstName;
    document.getElementById('edit-student-lastname').value = student.lastName;
    document.getElementById('edit-student-class').value = student.classLevel;
    document.getElementById('edit-student-email').value = student.email || '';

    document.getElementById('edit-modal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target == modal) {
        closeEditModal();
    }
}

// Handle edit form submission
document.getElementById('edit-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = document.getElementById('edit-student-id').value;
    const updateData = {
        firstName: document.getElementById('edit-student-firstname').value.trim(),
        lastName: document.getElementById('edit-student-lastname').value.trim(),
        classLevel: parseInt(document.getElementById('edit-student-class').value),
        email: document.getElementById('edit-student-email').value.trim() || null
    };

    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Данные студента обновлены успешно!');
            closeEditModal();
            loadStudents();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
});

// Delete student (move to trash)
async function deleteStudent(studentId) {
    if (!confirm('Вы уверены, что хотите удалить этого студента? Студент будет перемещен в корзину.')) {
        return;
    }

    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Студент перемещен в корзину');
            loadStudents();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ============================================================================
// TRASH TAB
// ============================================================================

async function loadTrash() {
    try {
        const response = await fetch('/api/students/trash/all');
        const result = await response.json();

        if (result.success) {
            displayTrash(result.students);
            updateTrashStats(result.count);
        }
    } catch (error) {
        console.error('Error loading trash:', error);
    }
}

function displayTrash(students) {
    const tbody = document.getElementById('trash-list');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Корзина пуста</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.displayId}</td>
            <td>${student.firstName}</td>
            <td>${student.lastName}</td>
            <td>${student.classLevel} класс</td>
            <td>${student.email || '-'}</td>
            <td>${new Date(student.deletedAt).toLocaleString('ru-RU')}</td>
            <td>
                <button class="btn btn-success btn-small" onclick="restoreStudent('${student.id}')">
                    ♻️ Восстановить
                </button>
                <button class="btn btn-danger btn-small" onclick="permanentlyDeleteStudent('${student.id}')">
                    ❌ Удалить навсегда
                </button>
            </td>
        </tr>
    `).join('');
}

function updateTrashStats(count) {
    document.getElementById('trash-stats').textContent =
        `Всего в корзине: ${count} студентов`;
}

// Restore student from trash
async function restoreStudent(studentId) {
    if (!confirm('Восстановить этого студента?')) {
        return;
    }

    try {
        const response = await fetch(`/api/students/trash/${studentId}/restore`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Студент восстановлен успешно!');
            loadTrash();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// Permanently delete student
async function permanentlyDeleteStudent(studentId) {
    if (!confirm('⚠️ ВНИМАНИЕ! Вы уверены, что хотите НАВСЕГДА удалить этого студента? Это действие НЕОБРАТИМО!')) {
        return;
    }

    try {
        const response = await fetch(`/api/students/trash/${studentId}/permanent`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Студент удален навсегда');
            loadTrash();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// Clean all trash
async function cleanAllTrash() {
    if (!confirm('⚠️ ВНИМАНИЕ! Вы уверены, что хотите ОЧИСТИТЬ ВСЮ КОРЗИНУ? Все студенты без результатов тестов будут удалены НАВСЕГДА! Это действие НЕОБРАТИМО!')) {
        return;
    }

    try {
        const response = await fetch('/api/students/trash/clean-all', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ ${result.message}`);
            loadTrash();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ============================================================================
// PROBLEMS TAB
// ============================================================================

document.getElementById('problem-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const problemData = {
        textRu: document.getElementById('problem-text-ru').value.trim(),
        textKz: document.getElementById('problem-text-kz').value.trim() || null,
        textEn: document.getElementById('problem-text-en').value.trim() || null,
        correctAnswer: document.getElementById('problem-correct').value.trim(),
        wrongAnswers: [
            document.getElementById('problem-wrong-1').value.trim(),
            document.getElementById('problem-wrong-2').value.trim(),
            document.getElementById('problem-wrong-3').value.trim()
        ],
        classLevel: parseInt(document.getElementById('problem-class').value),
        difficulty: document.getElementById('problem-difficulty').value,
        quarter: document.getElementById('problem-quarter').value || null,
        tags: document.getElementById('problem-tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .slice(0, 5),
        formula: document.getElementById('problem-formula').value.trim() || null
    };

    try {
        const response = await fetch('/api/problems', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(problemData)
        });

        const result = await response.json();

        if (result.success) {
            showResult('problem-result', '✅ Задача создана успешно!', 'success');
            document.getElementById('problem-form').reset();
            loadProblems();
        } else {
            showResult('problem-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showResult('problem-result', `❌ Ошибка: ${error.message}`, 'error');
    }
});

async function loadProblems() {
    try {
        const response = await fetch('/api/problems/search');
        const result = await response.json();

        if (result.success) {
            allProblems = result.problems;
            displayProblems(allProblems);
        }
    } catch (error) {
        console.error('Error loading problems:', error);
    }
}

function displayProblems(problems) {
    const container = document.getElementById('problems-list');

    if (problems.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет задач</p>';
        return;
    }

    container.innerHTML = problems.map(problem => {
        const difficultyLabel = {
            'easy': 'Легкая',
            'medium': 'Средняя',
            'hard': 'Сложная'
        }[problem.difficultyLevel];

        const tagsHtml = problem.tags && problem.tags.length > 0
            ? `<div class="tags">${problem.tags.map(tag =>
                `<span class="tag">${tag}</span>`).join('')}</div>`
            : '';

        return `
            <div class="problem-card">
                <div class="problem-header">
                    <span class="problem-class">Класс ${problem.classLevel}</span>
                    <span class="problem-difficulty ${problem.difficultyLevel}">${difficultyLabel}</span>
                </div>
                <p class="problem-text">${problem.problemText.ru}</p>
                ${problem.formula ? `<p class="problem-formula">${problem.formula}</p>` : ''}
                <div class="problem-answers">
                    <p><strong>Правильный:</strong> ${problem.correctAnswer}</p>
                    <p><strong>Неправильные:</strong> ${problem.wrongAnswers.join(', ')}</p>
                </div>
                ${tagsHtml}
                <div class="problem-meta">
                    <small>Использований: ${problem.usageCount || 0}</small>
                </div>
            </div>
        `;
    }).join('');
}

function filterProblems() {
    const classLevel = document.getElementById('filter-class').value;
    const difficulty = document.getElementById('filter-difficulty').value;

    let filtered = allProblems;

    if (classLevel) {
        filtered = filtered.filter(p => p.classLevel === parseInt(classLevel));
    }

    if (difficulty) {
        filtered = filtered.filter(p => p.difficultyLevel === difficulty);
    }

    displayProblems(filtered);
}

// ============================================================================
// TESTS TAB
// ============================================================================

document.getElementById('test-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const difficulties = Array.from(document.querySelectorAll('.test-difficulty:checked'))
        .map(cb => cb.value);

    const testConfig = {
        testName: document.getElementById('test-name').value.trim(),
        classLevel: parseInt(document.getElementById('test-class').value),
        numberOfQuestions: parseInt(document.getElementById('test-questions').value),
        language: document.getElementById('test-language').value,
        difficultyLevels: difficulties.length > 0 ? difficulties : ['easy', 'medium', 'hard'],
        tags: document.getElementById('test-tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
    };

    try {
        showResult('test-result', '⏳ Генерация теста... Это может занять минуту.', 'info');

        const response = await fetch('/api/tests/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testConfig)
        });

        const result = await response.json();

        if (result.success) {
            const test = result.test;
            showResult('test-result', `
                ✅ Тест сгенерирован успешно!<br>
                <a href="${test.testPdfUrl}" target="_blank">📄 Скачать вопросы</a><br>
                <a href="${test.answerSheetUrl}" target="_blank">📋 Скачать бланк ответов</a><br>
                <a href="${test.answerKeyUrl}" target="_blank">🔑 Скачать ключ ответов</a>
            `, 'success');
            document.getElementById('test-form').reset();
            loadTests();
        } else {
            showResult('test-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showResult('test-result', `❌ Ошибка: ${error.message}`, 'error');
    }
});

async function loadTests() {
    try {
        const response = await fetch('/api/tests');
        const result = await response.json();

        if (result.success) {
            allTests = result.tests;
            displayTests(allTests);
        }
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

function displayTests(tests) {
    const container = document.getElementById('tests-list');

    if (tests.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет созданных тестов</p>';
        return;
    }

    container.innerHTML = tests.map(test => {
        const createdDate = new Date(test.createdAt).toLocaleDateString('ru-RU');

        return `
            <div class="test-card">
                <h3>${test.testName}</h3>
                <div class="test-info">
                    <p><strong>Класс:</strong> ${test.classLevel}</p>
                    <p><strong>Вопросов:</strong> ${test.totalQuestions}</p>
                    <p><strong>Создан:</strong> ${createdDate}</p>
                </div>
                <div class="test-downloads">
                    ${test.pdfUrl ? `<a href="${test.pdfUrl}" target="_blank">📄 Вопросы</a>` : ''}
                    ${test.answerSheetUrl ? `<a href="${test.answerSheetUrl}" target="_blank">📋 Бланк</a>` : ''}
                    ${test.answerKeyUrl ? `<a href="${test.answerKeyUrl}" target="_blank">🔑 Ключ</a>` : ''}
                </div>
                <div class="test-downloads">
                    <a href="#" onclick="regeneratePDFs('${test.id}'); return false;">🔄 Перегенерировать PDFs</a>
                    <a href="#" onclick="deleteTest('${test.id}'); return false;" style="background: #dc2626; color: white;">🗑️ Удалить</a>
                </div>
            </div>
        `;
    }).join('');
}

async function regeneratePDFs(testId) {
    if (!confirm('Вы уверены, что хотите перегенерировать все PDFs для этого теста?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tests/${testId}/regenerate-pdfs`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showResult('test-result', '✅ PDFs успешно перегенерированы!', 'success');
            await loadTests(); // Reload tests to show updated URLs
        } else {
            showResult('test-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error regenerating PDFs:', error);
        showResult('test-result', '❌ Ошибка при перегенерации PDFs', 'error');
    }
}

async function deleteTest(testId) {
    if (!confirm('Вы уверены, что хотите удалить этот тест? Это действие необратимо.')) {
        return;
    }

    try {
        const response = await fetch(`/api/tests/${testId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showResult('test-result', '✅ Тест успешно удален', 'success');
            await loadTests(); // Reload tests
        } else {
            showResult('test-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting test:', error);
        showResult('test-result', '❌ Ошибка при удалении теста', 'error');
    }
}

// ============================================================================
// SCAN TAB
// ============================================================================

async function loadTestsForScanning() {
    try {
        const response = await fetch('/api/tests');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('scan-test');
            select.innerHTML = '<option value="">Выберите тест</option>' +
                result.tests.map(test =>
                    `<option value="${test.id}">${test.testName} (${test.classLevel} класс)</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

document.getElementById('scan-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('scan-preview').innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;">
            `;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('scan-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const testId = document.getElementById('scan-test').value;
    const fileInput = document.getElementById('scan-file');

    if (!testId || !fileInput.files[0]) {
        showResult('scan-result', '❌ Выберите тест и загрузите файл', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('testId', testId);
    formData.append('answerSheet', fileInput.files[0]);

    try {
        showResult('scan-result', '⏳ Обработка бланка... Это может занять 30 секунд.', 'info');

        const response = await fetch('/api/results/scan', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const cachedText = result.cached ? '(из кэша) ' : '';
            const confidence = result.scanConfidence
                ? `<p>Уверенность сканирования: ${(result.scanConfidence * 100).toFixed(1)}%</p>`
                : '';

            showResult('scan-result', `
                ✅ Бланк обработан успешно! ${cachedText}<br>
                <strong>Студент:</strong> ${result.result.student_name} (${result.result.display_id})<br>
                <strong>Результат:</strong> ${result.result.score}/${result.result.total_questions} (${result.result.percentage.toFixed(1)}%)<br>
                ${confidence}
                ${result.result.needs_review ? '<p style="color: orange;">⚠️ Требуется ручная проверка</p>' : ''}
            `, 'success');

            document.getElementById('scan-form').reset();
            document.getElementById('scan-preview').innerHTML = '';
        } else {
            showResult('scan-result', `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showResult('scan-result', `❌ Ошибка: ${error.message}`, 'error');
    }
});

// ============================================================================
// RESULTS TAB
// ============================================================================

async function loadTestsForResults() {
    try {
        const response = await fetch('/api/tests');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('results-test');
            select.innerHTML = '<option value="">Выберите тест</option>' +
                result.tests.map(test =>
                    `<option value="${test.id}">${test.testName} (${test.classLevel} класс)</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

async function loadResults() {
    const testId = document.getElementById('results-test').value;

    if (!testId) {
        document.getElementById('results-display').innerHTML =
            '<p class="empty-state">Выберите тест для просмотра результатов</p>';
        return;
    }

    try {
        const [resultsResponse, statsResponse] = await Promise.all([
            fetch(`/api/results/test/${testId}`),
            fetch(`/api/tests/${testId}/stats`)
        ]);

        const resultsData = await resultsResponse.json();
        const statsData = await statsResponse.json();

        if (resultsData.success && statsData.success) {
            displayResults(resultsData.results, statsData.stats);
        }
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('results-display').innerHTML =
            '<p class="empty-state">Ошибка загрузки результатов</p>';
    }
}

function displayResults(results, stats) {
    const container = document.getElementById('results-display');

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">Нет результатов для этого теста</p>';
        return;
    }

    // Class statistics
    const statsHtml = `
        <div class="stats-summary">
            <h3>Статистика класса</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSubmissions}</div>
                    <div class="stat-label">Всего сдано</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.averageScore.toFixed(1)}%</div>
                    <div class="stat-label">Средний балл</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highestScore.toFixed(1)}%</div>
                    <div class="stat-label">Максимум</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.lowestScore.toFixed(1)}%</div>
                    <div class="stat-label">Минимум</div>
                </div>
            </div>
        </div>
    `;

    // Individual results
    const resultsHtml = results.map(result => {
        const submittedDate = new Date(result.submittedAt).toLocaleString('ru-RU');
        const diagnostics = result.diagnostics ?
            (typeof result.diagnostics === 'string' ? JSON.parse(result.diagnostics) : result.diagnostics) : null;

        let diagnosticsHtml = '';
        if (diagnostics && diagnostics.summary) {
            diagnosticsHtml = `
                <div class="diagnostics">
                    <h4>Диагностика:</h4>
                    <ul>
                        ${diagnostics.summary.map(line => `<li>${line}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        return `
            <div class="result-card">
                <div class="result-header">
                    <h4>${result.studentName} (${result.displayId})</h4>
                    <span class="result-score ${result.percentage >= 70 ? 'pass' : 'fail'}">
                        ${result.percentage.toFixed(1)}%
                    </span>
                </div>
                <p><strong>Правильных ответов:</strong> ${result.score}/${result.totalQuestions}</p>
                <p><strong>Дата:</strong> ${submittedDate}</p>
                ${result.needsReview ? '<p style="color: orange;">⚠️ Требует проверки</p>' : ''}
                ${diagnosticsHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = statsHtml + '<div class="results-list">' + resultsHtml + '</div>';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showResult(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, type === 'error' ? 8000 : 5000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    console.log('MARGA система инициализирована');
});
