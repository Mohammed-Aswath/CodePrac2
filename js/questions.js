/**
 * Questions Module - Full CRUD functionality with Admin Hierarchy Support
 */

const Questions = {
    questions: [],
    editingId: null,
    currentUser: null,
    collegesData: [],
    departmentsData: [],
    batchesData: [],
    topicsData: [],
    createdQuestionId: null,

    /**
     * Initialize - Load current user data
     */
    async init() {
        try {
            // Get current user to determine role
            const userStr = localStorage.getItem('user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Init error:', error);
        }
    },

    /**
     * Load all questions
     */
    async load() {
        try {
            const response = await Utils.apiRequest('/department/questions');
            this.questions = response.data?.questions || response.questions || [];
            this.render();
        } catch (error) {
            console.error('Load questions error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load questions', 'error');
        }
    },

    /**
     * Render questions table
     */
    render() {
        const tbody = document.getElementById('questionsTable');
        if (!tbody) return;

        if (!this.questions || this.questions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No questions found</td></tr>';
            return;
        }

        tbody.innerHTML = this.questions.map(q => `
            <tr>
                <td>${Utils.escapeHtml(q.title)}</td>
                <td>${Utils.escapeHtml(q.topic_name || q.topic_id)}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Questions.edit('${q.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="Questions.delete('${q.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Open create modal with role-based flow
     */
    async openModal() {
        await this.init();
        this.editingId = null;
        this.createdQuestionId = null;
        this.resetForm();
        
        const isAdmin = this.currentUser?.role === 'admin';
        
        // Show appropriate step based on role
        document.getElementById('questionHierarchyStep').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('questionDetailsStep').style.display = isAdmin ? 'none' : 'block';
        
        if (isAdmin) {
            // Load colleges for admin
            await this.loadColleges();
        }
        
        document.querySelector('#questionModal .modal-header h3').textContent = 'Add Question';
        UI.openModal('questionModal');
    },

    /**
     * Load colleges for admin
     */
    async loadColleges() {
        try {
            const response = await Utils.apiRequest('/admin/colleges');
            this.collegesData = response.data?.colleges || response.colleges || [];
            
            const select = document.getElementById('questionCollege');
            select.innerHTML = '<option value="">-- Select College --</option>';
            this.collegesData.forEach(college => {
                const option = document.createElement('option');
                option.value = college.id;
                option.textContent = college.college_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Load colleges error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load colleges', 'error');
        }
    },

    /**
     * Load departments for selected college
     */
    async loadDepartments(collegeId) {
        if (!collegeId) {
            document.getElementById('questionDepartment').innerHTML = '<option value="">-- Select Department --</option>';
            document.getElementById('questionBatch').innerHTML = '<option value="">-- Select Batch --</option>';
            document.getElementById('questionTopic').innerHTML = '<option value="">-- Select Topic --</option>';
            return;
        }

        try {
            const response = await Utils.apiRequest(`/admin/colleges/${collegeId}/departments`);
            this.departmentsData = response.data?.departments || response.departments || [];
            
            const select = document.getElementById('questionDepartment');
            select.innerHTML = '<option value="">-- Select Department --</option>';
            this.departmentsData.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.department_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Load departments error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load departments', 'error');
        }
    },

    /**
     * Load batches for selected department
     */
    async loadBatches(departmentId) {
        if (!departmentId) {
            document.getElementById('questionBatch').innerHTML = '<option value="">-- Select Batch --</option>';
            document.getElementById('questionTopic').innerHTML = '<option value="">-- Select Topic --</option>';
            return;
        }

        try {
            const response = await Utils.apiRequest(`/admin/departments/${departmentId}/batches`);
            this.batchesData = response.data?.batches || response.batches || [];
            
            const select = document.getElementById('questionBatch');
            select.innerHTML = '<option value="">-- Select Batch --</option>';
            this.batchesData.forEach(batch => {
                const option = document.createElement('option');
                option.value = batch.id;
                option.textContent = batch.batch_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Load batches error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load batches', 'error');
        }
    },

    /**
     * Load topics for selected batch
     */
    async loadTopics(batchId) {
        if (!batchId) {
            document.getElementById('questionTopic').innerHTML = '<option value="">-- Select Topic --</option>';
            return;
        }

        try {
            const response = await Utils.apiRequest(`/admin/batches/${batchId}/topics`);
            this.topicsData = response.data?.topics || response.topics || [];
            
            const select = document.getElementById('questionTopic');
            select.innerHTML = '<option value="">-- Select Topic --</option>';
            this.topicsData.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.id;
                option.textContent = topic.topic_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Load topics error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load topics', 'error');
        }
    },

    /**
     * Proceed from hierarchy selection to question details
     */
    proceedToQuestionDetails() {
        const collegeId = document.getElementById('questionCollege').value.trim();
        const departmentId = document.getElementById('questionDepartment').value.trim();
        const batchId = document.getElementById('questionBatch').value.trim();
        const topicId = document.getElementById('questionTopic').value.trim();

        if (!collegeId || !departmentId || !batchId || !topicId) {
            Utils.showMessage('questionsMessage', 'Please select all required hierarchy levels', 'error');
            return;
        }

        // Hide hierarchy step, show details step
        document.getElementById('questionHierarchyStep').style.display = 'none';
        document.getElementById('questionDetailsStep').style.display = 'block';
        document.querySelector('#questionModal .modal-header h3').textContent = 'Add Question Details';
    },

    /**
     * Go back to hierarchy selection
     */
    backToHierarchy() {
        document.getElementById('questionHierarchyStep').style.display = 'block';
        document.getElementById('questionDetailsStep').style.display = 'none';
        document.querySelector('#questionModal .modal-header h3').textContent = 'Add Question';
    },

    /**
     * Save question (create or update)
     */
    async saveQuestion() {
        const title = document.getElementById('questionTitle').value.trim();
        const description = document.getElementById('questionDescription').value.trim();
        const sampleInput = document.getElementById('questionSampleInput').value.trim();
        const sampleOutput = document.getElementById('questionSampleOutput').value.trim();
        const difficulty = document.getElementById('questionDifficulty').value.trim();
        const topicId = document.getElementById('questionTopic').value.trim();

        if (!title || !description || !sampleInput || !sampleOutput || !topicId) {
            Utils.showMessage('questionsMessage', 'Please fill all required fields', 'error');
            return;
        }

        if (title.length < 3) {
            Utils.showMessage('questionsMessage', 'Title must be at least 3 characters', 'error');
            return;
        }

        if (description.length < 10) {
            Utils.showMessage('questionsMessage', 'Description must be at least 10 characters', 'error');
            return;
        }

        try {
            const payload = {
                topic_id: topicId,
                title,
                description,
                sample_input: sampleInput,
                sample_output: sampleOutput,
                difficulty
            };

            // Determine which endpoint to use based on role
            const isAdmin = this.currentUser?.role === 'admin';
            const batchId = document.getElementById('questionBatch').value.trim();
            const url = isAdmin ? `/admin/batches/${batchId}/questions` : '/department/questions';
            
            const response = await Utils.apiRequest(url, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.createdQuestionId = response.data?.question?.id || response.question?.id;
            
            if (isAdmin && this.createdQuestionId) {
                // For admin, close modal and open test case generation interface
                UI.closeModal('questionModal');
                Utils.showMessage('questionsMessage', 'Question created successfully', 'success');
                this.openTestCaseInterface(this.createdQuestionId, payload);
            } else {
                // For department users, reload and close
                this.load();
                UI.closeModal('questionModal');
                Utils.showMessage('questionsMessage', 'Question created successfully', 'success');
            }
        } catch (error) {
            Utils.showMessage('questionsMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    /**
     * Open test case generation interface for admin after creating question
     */
    openTestCaseInterface(questionId, questionData) {
        // This will open a dedicated admin interface for generating hidden test cases
        // For now, we'll reload the page to show the batch admin interface
        window.location.href = `/?tab=admin&action=generate-testcases&question=${questionId}`;
    },

    /**
     * Edit question
     */
    async edit(id) {
        try {
            const response = await Utils.apiRequest(`/department/questions/${id}`);
            const question = response.data?.question || response.question || {};

            document.getElementById('questionTitle').value = question.title || '';
            document.getElementById('questionDescription').value = question.description || '';
            document.getElementById('questionTopic').value = question.topic_id || '';
            document.getElementById('questionSampleInput').value = question.sample_input || '';
            document.getElementById('questionSampleOutput').value = question.sample_output || '';

            this.editingId = id;
            document.querySelector('#questionModal .modal-header h3').textContent = 'Edit Question';
            UI.openModal('questionModal');
        } catch (error) {
            Utils.alert('Failed to load question: ' + error.message);
        }
    },

    /**
     * Delete question
     */
    async delete(id) {
        if (!Utils.confirm('Delete this question permanently?')) return;

        try {
            await Utils.apiRequest(`/department/questions/${id}`, { method: 'DELETE' });
            this.load();
            Utils.showMessage('questionsMessage', 'Question deleted', 'success');
        } catch (error) {
            Utils.showMessage('questionsMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('questionTitle').value = '';
        document.getElementById('questionDescription').value = '';
        document.getElementById('questionTopic').value = '';
        document.getElementById('questionBatch').value = '';
        document.getElementById('questionDifficulty').value = 'Medium';
        document.getElementById('questionSampleInput').value = '';
        document.getElementById('questionSampleOutput').value = '';
        document.getElementById('questionsMessage').innerHTML = '';
        
        // Reset hierarchy selects
        document.getElementById('questionCollege').innerHTML = '<option value="">-- Select College --</option>';
        document.getElementById('questionDepartment').innerHTML = '<option value="">-- Select Department --</option>';
        document.getElementById('questionBatch').innerHTML = '<option value="">-- Select Batch --</option>';
        document.getElementById('questionTopic').innerHTML = '<option value="">-- Select Topic --</option>';
    }
};
