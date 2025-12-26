/**
 * Department Module - Department dashboard with full CRUD on batches and students
 * Scoped to the department level only
 */

const Department = {
    topics: [],
    batches: [],
    students: [],
    activeTab: 'topics',
    editingTopicId: null,
    editingBatchId: null,
    editingStudentId: null,

    /**
     * Load department dashboard
     */
    async load() {
        try {
            this.activeTab = 'topics';
            this.loadTopics();
            this.setupTabHandlers();
        } catch (error) {
            console.error('Department load error:', error);
            Utils.showMessage('departmentMessage', 'Failed to load department dashboard', 'error');
        }
    },

    /**
     * Setup tab click handlers
     */
    setupTabHandlers() {
        const tabs = document.querySelectorAll('[data-dept-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-dept-tab');
                this.switchTab(tabName);
            });
        });
    },

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Hide all content
        document.querySelectorAll('[data-dept-content]').forEach(el => {
            el.style.display = 'none';
        });

        // Deactivate all tabs
        document.querySelectorAll('[data-dept-tab]').forEach(el => {
            el.classList.remove('active');
        });

        // Show selected content
        const content = document.querySelector(`[data-dept-content="${tabName}"]`);
        if (content) {
            content.style.display = 'block';
        }

        // Activate selected tab
        const tab = document.querySelector(`[data-dept-tab="${tabName}"]`);
        if (tab) {
            tab.classList.add('active');
        }

        this.activeTab = tabName;

        // Load data for tab
        switch (tabName) {
            case 'topics':
                this.loadTopics();
                break;
            case 'questions':
                Questions.load();
                break;
            case 'notes':
                Notes.load();
                break;
            case 'batches':
                this.loadBatches();
                break;
            case 'students':
                this.loadStudents();
                break;
        }
    },

    /**
     * Load topics
     */
    async loadTopics() {
        try {
            const response = await Utils.apiRequest('/department/topics');
            this.topics = response.data?.topics || response.topics || [];
            this.renderTopics();
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Failed to load topics', 'error');
        }
    },

    /**
     * Render topics
     */
    renderTopics() {
        const container = document.getElementById('topicsList');
        if (!container) return;

        if (!this.topics || this.topics.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No topics found</div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.topics.map(t => `
                        <tr>
                            <td>${Utils.escapeHtml(t.name)}</td>
                            <td>${Utils.escapeHtml((t.description || '').substring(0, 100))}</td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="Department.editTopic('${t.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="Department.deleteTopic('${t.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
    },

    /**
     * Open create topic modal
     */
    openTopicModal() {
        this.editingTopicId = null;
        document.getElementById('topicName').value = '';
        document.getElementById('topicDescription').value = '';
        document.querySelector('#topicModal .modal-header h3').textContent = 'Add Topic';
        document.querySelector('#topicModal [type="submit"]').textContent = 'Create Topic';
        UI.openModal('topicModal');
    },

    /**
     * Edit topic
     */
    async editTopic(id) {
        try {
            const response = await Utils.apiRequest(`/department/topics/${id}`);
            const topic = response.data?.topic || response.topic || {};

            document.getElementById('topicName').value = topic.name || '';
            document.getElementById('topicDescription').value = topic.description || '';

            this.editingTopicId = id;
            document.querySelector('#topicModal .modal-header h3').textContent = 'Edit Topic';
            document.querySelector('#topicModal [type="submit"]').textContent = 'Update Topic';
            UI.openModal('topicModal');
        } catch (error) {
            Utils.alert('Failed to load topic: ' + error.message);
        }
    },

    /**
     * Delete topic
     */
    async deleteTopic(id) {
        if (!Utils.confirm('Delete this topic and all related data?')) return;

        try {
            await Utils.apiRequest(`/department/topics/${id}`, { method: 'DELETE' });
            this.loadTopics();
            Utils.showMessage('departmentMessage', 'Topic deleted', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Save topic
     */
    async saveTopic() {
        const name = document.getElementById('topicName').value.trim();
        const description = document.getElementById('topicDescription').value.trim();

        if (!name) {
            Utils.alert('Topic name is required');
            return;
        }

        try {
            const payload = { name, description };
            const url = this.editingTopicId
                ? `/department/topics/${this.editingTopicId}`
                : '/department/topics';

            const method = this.editingTopicId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadTopics();
            UI.closeModal('topicModal');
            Utils.showMessage('departmentMessage',
                this.editingTopicId ? 'Topic updated' : 'Topic created',
                'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    /**
     * Load batches
     */
    async loadBatches() {
        try {
            const response = await Utils.apiRequest('/department/batches');
            this.batches = response.data?.batches || response.batches || [];
            this.renderBatches();
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Failed to load batches', 'error');
        }
    },

    /**
     * Render batches table with full CRUD
     */
    renderBatches() {
        const container = document.getElementById('departmentBatchesList');
        if (!container) return;

        if (!this.batches || this.batches.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No batches found</div>';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-primary" onclick="Department.openAddBatchModal()" style="margin-bottom: 1rem;">+ Add Batch</button>
            <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Batch Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.batches.map(b => `
                        <tr>
                            <td>${Utils.escapeHtml(b.batch_name)}</td>
                            <td>${Utils.escapeHtml(b.email)}</td>
                            <td>
                                ${!b.is_disabled ?
                '<span class="badge badge-success">Enabled</span>' :
                '<span class="badge badge-secondary">Disabled</span>'
            }
                            </td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="Department.editBatch('${b.id}')">Edit</button>
                                ${!b.is_disabled ?
                `<button class="btn btn-sm btn-warning" onclick="Department.disableBatch('${b.id}')">Disable</button>` :
                `<button class="btn btn-sm btn-success" onclick="Department.enableBatch('${b.id}')">Enable</button>`
            }
                                <button class="btn btn-sm btn-danger" onclick="Department.deleteBatch('${b.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
    },

    /**
     * Open add batch modal
     */
    openAddBatchModal() {
        document.getElementById('departmentBatchName').value = '';
        document.getElementById('departmentBatchEmail').value = '';
        document.getElementById('departmentBatchPassword').value = '';
        this.editingBatchId = null;
        document.querySelector('#departmentBatchModal .modal-header h3').textContent = 'Add Batch';
        document.querySelector('#departmentBatchModal [type="submit"]').textContent = 'Create Batch';
        UI.openModal('departmentBatchModal');
    },

    /**
     * Edit batch
     */
    async editBatch(id) {
        try {
            const response = await Utils.apiRequest(`/department/batches/${id}`);
            const batch = response.data?.batch || response.batch || {};

            document.getElementById('departmentBatchName').value = batch.batch_name || '';
            document.getElementById('departmentBatchEmail').value = batch.email || '';
            document.getElementById('departmentBatchPassword').value = '';

            this.editingBatchId = id;
            document.querySelector('#departmentBatchModal .modal-header h3').textContent = 'Edit Batch';
            document.querySelector('#departmentBatchModal [type="submit"]').textContent = 'Update Batch';
            UI.openModal('departmentBatchModal');
        } catch (error) {
            Utils.alert('Failed to load batch: ' + error.message);
        }
    },

    /**
     * Delete batch
     */
    async deleteBatch(id) {
        if (!Utils.confirm('Delete this batch permanently?')) return;

        try {
            await Utils.apiRequest(`/department/batches/${id}`, { method: 'DELETE' });
            this.loadBatches();
            Utils.showMessage('departmentMessage', 'Batch deleted', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Disable batch
     */
    async disableBatch(id) {
        if (!Utils.confirm('Disable this batch? All students in this batch will also be disabled.')) return;

        try {
            await Utils.apiRequest(`/department/batches/${id}/disable`, { method: 'POST' });
            this.loadBatches();
            Utils.showMessage('departmentMessage', 'Batch disabled', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Disable failed: ' + error.message, 'error');
        }
    },

    /**
     * Enable batch
     */
    async enableBatch(id) {
        try {
            await Utils.apiRequest(`/department/batches/${id}/enable`, { method: 'POST' });
            this.loadBatches();
            Utils.showMessage('departmentMessage', 'Batch enabled', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Enable failed: ' + error.message, 'error');
        }
    },

    /**
     * Save batch
     */
    async saveBatch() {
        const name = document.getElementById('departmentBatchName').value.trim();
        const email = document.getElementById('departmentBatchEmail').value.trim();
        const password = document.getElementById('departmentBatchPassword').value.trim();

        if (!Utils.isValidString(name, 2)) {
            Utils.alert('Batch name must be at least 2 characters');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.alert('Please enter a valid email address');
            return;
        }

        if (!this.editingBatchId && !Utils.isValidPassword(password)) {
            Utils.alert('Password must be at least 8 characters with letters and numbers');
            return;
        }

        try {
            const payload = { batch_name: name, email, password };
            const url = this.editingBatchId
                ? `/department/batches/${this.editingBatchId}`
                : '/department/batches';

            const method = this.editingBatchId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadBatches();
            UI.closeModal('departmentBatchModal');
            Utils.showMessage('departmentMessage',
                this.editingBatchId ? 'Batch updated' : 'Batch created',
                'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    // ============================================================================
    // STUDENTS SECTION
    // ============================================================================

    /**
     * Load students
     */
    async loadStudents() {
        try {
            const response = await Utils.apiRequest('/department/students');
            this.students = response.data?.students || response.students || [];
            // Ensure batches are loaded for dropdown
            if (this.batches.length === 0) {
                await this.loadBatches();
            }
            this.renderStudents();
        } catch (error) {
            console.error('Load students error:', error);
            Utils.showMessage('departmentMessage', 'Failed to load students', 'error');
        }
    },

    /**
     * Render students table
     */
    renderStudents() {
        const container = document.getElementById('departmentStudentsList');
        if (!container) return;

        if (!this.students || this.students.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No students found</div>';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-primary" onclick="Department.openAddStudentModal()" style="margin-bottom: 1rem;">+ Add Student</button>
            <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Batch</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.students.map(s => `
                        <tr>
                            <td>${Utils.escapeHtml(s.username || s.name || 'N/A')}</td>
                            <td>${Utils.escapeHtml(s.email)}</td>
                            <td>${Utils.escapeHtml(this.findBatchNameById(s.batch_id))}</td>
                            <td>
                                ${!s.is_disabled ?
                '<span class="badge badge-success">Enabled</span>' :
                '<span class="badge badge-secondary">Disabled</span>'
            }
                            </td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="Department.editStudent('${s.id}')">Edit</button>
                                ${!s.is_disabled ?
                `<button class="btn btn-sm btn-warning" onclick="Department.disableStudent('${s.id}')">Disable</button>` :
                `<button class="btn btn-sm btn-success" onclick="Department.enableStudent('${s.id}')">Enable</button>`
            }
                                <button class="btn btn-sm btn-danger" onclick="Department.deleteStudent('${s.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
    },

    /**
     * Find batch name by ID
     */
    findBatchNameById(batchId) {
        if (!batchId) return '';
        const batch = this.batches.find(b => b.id === batchId);
        return batch ? batch.batch_name : '';
    },

    /**
     * Open add student modal
     */
    openAddStudentModal() {
        document.getElementById('departmentStudentBatch').value = '';
        document.getElementById('departmentStudentUsername').value = '';
        document.getElementById('departmentStudentEmail').value = '';
        document.getElementById('departmentStudentPassword').value = '';
        this.editingStudentId = null;
        this.populateStudentBatchSelect();
        document.querySelector('#departmentStudentModal .modal-header h3').textContent = 'Add Student';
        document.querySelector('#departmentStudentModal [type="submit"]').textContent = 'Create Student';
        UI.openModal('departmentStudentModal');
    },

    /**
     * Edit student
     */
    async editStudent(id) {
        try {
            const response = await Utils.apiRequest(`/department/students/${id}`);
            const student = response.data?.student || response.student || {};

            this.populateStudentBatchSelect();

            document.getElementById('departmentStudentBatch').value = student.batch_id || '';
            document.getElementById('departmentStudentUsername').value = student.username || student.name || '';
            document.getElementById('departmentStudentEmail').value = student.email || '';
            document.getElementById('departmentStudentPassword').value = '';

            this.editingStudentId = id;
            document.querySelector('#departmentStudentModal .modal-header h3').textContent = 'Edit Student';
            document.querySelector('#departmentStudentModal [type="submit"]').textContent = 'Update Student';
            UI.openModal('departmentStudentModal');
        } catch (error) {
            Utils.alert('Failed to load student: ' + error.message);
        }
    },

    /**
     * Delete student
     */
    async deleteStudent(id) {
        if (!Utils.confirm('Delete this student permanently?')) return;

        try {
            await Utils.apiRequest(`/department/students/${id}`, { method: 'DELETE' });
            this.loadStudents();
            Utils.showMessage('departmentMessage', 'Student deleted', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Disable student
     */
    async disableStudent(id) {
        if (!Utils.confirm('Disable this student? They will not be able to log in.')) return;

        try {
            await Utils.apiRequest(`/department/students/${id}/disable`, { method: 'POST' });
            this.loadStudents();
            Utils.showMessage('departmentMessage', 'Student disabled', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Disable failed: ' + error.message, 'error');
        }
    },

    /**
     * Enable student
     */
    async enableStudent(id) {
        try {
            await Utils.apiRequest(`/department/students/${id}/enable`, { method: 'POST' });
            this.loadStudents();
            Utils.showMessage('departmentMessage', 'Student enabled', 'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Enable failed: ' + error.message, 'error');
        }
    },

    /**
     * Populate batch dropdown for student modal
     */
    populateStudentBatchSelect() {
        const select = document.getElementById('departmentStudentBatch');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Batch --</option>' +
            this.batches.map(b => `<option value="${b.id}">${Utils.escapeHtml(b.batch_name)}</option>`).join('');
    },

    /**
     * Save student
     */
    async saveStudent() {
        const username = document.getElementById('departmentStudentUsername').value.trim();
        const email = document.getElementById('departmentStudentEmail').value.trim();
        const batchId = document.getElementById('departmentStudentBatch').value;
        const password = document.getElementById('departmentStudentPassword').value.trim();

        if (!Utils.isValidString(username, 2)) {
            Utils.alert('Username must be at least 2 characters');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.alert('Please enter a valid email address');
            return;
        }

        if (!batchId) {
            Utils.alert('Please select a batch');
            return;
        }

        if (!this.editingStudentId && !Utils.isValidPassword(password)) {
            Utils.alert('Password must be at least 8 characters with letters and numbers');
            return;
        }

        try {
            const payload = { username, email, batch_id: batchId, password };
            const url = this.editingStudentId
                ? `/department/students/${this.editingStudentId}`
                : '/department/students';

            const method = this.editingStudentId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadStudents();
            UI.closeModal('departmentStudentModal');
            Utils.showMessage('departmentMessage',
                this.editingStudentId ? 'Student updated' : 'Student created',
                'success');
        } catch (error) {
            Utils.showMessage('departmentMessage', 'Save failed: ' + error.message, 'error');
        }
    }
};
