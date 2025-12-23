/**
 * Notes Module - Full CRUD functionality
 */

const Notes = {
    notes: [],
    editingId: null,

    /**
     * Load all notes
     */
    async load() {
        try {
            const response = await Utils.apiRequest('/department/notes');
            this.notes = response.data?.notes || response.notes || [];
            this.render();
        } catch (error) {
            console.error('Load notes error:', error);
            Utils.showMessage('notesMessage', 'Failed to load notes', 'error');
        }
    },

    /**
     * Render notes grid
     */
    render() {
        const container = document.getElementById('notesList');
        if (!container) return;

        if (!this.notes || this.notes.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No notes found</div>';
            return;
        }

        container.innerHTML = this.notes.map(n => `
            <div class="card">
                <div class="flex-between">
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">${Utils.escapeHtml(n.title)}</h4>
                        <p><a href="${Utils.escapeHtml(n.google_drive_link)}" target="_blank" class="text-primary">View Document</a></p>
                    </div>
                    <div class="flex-gap">
                        <button class="btn btn-sm btn-secondary" onclick="Notes.edit('${n.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="Notes.delete('${n.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Open create/edit modal
     */
    openModal() {
        this.editingId = null;
        this.resetForm();
        document.querySelector('#noteModal .modal-header h3').textContent = 'Add Note';
        document.querySelector('#noteModal [type="submit"]').textContent = 'Create Note';
        UI.openModal('noteModal');
    },

    /**
     * Edit note
     */
    async edit(id) {
        try {
            const response = await Utils.apiRequest(`/department/notes/${id}`);
            const note = response.data?.note || response.note || {};

            document.getElementById('noteTopic').value = note.topic_id || '';
            document.getElementById('noteTitle').value = note.title || '';
            document.getElementById('noteLink').value = note.google_drive_link || '';

            this.editingId = id;
            document.querySelector('#noteModal .modal-header h3').textContent = 'Edit Note';
            document.querySelector('#noteModal [type="submit"]').textContent = 'Update Note';
            UI.openModal('noteModal');
        } catch (error) {
            Utils.alert('Failed to load note: ' + error.message);
        }
    },

    /**
     * Delete note
     */
    async delete(id) {
        if (!Utils.confirm('Delete this note permanently?')) return;

        try {
            await Utils.apiRequest(`/department/notes/${id}`, { method: 'DELETE' });
            this.load();
            Utils.showMessage('notesMessage', 'Note deleted', 'success');
        } catch (error) {
            Utils.showMessage('notesMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Save note (create or update)
     */
    async save() {
        const topicId = document.getElementById('noteTopic').value;
        const title = document.getElementById('noteTitle').value.trim();
        const link = document.getElementById('noteLink').value.trim();

        if (!topicId || !title || !link) {
            Utils.alert('Please fill all fields');
            return;
        }

        try {
            const payload = {
                topic_id: topicId,
                title,
                google_drive_link: link
            };

            const url = this.editingId 
                ? `/department/notes/${this.editingId}`
                : '/department/notes';
            
            const method = this.editingId ? 'PUT' : 'POST';

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.load();
            UI.closeModal('noteModal');
            Utils.showMessage('notesMessage', 
                this.editingId ? 'Note updated' : 'Note created', 
                'success');
        } catch (error) {
            Utils.showMessage('notesMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('noteTopic').value = '';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteLink').value = '';
    }
};
