/**
 * Batch Topics Management
 * Handles Topics CRUD operations for Batch Admins
 */

const BatchTopics = {
  apiEndpoint: `${CONFIG.API_BASE_URL}/batch/topics`,
  editingId: null,

  /**
   * Open modal for creating/editing topic
   */
  openModal: function(topicId = null) {
    this.editingId = topicId;
    const modal = document.querySelector('#batchTopicModal .modal-header h3');
    const submit = document.querySelector('#batchTopicModal [type=submit]');
    
    if (topicId) {
      modal.textContent = 'Edit Topic';
      submit.textContent = 'Update Topic';
      this.loadTopicForEdit(topicId);
    } else {
      document.getElementById('batchTopicId').value = '';
      document.getElementById('batchTopicName').value = '';
      modal.textContent = 'Add Topic';
      submit.textContent = 'Create Topic';
    }
    
    UI.openModal('batchTopicModal');
  },

  /**
   * Load topic details for editing
   */
  loadTopicForEdit: async function(topicId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/${topicId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById('batchTopicId').value = topicId;
        document.getElementById('batchTopicName').value = data.data?.topic?.topic_name || '';
      } else {
        Utils.showMessage('batchTopicsMessage', 'Error loading topic', 'error');
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      Utils.showMessage('batchTopicsMessage', 'Error loading topic', 'error');
    }
  },

  /**
   * Save topic (create or update)
   */
  save: async function() {
    const topicId = document.getElementById('batchTopicId').value;
    const topicName = document.getElementById('batchTopicName').value.trim();

    if (!topicName || topicName.length < 2) {
      Utils.showMessage('batchTopicsMessage', 'Topic name is required (min 2 chars)', 'error');
      return;
    }

    const payload = { topic_name: topicName };

    try {
      let response;
      if (topicId) {
        response = await fetch(`${this.apiEndpoint}/${topicId}`, {
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
        Utils.showMessage('batchTopicsMessage', topicId ? 'Topic updated successfully' : 'Topic created successfully', 'success');
        UI.closeModal('batchTopicModal');
        this.loadTopics();
      } else {
        const error = await response.json();
        Utils.showMessage('batchTopicsMessage', error.message || 'Error saving topic', 'error');
      }
    } catch (error) {
      console.error('Error saving topic:', error);
      Utils.showMessage('batchTopicsMessage', 'Error saving topic', 'error');
    }
  },

  /**
   * Load all topics for the current batch
   */
  loadTopics: async function() {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayTopics(data.data?.topics || []);
      } else {
        Utils.showMessage('batchMessage', 'Error loading topics', 'error');
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      Utils.showMessage('batchMessage', 'Error loading topics', 'error');
    }
  },

  /**
   * Display topics in a table
   */
  displayTopics: function(topics) {
    const container = document.getElementById('batchTopicsList');

    if (!topics || topics.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center;">No topics created yet</p>';
      return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">';
    html += '<th style="padding: 0.75rem; text-align: left;">Topic Name</th>';
    html += '<th style="padding: 0.75rem; text-align: center; width: 150px;">Actions</th>';
    html += '</tr></thead><tbody>';

    topics.forEach(topic => {
      if (topic.is_disabled) return; // Skip disabled topics

      html += `<tr style="border-bottom: 1px solid #eee;">`;
      html += `<td style="padding: 0.75rem;">${this.escapeHtml(topic.topic_name)}</td>`;
      html += `<td style="padding: 0.75rem; text-align: center;">`;
      html += `<button class="btn btn-sm btn-info" onclick="BatchTopics.openModal('${topic.id}')">Edit</button>`;
      html += `<button class="btn btn-sm btn-danger" onclick="BatchTopics.deleteConfirm('${topic.id}')">Delete</button>`;
      html += `</td>`;
      html += `</tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  /**
   * Delete topic with confirmation
   */
  deleteConfirm: function(topicId) {
    if (confirm('Are you sure you want to delete this topic?')) {
      this.delete(topicId);
    }
  },

  /**
   * Delete a topic
   */
  delete: async function(topicId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/${topicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        Utils.showMessage('batchMessage', 'Topic deleted successfully', 'success');
        this.loadTopics();
      } else {
        const error = await response.json();
        Utils.showMessage('batchMessage', error.message || 'Error deleting topic', 'error');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      Utils.showMessage('batchMessage', 'Error deleting topic', 'error');
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

// Auto-load topics when batch tab is opened
document.addEventListener('DOMContentLoaded', function() {
  const batchTabButtons = document.querySelectorAll('[data-batch-tab]');
  batchTabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.getAttribute('data-batch-tab') === 'topics') {
        BatchTopics.loadTopics();
      }
    });
  });
});

// Export to global scope
window.BatchTopics = BatchTopics;
