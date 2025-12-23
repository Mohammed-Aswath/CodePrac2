/**
 * Students Module - Full CRUD functionality
 */

const Students = {
    students: [],
    editingId: null,

    /**
     * Load students based on user role
     */
    async load() {
        try {
            let url = '/admin/students';
            const user = Auth.getCurrentUser();
            
            if (user.role === 'college') {
                url = '/college/students';
            } else if (user.role === 'department') {
                url = '/department/students';
            }

            const response = await Utils.apiRequest(url);
            this.students = response.data?.students || response.students || [];
            this.render();
        } catch (error) {
            console.error('Load students error:', error);
            Utils.showMessage('studentsMessage', 'Failed to load students', 'error');
        }
    },

    /**
     * Render students table
     */
    render() {
        const container = document.getElementById('studentsList');
        if (!container) return;

        if (!this.students || this.students.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No students found</div>';
            return;
        }

        const user = Auth.getCurrentUser();
        const isAdmin = user.role === 'admin' || user.role === 'college' || user.role === 'department';

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Batch</th>
                        <th>Status</th>
                        ${isAdmin ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${this.students.map(s => `
                        <tr>
                            <td>${Utils.escapeHtml(s.username || s.name || 'N/A')}</td>
                            <td>${Utils.escapeHtml(s.email)}</td>
                            <td>${s.batch_id || 'N/A'}</td>
                            <td>
                                ${s.is_active ? 
                                    '<span class="badge badge-success">Active</span>' : 
                                    '<span class="badge badge-secondary">Inactive</span>'
                                }
                            </td>
                            ${isAdmin ? `
                                <td class="flex-gap">
                                    <button class="btn btn-sm btn-secondary" onclick="Students.edit('${s.id}')">Edit</button>
                                    <button class="btn btn-sm btn-${s.is_active ? 'warning' : 'success'}" 
                                        onclick="Students.toggle('${s.id}')">
                                        ${s.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="Students.delete('${s.id}')">Delete</button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Open create/edit modal
     */
    openModal() {
        this.editingId = null;
        this.resetForm();
        
        const passwordField = document.getElementById('studentPassword');
        if (passwordField) {
            passwordField.style.display = 'block';
            passwordField.required = true;
        }

        document.querySelector('#studentModal .modal-header h3').textContent = 'Add Student';
        document.querySelector('#studentModal [type="submit"]').textContent = 'Create Student';
        UI.openModal('studentModal');
    },

    /**
     * Edit student
     */
    async edit(id) {
        try {
            const response = await Utils.apiRequest(`/admin/students/${id}`);
            const student = response.data?.student || response.student || {};

            document.getElementById('studentName').value = student.name || '';
            document.getElementById('studentEmail').value = student.email || '';
            
            const passwordField = document.getElementById('studentPassword');
            if (passwordField) {
                passwordField.style.display = 'none';
                passwordField.required = false;
                passwordField.value = '';
            }

            this.editingId = id;
            document.querySelector('#studentModal .modal-header h3').textContent = 'Edit Student';
            document.querySelector('#studentModal [type="submit"]').textContent = 'Update Student';
            UI.openModal('studentModal');
        } catch (error) {
            Utils.alert('Failed to load student: ' + error.message);
        }
    },

    /**
     * Toggle student active/inactive
     */
    async toggle(id) {
        try {
            const student = this.students.find(s => s.id === id);
            const newStatus = !student.is_active;

            await Utils.apiRequest(`/admin/students/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: newStatus })
            });

            this.load();
            Utils.showMessage('studentsMessage', 
                newStatus ? 'Student enabled' : 'Student disabled', 
                'success');
        } catch (error) {
            Utils.showMessage('studentsMessage', 'Toggle failed: ' + error.message, 'error');
        }
    },

    /**
     * Delete student
     */
    async delete(id) {
        if (!Utils.confirm('Delete this student permanently?')) return;

        try {
            await Utils.apiRequest(`/admin/students/${id}`, { method: 'DELETE' });
            this.load();
            Utils.showMessage('studentsMessage', 'Student deleted', 'success');
        } catch (error) {
            Utils.showMessage('studentsMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Save student (create or update)
     */
    async save() {
        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const password = document.getElementById('studentPassword').value;

        if (!name || !email) {
            Utils.alert('Please fill all required fields');
            return;
        }

        if (!this.editingId && !password) {
            Utils.alert('Password is required for new students');
            return;
        }

        try {
            const payload = { name, email };
            if (!this.editingId) {
                payload.password = password;
            }

            const url = this.editingId 
                ? `/admin/students/${this.editingId}`
                : '/admin/students';
            
            const method = this.editingId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.load();
            UI.closeModal('studentModal');
            Utils.showMessage('studentsMessage', 
                this.editingId ? 'Student updated' : 'Student created', 
                'success');
        } catch (error) {
            Utils.showMessage('studentsMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('studentName').value = '';
        document.getElementById('studentEmail').value = '';
        const passwordField = document.getElementById('studentPassword');
        if (passwordField) {
            passwordField.value = '';
        }
    }
};
