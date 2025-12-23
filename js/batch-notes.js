/**
 * Batch Notes Management
 * Handles Notes CRUD operations for Batch Admins
 */

const BatchNotes = {
  apiEndpoint: `${CONFIG.API_BASE_URL}/batch/notes`,
  editingId: null,

  /**
   * Open modal for creating/editing note
   */
  openModal: function(noteId = null) {
    this.editingId = noteId;
    const modal = document.querySelector('#batchNoteModal .modal-header h3');
    const submit = document.querySelector('#batchNoteModal [type=submit]');
    
    if (noteId) {
      modal.textContent = 'Edit Note';
      submit.textContent = 'Update Note';
      this.loadNoteForEdit(noteId);
    } else {
      document.getElementById('batchNoteId').value = '';
      document.getElementById('batchNoteTitle').value = '';
      document.getElementById('batchNoteLink').value = '';
      modal.textContent = 'Add Note';
      submit.textContent = 'Create Note';
    }
    
    UI.openModal('batchNoteModal');
  },

  /**
   * Load note details for editing
   */
  loadNoteForEdit: async function(noteId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/${noteId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById('batchNoteId').value = noteId;
        document.getElementById('batchNoteTitle').value = data.data?.note?.title || '';
        document.getElementById('batchNoteLink').value = data.data?.note?.drive_link || '';
      } else {
        Utils.showMessage('batchNotesMessage', 'Error loading note', 'error');
      }
    } catch (error) {
      console.error('Error loading note:', error);
      Utils.showMessage('batchNotesMessage', 'Error loading note', 'error');
    }
  },

  /**
   * Save note (create or update)
   */
  save: async function() {
    const noteId = document.getElementById('batchNoteId').value;
    const title = document.getElementById('batchNoteTitle').value.trim();
    const driveLink = document.getElementById('batchNoteLink').value.trim();

    if (!title || title.length < 2) {
      Utils.showMessage('batchNotesMessage', 'Title is required (min 2 chars)', 'error');
      return;
    }

    if (!driveLink || !this.isValidUrl(driveLink)) {
      Utils.showMessage('batchNotesMessage', 'Valid Google Drive link is required', 'error');
      return;
    }

    const payload = { 
      title: title,
      drive_link: driveLink
    };

    try {
      let response;
      if (noteId) {
        response = await fetch(`${this.apiEndpoint}/${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        Utils.showMessage('batchNotesMessage', noteId ? 'Note updated successfully' : 'Note created successfully', 'success');
        UI.closeModal('batchNoteModal');
        this.loadNotes();
      } else {
        const error = await response.json();
        Utils.showMessage('batchNotesMessage', error.message || 'Error saving note', 'error');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Utils.showMessage('batchNotesMessage', 'Error saving note', 'error');
    }
  },

  /**
   * Load all notes for the current batch
   */
  loadNotes: async function() {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayNotes(data.data?.notes || []);
      } else {
        Utils.showMessage('batchMessage', 'Error loading notes', 'error');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      Utils.showMessage('batchMessage', 'Error loading notes', 'error');
    }
  },

  /**
   * Display notes in a table
   */
  displayNotes: function(notes) {
    const container = document.getElementById('batchNotesList');

    if (!notes || notes.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center;">No notes created yet</p>';
      return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">';
    html += '<th style="padding: 0.75rem; text-align: left;">Title</th>';
    html += '<th style="padding: 0.75rem; text-align: left;">Drive Link</th>';
    html += '<th style="padding: 0.75rem; text-align: center; width: 150px;">Actions</th>';
    html += '</tr></thead><tbody>';

    notes.forEach(note => {
      if (note.is_disabled) return; // Skip disabled notes

      const linkDisplay = note.drive_link.substring(0, 40) + (note.drive_link.length > 40 ? '...' : '');
      html += `<tr style="border-bottom: 1px solid #eee;">`;
      html += `<td style="padding: 0.75rem;">${this.escapeHtml(note.title)}</td>`;
      html += `<td style="padding: 0.75rem;"><a href="${this.escapeHtml(note.drive_link)}" target="_blank" style="color: #007bff; text-decoration: none;">${linkDisplay}</a></td>`;
      html += `<td style="padding: 0.75rem; text-align: center;">`;
      html += `<button class="btn btn-sm btn-info" onclick="BatchNotes.openModal('${note.id}')">Edit</button>`;
      html += `<button class="btn btn-sm btn-danger" onclick="BatchNotes.deleteConfirm('${note.id}')">Delete</button>`;
      html += `</td>`;
      html += `</tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  /**
   * Delete note with confirmation
   */
  deleteConfirm: function(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
      this.delete(noteId);
    }
  },

  /**
   * Delete a note
   */
  delete: async function(noteId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        Utils.showMessage('batchMessage', 'Note deleted successfully', 'success');
        this.loadNotes();
      } else {
        const error = await response.json();
        Utils.showMessage('batchMessage', error.message || 'Error deleting note', 'error');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      Utils.showMessage('batchMessage', 'Error deleting note', 'error');
    }
  },

  /**
   * Validate URL format
   */
  isValidUrl: function(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' || 
             url.includes('drive.google.com');
    } catch (e) {
      return false;
    }
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml: function(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
};

// Auto-load notes when batch notes tab is opened
document.addEventListener('DOMContentLoaded', function() {
  const batchTabButtons = document.querySelectorAll('[data-batch-tab]');
  batchTabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.getAttribute('data-batch-tab') === 'notes') {
        BatchNotes.loadNotes();
      }
    });
  });
});

// Export to global scope
window.BatchNotes = BatchNotes;
