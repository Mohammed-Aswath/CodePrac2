/**
 * College Module - College dashboard with full CRUD on departments, batches, and students
 * Scoped to the college level only
 */

const College = {
    departments: [],
    batches: [],
    students: [],
    performance: [],
    
    activeTab: 'departments',
    editingDepartmentId: null,
    editingBatchId: null,
    editingStudentId: null,

    /**
     * Load college dashboard
     */
    async load() {
        try {
            this.activeTab = 'departments';
            this.setupTabHandlers();
            await this.loadPerformance();
            this.switchTab('departments');
        } catch (error) {
            console.error('College load error:', error);
            Utils.showMessage('collegeMessage', 'Failed to load college dashboard', 'error');
        }
    },

    /**
     * Setup tab click handlers
     */
    setupTabHandlers() {
        const tabs = document.querySelectorAll('[data-college-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-college-tab');
                this.switchTab(tabName);
            });
        });
    },

    /**
     * Switch between tabs
     */
    async switchTab(tabName) {
        // Hide all content
        document.querySelectorAll('[data-college-content]').forEach(el => {
            el.style.display = 'none';
        });

        // Deactivate all tabs
        document.querySelectorAll('[data-college-tab]').forEach(el => {
            el.classList.remove('active');
        });

        // Show selected content
        const content = document.querySelector(`[data-college-content="${tabName}"]`);
        if (content) {
            content.style.display = 'block';
        }

        // Activate selected tab
        const tab = document.querySelector(`[data-college-tab="${tabName}"]`);
        if (tab) {
            tab.classList.add('active');
        }

        this.activeTab = tabName;

        // Load data for tab
        switch (tabName) {
            case 'departments':
                this.loadDepartments();
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
     * Load performance data
     */
    async loadPerformance() {
        try {
            const response = await Utils.apiRequest('/college/performance');
            this.performance = response.data?.performance || response.performance || {};
            this.renderPerformance();
        } catch (error) {
            console.error('Load performance error:', error);
        }
    },

    /**
     * Render performance overview
     */
    renderPerformance() {
        const container = document.getElementById('collegePerformance');
        if (!container || !this.performance) return;

        const totalQuestions = this.performance.total_questions || 0;
        const avgScore = this.performance.avg_score || 0;
        const successRate = this.performance.success_rate || 0;

        container.innerHTML = `
            <div class="grid grid-cols-3">
                <div class="card">
                    <p class="text-secondary">Total Questions</p>
                    <h2>${totalQuestions}</h2>
                </div>
                <div class="card">
                    <p class="text-secondary">Average Score</p>
                    <h2>${Math.round(avgScore)}%</h2>
                </div>
                <div class="card">
                    <p class="text-secondary">Success Rate</p>
                    <h2>${Math.round(successRate)}%</h2>
                </div>
            </div>
        `;
    },

    // ============================================================================
    // DEPARTMENTS SECTION
    // ============================================================================

    /**
     * Load departments
     */
    async loadDepartments() {
        try {
            const response = await Utils.apiRequest('/college/departments');
            this.departments = response.data?.departments || response.departments || [];
            this.renderDepartments();
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Failed to load departments', 'error');
        }
    },

    /**
     * Render departments table
     */
    renderDepartments() {
        const container = document.getElementById('collegeDepartmentsList');
        if (!container) return;

        if (!this.departments || this.departments.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No departments found</div>';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-primary" onclick="College.openAddDepartmentModal()" style="margin-bottom: 1rem;">+ Add Department</button>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.departments.map(d => `
                        <tr>
                            <td>${Utils.escapeHtml(d.name)}</td>
                            <td>${Utils.escapeHtml(d.email)}</td>
                            <td>
                                ${!d.is_disabled ? 
                                    '<span class="badge badge-success">Enabled</span>' : 
                                    '<span class="badge badge-secondary">Disabled</span>'
                                }
                            </td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="College.editDepartment('${d.id}')">Edit</button>
                                ${!d.is_disabled ? 
                                    `<button class="btn btn-sm btn-warning" onclick="College.disableDepartment('${d.id}')">Disable</button>` : 
                                    `<button class="btn btn-sm btn-success" onclick="College.enableDepartment('${d.id}')">Enable</button>`
                                }
                                <button class="btn btn-sm btn-danger" onclick="College.deleteDepartment('${d.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Open add department modal
     */
    openAddDepartmentModal() {
        document.getElementById('collegeDepartmentName').value = '';
        document.getElementById('collegeDepartmentEmail').value = '';
        document.getElementById('collegeDepartmentPassword').value = '';
        this.editingDepartmentId = null;
        document.querySelector('#collegeDepartmentModal .modal-header h3').textContent = 'Add Department';
        document.querySelector('#collegeDepartmentModal [type="submit"]').textContent = 'Create Department';
        UI.openModal('collegeDepartmentModal');
    },

    /**
     * Edit department
     */
    async editDepartment(id) {
        try {
            const response = await Utils.apiRequest(`/college/departments/${id}`);
            const dept = response.data?.department || response.department || {};

            document.getElementById('collegeDepartmentName').value = dept.name || '';
            document.getElementById('collegeDepartmentEmail').value = dept.email || '';
            document.getElementById('collegeDepartmentPassword').value = '';

            this.editingDepartmentId = id;
            document.querySelector('#collegeDepartmentModal .modal-header h3').textContent = 'Edit Department';
            document.querySelector('#collegeDepartmentModal [type="submit"]').textContent = 'Update Department';
            UI.openModal('collegeDepartmentModal');
        } catch (error) {
            Utils.alert('Failed to load department: ' + error.message);
        }
    },

    /**
     * Delete department
     */
    async deleteDepartment(id) {
        if (!Utils.confirm('Delete this department permanently?')) return;

        try {
            await Utils.apiRequest(`/college/departments/${id}`, { method: 'DELETE' });
            this.loadDepartments();
            Utils.showMessage('collegeMessage', 'Department deleted', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Disable department
     */
    async disableDepartment(id) {
        if (!Utils.confirm('Disable this department? All associated batches and students will also be disabled.')) return;

        try {
            await Utils.apiRequest(`/college/departments/${id}/disable`, { method: 'POST' });
            this.loadDepartments();
            Utils.showMessage('collegeMessage', 'Department disabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Disable failed: ' + error.message, 'error');
        }
    },

    /**
     * Enable department
     */
    async enableDepartment(id) {
        try {
            await Utils.apiRequest(`/college/departments/${id}/enable`, { method: 'POST' });
            this.loadDepartments();
            Utils.showMessage('collegeMessage', 'Department enabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Enable failed: ' + error.message, 'error');
        }
    },

    /**
     * Save department
     */
    async saveDepartment() {
        const name = document.getElementById('collegeDepartmentName').value.trim();
        const email = document.getElementById('collegeDepartmentEmail').value.trim();
        const password = document.getElementById('collegeDepartmentPassword').value.trim();

        if (!Utils.isValidString(name, 2)) {
            Utils.alert('Department name must be at least 2 characters');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.alert('Please enter a valid email address');
            return;
        }

        if (!this.editingDepartmentId && !Utils.isValidPassword(password)) {
            Utils.alert('Password must be at least 8 characters with letters and numbers');
            return;
        }

        try {
            const payload = { name, email, password };
            const url = this.editingDepartmentId 
                ? `/college/departments/${this.editingDepartmentId}`
                : '/college/departments';
            
            const method = this.editingDepartmentId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadDepartments();
            UI.closeModal('collegeDepartmentModal');
            Utils.showMessage('collegeMessage', 
                this.editingDepartmentId ? 'Department updated' : 'Department created', 
                'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    // ============================================================================
    // BATCHES SECTION
    // ============================================================================

    /**
     * Load batches
     */
    async loadBatches() {
        try {
            const response = await Utils.apiRequest('/college/batches');
            this.batches = response.data?.batches || response.batches || [];
            // Load departments for dropdown
            await this.loadDepartmentsForDropdown();
            this.renderBatches();
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Failed to load batches', 'error');
        }
    },

    /**
     * Load departments for dropdown (internal)
     */
    async loadDepartmentsForDropdown() {
        if (this.departments.length === 0) {
            const response = await Utils.apiRequest('/college/departments');
            this.departments = response.data?.departments || response.departments || [];
        }
    },

    /**
     * Render batches table
     */
    renderBatches() {
        const container = document.getElementById('collegeBatchesList');
        if (!container) return;

        if (!this.batches || this.batches.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No batches found</div>';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-primary" onclick="College.openAddBatchModal()" style="margin-bottom: 1rem;">+ Add Batch</button>
            <table class="table">
                <thead>
                    <tr>
                        <th>Batch Name</th>
                        <th>Department</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.batches.map(b => `
                        <tr>
                            <td>${Utils.escapeHtml(b.batch_name)}</td>
                            <td>${Utils.escapeHtml(this.findDepartmentNameById(b.department_id))}</td>
                            <td>${Utils.escapeHtml(b.email)}</td>
                            <td>
                                ${!b.is_disabled ? 
                                    '<span class="badge badge-success">Enabled</span>' : 
                                    '<span class="badge badge-secondary">Disabled</span>'
                                }
                            </td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="College.editBatch('${b.id}')">Edit</button>
                                ${!b.is_disabled ? 
                                    `<button class="btn btn-sm btn-warning" onclick="College.disableBatch('${b.id}')">Disable</button>` : 
                                    `<button class="btn btn-sm btn-success" onclick="College.enableBatch('${b.id}')">Enable</button>`
                                }
                                <button class="btn btn-sm btn-danger" onclick="College.deleteBatch('${b.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Find department name by ID
     */
    findDepartmentNameById(departmentId) {
        if (!departmentId) return '';
        const dept = this.departments.find(d => d.id === departmentId);
        return dept ? dept.name : '';
    },

    /**
     * Open add batch modal
     */
    openAddBatchModal() {
        document.getElementById('collegeBatchDepartment').value = '';
        document.getElementById('collegeBatchName').value = '';
        document.getElementById('collegeBatchEmail').value = '';
        document.getElementById('collegeBatchPassword').value = '';
        this.editingBatchId = null;
        this.populateBatchDepartmentSelect();
        document.querySelector('#collegeBatchModal .modal-header h3').textContent = 'Add Batch';
        document.querySelector('#collegeBatchModal [type="submit"]').textContent = 'Create Batch';
        UI.openModal('collegeBatchModal');
    },

    /**
     * Edit batch
     */
    async editBatch(id) {
        try {
            const response = await Utils.apiRequest(`/college/batches/${id}`);
            const batch = response.data?.batch || response.batch || {};

            this.populateBatchDepartmentSelect();

            document.getElementById('collegeBatchDepartment').value = batch.department_id || '';
            document.getElementById('collegeBatchName').value = batch.batch_name || '';
            document.getElementById('collegeBatchEmail').value = batch.email || '';
            document.getElementById('collegeBatchPassword').value = '';

            this.editingBatchId = id;
            document.querySelector('#collegeBatchModal .modal-header h3').textContent = 'Edit Batch';
            document.querySelector('#collegeBatchModal [type="submit"]').textContent = 'Update Batch';
            UI.openModal('collegeBatchModal');
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
            await Utils.apiRequest(`/college/batches/${id}`, { method: 'DELETE' });
            this.loadBatches();
            Utils.showMessage('collegeMessage', 'Batch deleted', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Disable batch
     */
    async disableBatch(id) {
        if (!Utils.confirm('Disable this batch? All students in this batch will also be disabled.')) return;

        try {
            await Utils.apiRequest(`/college/batches/${id}/disable`, { method: 'POST' });
            this.loadBatches();
            Utils.showMessage('collegeMessage', 'Batch disabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Disable failed: ' + error.message, 'error');
        }
    },

    /**
     * Enable batch
     */
    async enableBatch(id) {
        try {
            await Utils.apiRequest(`/college/batches/${id}/enable`, { method: 'POST' });
            this.loadBatches();
            Utils.showMessage('collegeMessage', 'Batch enabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Enable failed: ' + error.message, 'error');
        }
    },

    /**
     * Populate department dropdown for batch modal
     */
    populateBatchDepartmentSelect() {
        const select = document.getElementById('collegeBatchDepartment');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Department --</option>' +
            this.departments.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.name)}</option>`).join('');
    },

    /**
     * Save batch
     */
    async saveBatch() {
        const departmentId = document.getElementById('collegeBatchDepartment').value;
        const name = document.getElementById('collegeBatchName').value.trim();
        const email = document.getElementById('collegeBatchEmail').value.trim();
        const password = document.getElementById('collegeBatchPassword').value.trim();

        if (!departmentId) {
            Utils.alert('Please select a department');
            return;
        }

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

        // Get department to extract college_id (mirror of Admin panel logic)
        const department = this.departments.find(d => d.id === departmentId);
        if (!department || !department.college_id) {
            Utils.alert('Invalid department selected');
            return;
        }

        try {
            const payload = { 
                batch_name: name, 
                department_id: departmentId,
                college_id: department.college_id,
                email, 
                password 
            };
            const url = this.editingBatchId 
                ? `/college/batches/${this.editingBatchId}`
                : '/college/batches';
            
            const method = this.editingBatchId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadBatches();
            UI.closeModal('collegeBatchModal');
            Utils.showMessage('collegeMessage', 
                this.editingBatchId ? 'Batch updated' : 'Batch created', 
                'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Save failed: ' + error.message, 'error');
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
            const response = await Utils.apiRequest('/college/students');
            this.students = response.data?.students || response.students || [];
            // Load departments and batches for dropdowns
            await this.loadDepartmentsForDropdown();
            await this.loadBatchesForDropdown();
            this.renderStudents();
        } catch (error) {
            console.error('Load students error:', error);
            Utils.showMessage('collegeMessage', 'Failed to load students', 'error');
        }
    },

    /**
     * Load batches for dropdown (internal)
     */
    async loadBatchesForDropdown() {
        if (this.batches.length === 0) {
            const response = await Utils.apiRequest('/college/batches');
            this.batches = response.data?.batches || response.batches || [];
        }
    },

    /**
     * Render students table
     */
    renderStudents() {
        const container = document.getElementById('collegeStudentsList');
        if (!container) return;

        if (!this.students || this.students.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No students found</div>';
            return;
        }

        container.innerHTML = `
            <button class="btn btn-primary" onclick="College.openAddStudentModal()" style="margin-bottom: 1rem;">+ Add Student</button>
            <table class="table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Department</th>
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
                            <td>${Utils.escapeHtml(this.findDepartmentNameById(s.department_id))}</td>
                            <td>${Utils.escapeHtml(this.findBatchNameById(s.batch_id))}</td>
                            <td>
                                ${!s.is_disabled ? 
                                    '<span class="badge badge-success">Enabled</span>' : 
                                    '<span class="badge badge-secondary">Disabled</span>'
                                }
                            </td>
                            <td class="flex-gap">
                                <button class="btn btn-sm btn-secondary" onclick="College.editStudent('${s.id}')">Edit</button>
                                ${!s.is_disabled ? 
                                    `<button class="btn btn-sm btn-warning" onclick="College.disableStudent('${s.id}')">Disable</button>` : 
                                    `<button class="btn btn-sm btn-success" onclick="College.enableStudent('${s.id}')">Enable</button>`
                                }
                                <button class="btn btn-sm btn-danger" onclick="College.deleteStudent('${s.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
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
        document.getElementById('collegeStudentDepartment').value = '';
        document.getElementById('collegeStudentBatch').value = '';
        document.getElementById('collegeStudentBatch').disabled = true;
        document.getElementById('collegeStudentUsername').value = '';
        document.getElementById('collegeStudentEmail').value = '';
        document.getElementById('collegeStudentPassword').value = '';
        this.editingStudentId = null;
        this.populateStudentDepartmentSelect();
        document.querySelector('#collegeStudentModal .modal-header h3').textContent = 'Add Student';
        document.querySelector('#collegeStudentModal [type="submit"]').textContent = 'Create Student';
        UI.openModal('collegeStudentModal');
    },

    /**
     * Edit student
     */
    async editStudent(id) {
        try {
            const response = await Utils.apiRequest(`/college/students/${id}`);
            const student = response.data?.student || response.student || {};

            this.populateStudentDepartmentSelect();
            await this.loadBatchesForDropdown();

            document.getElementById('collegeStudentDepartment').value = student.department_id || '';
            this.onCollegeStudentDepartmentChange();
            
            setTimeout(() => {
                document.getElementById('collegeStudentBatch').value = student.batch_id || '';
            }, 10);

            document.getElementById('collegeStudentUsername').value = student.username || student.name || '';
            document.getElementById('collegeStudentEmail').value = student.email || '';
            document.getElementById('collegeStudentPassword').value = '';

            this.editingStudentId = id;
            document.querySelector('#collegeStudentModal .modal-header h3').textContent = 'Edit Student';
            document.querySelector('#collegeStudentModal [type="submit"]').textContent = 'Update Student';
            UI.openModal('collegeStudentModal');
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
            await Utils.apiRequest(`/college/students/${id}`, { method: 'DELETE' });
            this.loadStudents();
            Utils.showMessage('collegeMessage', 'Student deleted', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Disable student
     */
    async disableStudent(id) {
        if (!Utils.confirm('Disable this student? They will not be able to log in.')) return;

        try {
            await Utils.apiRequest(`/college/students/${id}/disable`, { method: 'POST' });
            this.loadStudents();
            Utils.showMessage('collegeMessage', 'Student disabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Disable failed: ' + error.message, 'error');
        }
    },

    /**
     * Enable student
     */
    async enableStudent(id) {
        try {
            await Utils.apiRequest(`/college/students/${id}/enable`, { method: 'POST' });
            this.loadStudents();
            Utils.showMessage('collegeMessage', 'Student enabled', 'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Enable failed: ' + error.message, 'error');
        }
    },

    /**
     * Populate department dropdown for student modal
     */
    populateStudentDepartmentSelect() {
        const select = document.getElementById('collegeStudentDepartment');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Department --</option>' +
            this.departments.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.name)}</option>`).join('');
    },

    /**
     * Handle department change in student modal - filter batches by department
     */
    onCollegeStudentDepartmentChange() {
        const departmentId = document.getElementById('collegeStudentDepartment').value;
        const batchSelect = document.getElementById('collegeStudentBatch');

        if (!departmentId) {
            batchSelect.disabled = true;
            batchSelect.innerHTML = '<option value="">-- Select Batch --</option>';
            return;
        }

        // Filter batches by department
        const departmentBatches = this.batches.filter(b => b.department_id === departmentId);
        batchSelect.disabled = false;
        batchSelect.innerHTML = '<option value="">-- Select Batch --</option>' +
            departmentBatches.map(b => `<option value="${b.id}">${Utils.escapeHtml(b.batch_name)}</option>`).join('');
    },

    /**
     * Save student
     */
    async saveStudent() {
        const username = document.getElementById('collegeStudentUsername').value.trim();
        const email = document.getElementById('collegeStudentEmail').value.trim();
        const departmentId = document.getElementById('collegeStudentDepartment').value;
        const batchId = document.getElementById('collegeStudentBatch').value;
        const password = document.getElementById('collegeStudentPassword').value.trim();

        if (!Utils.isValidString(username, 2)) {
            Utils.alert('Username must be at least 2 characters');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.alert('Please enter a valid email address');
            return;
        }

        if (!departmentId) {
            Utils.alert('Please select a department');
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

        // Validate college exists (implicit from logged-in user)
        // Validate department exists and belongs to college
        const department = this.departments.find(d => d.id === departmentId);
        if (!department || department.is_disabled) {
            Utils.alert('Invalid department selected');
            return;
        }

        // Validate batch exists and belongs to department
        const batch = this.batches.find(b => b.id === batchId && b.department_id === departmentId);
        if (!batch || batch.is_disabled) {
            Utils.alert('Invalid batch selected');
            return;
        }

        try {
            const payload = { 
                username, 
                email, 
                batch_id: batchId,
                department_id: departmentId,
                college_id: batch.college_id
            };
            // Only include password if provided (mirror of Admin panel logic)
            if (password) {
                payload.password = password;
            }

            const url = this.editingStudentId 
                ? `/college/students/${this.editingStudentId}`
                : '/college/students';
            
            const method = this.editingStudentId ? 'PUT' : 'POST';

            const response = await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            // Show generated password for new students (mirror of Admin panel logic)
            if (!this.editingStudentId && response.data?.password) {
                Utils.alert(`Student created successfully! Generated password: ${response.data.password}`);
            }

            this.loadStudents();
            UI.closeModal('collegeStudentModal');
            Utils.showMessage('collegeMessage', 
                this.editingStudentId ? 'Student updated' : 'Student created', 
                'success');
        } catch (error) {
            Utils.showMessage('collegeMessage', 'Save failed: ' + error.message, 'error');
        }
    }
};
