/**
 * Questions Module - Role-based Question Management
 * Handles question CRUD operations with role-aware hierarchical selection
 */

const Questions = {
    questions: [],
    editingId: null,
    currentRole: null,
    colleges: [],
    departments: [],
    batches: [],
    topics: [],
    pendingTestCases: null,

    /**
     * Initialize questions module
     */
    async init() {
        this.currentRole = Auth.getCurrentUser()?.role || 'student';
    },

    /**
     * Helper: Find college name by ID
     */
    findCollegeNameById(collegeId) {
        if (!collegeId) return 'N/A';
        const college = this.colleges.find(c => c.id === collegeId);
        return college ? (college.college_name || college.name) : 'N/A';
    },

    /**
     * Helper: Find department name by ID
     */
    findDepartmentNameById(departmentId) {
        if (!departmentId) return 'N/A';
        const department = this.departments.find(d => d.id === departmentId);
        return department ? (department.department_name || department.name) : 'N/A';
    },

    /**
     * Helper: Find batch name by ID
     */
    findBatchNameById(batchId) {
        if (!batchId) return 'N/A';
        const batch = this.batches.find(b => b.id === batchId);
        return batch ? batch.batch_name : 'N/A';
    },

    /**
     * Helper: Find topic name by ID
     */
    findTopicNameById(topicId) {
        if (!topicId) return 'N/A';
        const topic = this.topics.find(t => t.id === topicId);
        return topic ? (topic.topic_name || topic.name) : 'N/A';
    },

    /**
     * Load questions based on user role
     */
    async load() {
        try {
            await this.init();
            await this.loadQuestions();
        } catch (error) {
            console.error('Questions load error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load questions', 'error');
        }
    },

    /**
     * Load questions from appropriate endpoint
     */
    async loadQuestions() {
        try {
            let url = '/student/questions';
            const user = Auth.getCurrentUser();
            
            if (user.role === 'admin') {
                url = '/admin/questions';
                await this.loadHierarchyData();
            } else if (user.role === 'college') {
                url = '/college/questions';
            } else if (user.role === 'department') {
                url = '/department/questions';
            } else if (user.role === 'batch') {
                url = '/batch/questions';
            }

            const response = await Utils.apiRequest(url);
            this.questions = response.data?.questions || response.questions || [];
            this.render();
        } catch (error) {
            console.error('Load questions error:', error);
            Utils.showMessage('questionsMessage', 'Failed to load questions', 'error');
        }
    },

    /**
     * Load all hierarchy data
     */
    async loadHierarchyData() {
        try {
            const [collegesRes, deptsRes, batchesRes, topicsRes] = await Promise.all([
                Utils.apiRequest('/admin/colleges'),
                Utils.apiRequest('/admin/departments'),
                Utils.apiRequest('/admin/batches'),
                Utils.apiRequest('/admin/topics')
            ]);

            this.colleges = collegesRes.data?.colleges || collegesRes.colleges || [];
            this.departments = deptsRes.data?.departments || deptsRes.departments || [];
            this.batches = batchesRes.data?.batches || batchesRes.batches || [];
            this.topics = topicsRes.data?.topics || topicsRes.topics || [];
        } catch (error) {
            console.error('Load hierarchy data error:', error);
        }
    },

    /**
     * Render questions table or list
     */
    render() {
        const isAdminPanel = !!document.getElementById('adminQuestionFormPanel');
        
        if (isAdminPanel) {
            this.renderAdminList();
        } else {
            this.renderTable();
        }
    },

    /**
     * Render questions as clickable list for admin panel
     */
    renderAdminList() {
        const container = document.getElementById('adminQuestionsList');
        if (!container) return;

        if (!this.questions || this.questions.length === 0) {
            container.innerHTML = '<div style="color: #999; text-align: center; padding: 1rem;">No questions found</div>';
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
        
        const self = this;
        this.questions.forEach(q => {
            const collegeNm = self.findCollegeNameById(q.college_id);
            const deptName = self.findDepartmentNameById(q.department_id);
            const isSelected = self.editingId === q.id;
            const bgColor = isSelected ? 'background-color: #e7f3ff; border-left: 3px solid #007bff;' : 'border-left: 3px solid transparent;';
            
            html += '<div style="padding: 0.75rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; ' + bgColor + '" data-qid="' + q.id + '" class="qitem">';
            html += '<div style="font-weight: bold; margin-bottom: 0.25rem; color: #333;">' + Utils.escapeHtml(q.title) + '</div>';
            html += '<div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">' + Utils.escapeHtml(collegeNm) + ' > ' + Utils.escapeHtml(deptName) + '</div>';
            html += '<div style="font-size: 0.75rem; color: #999;">' + Utils.escapeHtml(q.difficulty || 'Medium') + '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        container.querySelectorAll('.qitem').forEach(item => {
            item.addEventListener('click', function() {
                const qid = this.getAttribute('data-qid');
                self.selectForEdit(qid);
            });
        });
    },

    /**
     * Render questions as table
     */
    renderTable() {
        const container = document.getElementById('adminQuestionsList') || document.getElementById('questionsList');
        if (!container) return;

        if (!this.questions || this.questions.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary">No questions found</div>';
            return;
        }

        const user = Auth.getCurrentUser();
        const canManage = ['admin', 'college', 'department', 'batch'].includes(user.role);

        let html = '<table class="table"><thead><tr>';
        html += '<th>Title</th><th>College</th><th>Department</th><th>Batch</th><th>Topic</th><th>Difficulty</th>';
        if (canManage) html += '<th>Actions</th>';
        html += '</tr></thead><tbody>';
        
        const self = this;
        this.questions.forEach(q => {
            html += '<tr>';
            html += '<td>' + Utils.escapeHtml(q.title) + '</td>';
            html += '<td>' + Utils.escapeHtml(self.findCollegeNameById(q.college_id)) + '</td>';
            html += '<td>' + Utils.escapeHtml(self.findDepartmentNameById(q.department_id)) + '</td>';
            html += '<td>' + Utils.escapeHtml(self.findBatchNameById(q.batch_id)) + '</td>';
            html += '<td>' + Utils.escapeHtml(self.findTopicNameById(q.topic_id) || q.topic_name || 'N/A') + '</td>';
            html += '<td><span class="badge badge-info">' + Utils.escapeHtml(q.difficulty || 'Medium') + '</span></td>';
            if (canManage) {
                html += '<td class="flex-gap">';
                html += '<button class="btn btn-sm btn-secondary ebtn" data-qid="' + q.id + '">Edit</button>';
                html += '<button class="btn btn-sm btn-danger dbtn" data-qid="' + q.id + '">Delete</button>';
                html += '</td>';
            }
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        if (canManage) {
            container.querySelectorAll('.ebtn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const qid = this.getAttribute('data-qid');
                    self.edit(qid);
                });
            });
            
            container.querySelectorAll('.dbtn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const qid = this.getAttribute('data-qid');
                    self.delete(qid);
                });
            });
        }
    },

    /**
     * Select question for editing
     */
    selectForEdit(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        this.editingId = questionId;
        this.renderAdminList();
        this.showEditForm(question);
        this.showQuestionDetails(question);
    },

    /**
     * Show edit form
     */
    showEditForm(question) {
        const container = document.getElementById('adminQuestionFormPanel');
        if (!container) return;

        const user = Auth.getCurrentUser();
        const isAdmin = user.role === 'admin';
        const self = this;

        let html = '<div style="background: white; padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">';
        html += '<input type="hidden" id="adminQEditId" value="' + question.id + '" />';
        
        if (isAdmin) {
            html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">College:</label>';
            html += '<select id="adminQEditCollege" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">';
            html += '<option value="">-- Select --</option>';
            this.colleges.forEach(c => {
                const sel = c.id === question.college_id ? ' selected' : '';
                html += '<option value="' + c.id + '"' + sel + '>' + Utils.escapeHtml(c.college_name || c.name) + '</option>';
            });
            html += '</select></div>';

            html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Department:</label>';
            html += '<select id="adminQEditDept" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">';
            html += '<option value="">-- Select --</option>';
            this.departments.filter(d => d.college_id === question.college_id).forEach(d => {
                const sel = d.id === question.department_id ? ' selected' : '';
                html += '<option value="' + d.id + '"' + sel + '>' + Utils.escapeHtml(d.department_name || d.name) + '</option>';
            });
            html += '</select></div>';

            html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Batch:</label>';
            html += '<select id="adminQEditBatch" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">';
            html += '<option value="">-- Select --</option>';
            this.batches.filter(b => b.department_id === question.department_id).forEach(b => {
                const sel = b.id === question.batch_id ? ' selected' : '';
                html += '<option value="' + b.id + '"' + sel + '>' + Utils.escapeHtml(b.batch_name) + '</option>';
            });
            html += '</select></div>';
        }

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Topic:</label>';
        html += '<select id="adminQEditTopic" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">';
        html += '<option value="">-- Select --</option>';
        this.topics.forEach(t => {
            const sel = t.id === question.topic_id ? ' selected' : '';
            html += '<option value="' + t.id + '"' + sel + '>' + Utils.escapeHtml(t.topic_name || t.name) + '</option>';
        });
        html += '</select></div>';

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Title:</label>';
        html += '<input type="text" id="adminQEditTitle" value="' + Utils.escapeHtml(question.title) + '" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" /></div>';

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Description:</label>';
        html += '<textarea id="adminQEditDesc" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 80px;">' + Utils.escapeHtml(question.description) + '</textarea></div>';

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Sample Input:</label>';
        html += '<textarea id="adminQEditInput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 60px; font-family: monospace;">' + Utils.escapeHtml(question.sample_input) + '</textarea></div>';

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Sample Output:</label>';
        html += '<textarea id="adminQEditOutput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 60px; font-family: monospace;">' + Utils.escapeHtml(question.sample_output) + '</textarea></div>';

        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.9rem; font-weight: bold;">Difficulty:</label>';
        html += '<select id="adminQEditDiff" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">';
        html += '<option value="Easy"' + (question.difficulty === 'Easy' ? ' selected' : '') + '>Easy</option>';
        html += '<option value="Medium"' + (question.difficulty === 'Medium' ? ' selected' : '') + '>Medium</option>';
        html += '<option value="Hard"' + (question.difficulty === 'Hard' ? ' selected' : '') + '>Hard</option>';
        html += '</select></div>';

        html += '<div id="adminQEditMessage" style="margin-bottom: 0.75rem;"></div>';
        html += '<div style="display: flex; gap: 0.5rem;"><button class="btn btn-primary" id="qsave" style="flex: 1;">Save Changes</button>';
        html += '<button class="btn btn-danger" id="qdel" style="flex: 1;">Delete</button></div></div>';

        container.innerHTML = html;

        document.getElementById('qsave').addEventListener('click', function() { self.saveAdminQuestionInline(); });
        document.getElementById('qdel').addEventListener('click', function() { self.deleteConfirmAdminPanel(); });

        if (isAdmin) {
            document.getElementById('adminQEditCollege').addEventListener('change', function() { self.onAdminQEditCollegeChange(); });
            document.getElementById('adminQEditDept').addEventListener('change', function() { self.onAdminQEditDeptChange(); });
        }
    },

    /**
     * Show question details
     */
    showQuestionDetails(question) {
        const container = document.getElementById('adminQuestionDetailPanel');
        if (!container) return;

        const topicName = this.findTopicNameById(question.topic_id);
        const hiddenTestcases = question.hidden_testcases || [];
        const self = this;

        let html = '<div style="padding: 0; background: white; border-radius: 4px; max-height: 600px; overflow-y: auto;">';
        
        // Header
        html += '<div style="padding: 1rem;"><h4 style="margin: 0 0 0.75rem 0; color: #333;">' + Utils.escapeHtml(question.title) + '</h4>';
        html += '<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">';
        html += '<span style="background: #e7f3ff; color: #0056b3; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">' + Utils.escapeHtml(topicName) + '</span>';
        html += '<span style="background: #fff3cd; color: #856404; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">' + Utils.escapeHtml(question.difficulty || 'Medium') + '</span>';
        html += '</div></div>';

        // Open Test Cases (Sample Input/Output)
        html += '<div style="border-top: 1px solid #ddd; padding: 1rem;"><h5 style="margin: 0 0 0.75rem 0; color: #555; font-size: 0.9rem;">Open Test Case (Sample):</h5>';
        html += '<div style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">';
        html += '<div style="margin-bottom: 0.5rem;"><strong>Input:</strong><br>' + Utils.escapeHtml(question.sample_input) + '</div>';
        html += '<div><strong>Output:</strong><br>' + Utils.escapeHtml(question.sample_output) + '</div></div></div>';

        // Hidden Test Cases
        html += '<div style="border-top: 1px solid #ddd; padding: 1rem;">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">';
        html += '<h5 style="margin: 0; color: #155724; font-size: 0.9rem;">Hidden Test Cases (' + hiddenTestcases.length + ')</h5>';
        html += '<button id="qaddtest" style="padding: 0.4rem 0.75rem; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">+ Add</button>';
        html += '</div>';

        if (hiddenTestcases && hiddenTestcases.length > 0) {
            html += '<div style="display: grid; gap: 0.75rem; max-height: 300px; overflow-y: auto;">';
            hiddenTestcases.forEach((tc, idx) => {
                html += '<div style="padding: 0.75rem; background: #f0f8ff; border: 1px solid #b3d9ff; border-radius: 4px;">';
                html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">';
                html += '<div style="font-weight: 500; color: #0056b3; font-size: 0.85rem;">Test ' + (idx + 1) + '</div>';
                html += '<div style="display: flex; gap: 0.25rem;">';
                html += '<button class="qtcedit" data-tcidx="' + idx + '" style="padding: 0.25rem 0.5rem; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem;">Edit</button>';
                html += '<button class="qtcdel" data-tcidx="' + idx + '" style="padding: 0.25rem 0.5rem; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem;">Delete</button>';
                html += '</div></div>';
                html += '<div style="font-family: monospace; font-size: 0.8rem; color: #555;">';
                html += '<div><strong>Input:</strong><br>' + Utils.escapeHtml((tc.input || '').substring(0, 60)) + '</div>';
                html += '<div><strong>Output:</strong><br>' + Utils.escapeHtml((tc.expected_output || '').substring(0, 60)) + '</div></div></div>';
            });
            html += '</div>';
        } else {
            html += '<div style="color: #999; font-style: italic;">No hidden test cases yet</div>';
        }
        html += '</div>';

        // Generate AI Test Cases Button
        html += '<div style="border-top: 1px solid #ddd; padding: 1rem;">';
        html += '<button id="qtestgen" style="padding: 0.75rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; width: 100%; margin-bottom: 1rem;">Generate with AI</button>';
        html += '</div>';

        html += '<div id="adminQTestCaseContainer" style="display: none; padding: 1rem; border-top: 1px solid #ddd;"></div>';
        html += '<div id="adminQEditTestCasePanel" style="display: none; padding: 1rem; border-top: 1px solid #ddd;"></div>';
        html += '</div>';

        container.innerHTML = html;

        // Event listeners
        document.getElementById('qtestgen').addEventListener('click', function() {
            self.generateTestCasesForAdmin(question.id);
        });

        document.getElementById('qaddtest').addEventListener('click', function() {
            self.showAddTestCaseForm(question.id, hiddenTestcases.length);
        });

        document.querySelectorAll('.qtcedit').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-tcidx'));
                self.showEditTestCaseForm(question.id, idx, hiddenTestcases[idx]);
            });
        });

        document.querySelectorAll('.qtcdel').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-tcidx'));
                self.deleteTestCase(question.id, idx);
            });
        });
    },

    /**
     * Show form to add new test case
     */
    showAddTestCaseForm(questionId, testCaseNum) {
        const panel = document.getElementById('adminQEditTestCasePanel');
        if (!panel) return;

        const self = this;
        let html = '<div style="background: #e8f5e9; border: 1px solid #81c784; border-radius: 4px; padding: 1rem;">';
        html += '<h5 style="margin: 0 0 0.75rem 0; color: #2e7d32;">Add New Test Case</h5>';
        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.85rem; font-weight: bold;">Input:</label>';
        html += '<textarea id="qnewtcinput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 0.8rem; min-height: 60px; box-sizing: border-box;"></textarea></div>';
        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.85rem; font-weight: bold;">Expected Output:</label>';
        html += '<textarea id="qnewtcoutput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 0.8rem; min-height: 60px; box-sizing: border-box;"></textarea></div>';
        html += '<div style="display: flex; gap: 0.5rem;">';
        html += '<button id="qsavenewtc" style="padding: 0.5rem 1rem; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem; flex: 1;">Add Test Case</button>';
        html += '<button id="qcancnewtc" style="padding: 0.5rem 1rem; background: #999; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem; flex: 1;">Cancel</button>';
        html += '</div></div>';

        panel.innerHTML = html;
        panel.style.display = 'block';

        document.getElementById('qsavenewtc').addEventListener('click', function() {
            self.saveNewTestCase(questionId);
        });

        document.getElementById('qcancnewtc').addEventListener('click', function() {
            panel.style.display = 'none';
        });
    },

    /**
     * Show form to edit test case
     */
    showEditTestCaseForm(questionId, tcIdx, testcase) {
        const panel = document.getElementById('adminQEditTestCasePanel');
        if (!panel) return;

        const self = this;
        let html = '<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 1rem;">';
        html += '<h5 style="margin: 0 0 0.75rem 0; color: #856404;">Edit Test Case ' + (tcIdx + 1) + '</h5>';
        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.85rem; font-weight: bold;">Input:</label>';
        html += '<textarea id="qedittcinput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 0.8rem; min-height: 60px; box-sizing: border-box;">' + Utils.escapeHtml(testcase.input || '') + '</textarea></div>';
        html += '<div style="margin-bottom: 0.75rem;"><label style="font-size: 0.85rem; font-weight: bold;">Expected Output:</label>';
        html += '<textarea id="qedittcoutput" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 0.8rem; min-height: 60px; box-sizing: border-box;">' + Utils.escapeHtml(testcase.expected_output || '') + '</textarea></div>';
        html += '<div style="display: flex; gap: 0.5rem;">';
        html += '<button id="qsaveedittc" style="padding: 0.5rem 1rem; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem; flex: 1;">Update Test Case</button>';
        html += '<button id="qcancedittc" style="padding: 0.5rem 1rem; background: #999; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85rem; flex: 1;">Cancel</button>';
        html += '</div></div>';

        panel.innerHTML = html;
        panel.style.display = 'block';

        document.getElementById('qsaveedittc').addEventListener('click', function() {
            self.saveEditTestCase(questionId, tcIdx);
        });

        document.getElementById('qcancedittc').addEventListener('click', function() {
            panel.style.display = 'none';
        });
    },

    /**
     * Save new test case
     */
    async saveNewTestCase(questionId) {
        const input = document.getElementById('qnewtcinput').value.trim();
        const output = document.getElementById('qnewtcoutput').value.trim();

        if (!input || !output) {
            alert('Please fill in both input and output');
            return;
        }

        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const testcases = question.hidden_testcases || [];
        testcases.push({ input, expected_output: output });

        try {
            const user = Auth.getCurrentUser();
            const endpoint = user.role === 'admin' ? '/admin/questions/' : '/batch/questions/';
            
            const response = await fetch(CONFIG.API_BASE_URL + endpoint + questionId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ hidden_testcases: testcases })
            });

            if (!response.ok) throw new Error('Save failed');

            Utils.showMessage('adminMessage', 'Test case added', 'success');
            document.getElementById('adminQEditTestCasePanel').style.display = 'none';
            await this.loadQuestions();
        } catch (error) {
            alert('Failed to add test case: ' + error.message);
        }
    },

    /**
     * Save edited test case
     */
    async saveEditTestCase(questionId, tcIdx) {
        const input = document.getElementById('qedittcinput').value.trim();
        const output = document.getElementById('qedittcoutput').value.trim();

        if (!input || !output) {
            alert('Please fill in both input and output');
            return;
        }

        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const testcases = question.hidden_testcases || [];
        if (tcIdx >= 0 && tcIdx < testcases.length) {
            testcases[tcIdx] = { input, expected_output: output };
        }

        try {
            const user = Auth.getCurrentUser();
            const endpoint = user.role === 'admin' ? '/admin/questions/' : '/batch/questions/';
            
            const response = await fetch(CONFIG.API_BASE_URL + endpoint + questionId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ hidden_testcases: testcases })
            });

            if (!response.ok) throw new Error('Save failed');

            Utils.showMessage('adminMessage', 'Test case updated', 'success');
            document.getElementById('adminQEditTestCasePanel').style.display = 'none';
            await this.loadQuestions();
        } catch (error) {
            alert('Failed to update test case: ' + error.message);
        }
    },

    /**
     * Delete test case
     */
    async deleteTestCase(questionId, tcIdx) {
        if (!confirm('Delete this test case?')) return;

        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const testcases = question.hidden_testcases || [];
        testcases.splice(tcIdx, 1);

        try {
            const user = Auth.getCurrentUser();
            const endpoint = user.role === 'admin' ? '/admin/questions/' : '/batch/questions/';
            
            const response = await fetch(CONFIG.API_BASE_URL + endpoint + questionId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ hidden_testcases: testcases })
            });

            if (!response.ok) throw new Error('Save failed');

            Utils.showMessage('adminMessage', 'Test case deleted', 'success');
            await this.loadQuestions();
        } catch (error) {
            alert('Failed to delete test case: ' + error.message);
        }
    },

    /**
     * Save question inline
     */
    async saveAdminQuestionInline() {
        const questionId = document.getElementById('adminQEditId').value;
        const user = Auth.getCurrentUser();
        
        const payload = {
            title: document.getElementById('adminQEditTitle').value.trim(),
            description: document.getElementById('adminQEditDesc').value.trim(),
            sample_input: document.getElementById('adminQEditInput').value.trim(),
            sample_output: document.getElementById('adminQEditOutput').value.trim(),
            difficulty: document.getElementById('adminQEditDiff').value
        };

        if (user.role === 'admin') {
            payload.college_id = document.getElementById('adminQEditCollege').value;
            payload.department_id = document.getElementById('adminQEditDept').value;
            payload.batch_id = document.getElementById('adminQEditBatch').value;
            payload.topic_id = document.getElementById('adminQEditTopic').value;
        } else {
            payload.topic_id = document.getElementById('adminQEditTopic').value;
        }

        try {
            const url = user.role === 'admin' ? '/admin/questions/' + questionId : '/batch/questions/' + questionId;
            await Utils.apiRequest(url, { method: 'PUT', body: JSON.stringify(payload) });
            Utils.showMessage('adminMessage', 'Question updated successfully', 'success');
            await this.loadQuestions();
        } catch (error) {
            const msgEl = document.getElementById('adminQEditMessage');
            if (msgEl) msgEl.textContent = 'Update failed: ' + error.message;
        }
    },

    /**
     * Delete confirm
     */
    async deleteConfirmAdminPanel() {
        if (!confirm('Delete this question permanently?')) return;
        const questionId = document.getElementById('adminQEditId').value;
        this.delete(questionId);
    },

    /**
     * Generate test cases
     */
    async generateTestCasesForAdmin(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        try {
            const btn = document.getElementById('qtestgen');
            if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

            const user = Auth.getCurrentUser();
            const endpoint = user.role === 'admin' ? '/admin/generate-testcases' : '/batch/generate-testcases';
            
            const response = await fetch(CONFIG.API_BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ question_id: questionId, description: question.description, sample_input: question.sample_input, sample_output: question.sample_output })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Generation failed');

            const testcases = data.data?.testcases || [];
            this.displayGeneratedTestCasesAdmin(questionId, testcases);
            Utils.showMessage('adminMessage', 'Generated ' + testcases.length + ' test cases', 'success');
        } catch (error) {
            Utils.showMessage('adminMessage', 'Failed to generate: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('qtestgen');
            if (btn) { btn.disabled = false; btn.textContent = 'Generate Hidden Test Cases'; }
        }
    },

    /**
     * Display generated test cases
     */
    displayGeneratedTestCasesAdmin(questionId, testcases) {
        const container = document.getElementById('adminQTestCaseContainer');
        if (!container || !testcases.length) return;

        const self = this;
        let html = '<div style="padding: 1rem; background: #f0f8ff; border-radius: 4px; border-left: 4px solid #28a745;">';
        html += '<h5 style="margin: 0 0 1rem 0; color: #155724;">Generated Test Cases (' + testcases.length + ')</h5>';
        html += '<div style="display: grid; gap: 0.75rem; max-height: 250px; overflow-y: auto; margin-bottom: 1rem;">';
        
        testcases.forEach((tc, idx) => {
            html += '<div style="padding: 0.75rem; background: white; border: 1px solid #dee2e6; border-radius: 4px;"><div style="font-weight: 500; margin-bottom: 0.5rem;">Test ' + (idx + 1) + '</div>';
            html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem;">';
            html += '<div><span style="color: #666; font-size: 0.8rem;">Input:</span><div style="font-family: monospace; background: #f9f9f9; padding: 0.5rem; border-radius: 3px; word-break: break-all;">' + Utils.escapeHtml((tc.input || '').substring(0, 60)) + '</div></div>';
            html += '<div><span style="color: #666; font-size: 0.8rem;">Output:</span><div style="font-family: monospace; background: #f9f9f9; padding: 0.5rem; border-radius: 3px; word-break: break-all;">' + Utils.escapeHtml((tc.expected_output || '').substring(0, 60)) + '</div></div>';
            html += '</div></div>';
        });
        
        html += '</div><button id="qsavtest" style="padding: 0.75rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; width: 100%;">Save Test Cases</button></div>';

        container.innerHTML = html;
        container.style.display = 'block';
        this.pendingTestCases = { questionId, testcases };

        document.getElementById('qsavtest').addEventListener('click', function() {
            self.saveTestCasesAdmin(questionId);
        });
    },

    /**
     * Save test cases
     */
    async saveTestCasesAdmin(questionId) {
        if (!this.pendingTestCases) return;

        try {
            const user = Auth.getCurrentUser();
            const endpoint = user.role === 'admin' ? '/admin/questions/' : '/batch/questions/';
            
            const response = await fetch(CONFIG.API_BASE_URL + endpoint + questionId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ hidden_testcases: this.pendingTestCases.testcases })
            });

            if (!response.ok) throw new Error('Save failed');

            Utils.showMessage('adminMessage', 'Test cases saved', 'success');
            this.pendingTestCases = null;
            const container = document.getElementById('adminQTestCaseContainer');
            if (container) container.style.display = 'none';
            await this.loadQuestions();
        } catch (error) {
            Utils.showMessage('adminMessage', 'Save failed: ' + error.message, 'error');
        }
    },

    /**
     * College change handler
     */
    onAdminQEditCollegeChange() {
        const collegeId = document.getElementById('adminQEditCollege').value;
        const deptSelect = document.getElementById('adminQEditDept');
        if (!deptSelect) return;

        deptSelect.innerHTML = '<option value="">-- Select --</option>';
        this.departments.filter(d => d.college_id === collegeId).forEach(d => {
            const option = document.createElement('option');
            option.value = d.id;
            option.textContent = d.department_name || d.name;
            deptSelect.appendChild(option);
        });
    },

    /**
     * Department change handler
     */
    onAdminQEditDeptChange() {
        const deptId = document.getElementById('adminQEditDept').value;
        const batchSelect = document.getElementById('adminQEditBatch');
        if (!batchSelect) return;

        batchSelect.innerHTML = '<option value="">-- Select --</option>';
        this.batches.filter(b => b.department_id === deptId).forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.batch_name;
            batchSelect.appendChild(option);
        });
    },

    /**
     * Edit question
     */
    async edit(id) {
        try {
            let url = '/student/questions/' + id;
            const user = Auth.getCurrentUser();
            
            if (user.role === 'admin') {
                url = '/admin/questions/' + id;
            } else if (user.role === 'college') {
                url = '/college/questions/' + id;
            } else if (user.role === 'department') {
                url = '/department/questions/' + id;
            } else if (user.role === 'batch') {
                url = '/batch/questions/' + id;
            }

            const response = await Utils.apiRequest(url);
            const question = response.data?.question || response.question || {};

            document.getElementById('questionTitle').value = question.title || '';
            document.getElementById('questionDescription').value = question.description || '';
            document.getElementById('questionSampleInput').value = question.sample_input || '';
            document.getElementById('questionSampleOutput').value = question.sample_output || '';
            document.getElementById('questionDifficulty').value = question.difficulty || 'Medium';
            document.getElementById('questionTopic').value = question.topic_id || '';

            this.editingId = id;
            
            const headerEl = document.querySelector('#questionModal .modal-header h3');
            if (headerEl) headerEl.textContent = 'Edit Question';
            const submitBtn = document.querySelector('#questionModal [type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Question';
            
            UI.openModal('questionModal');
        } catch (error) {
            Utils.alert('Failed to load question: ' + error.message);
        }
    },

    /**
     * Delete question
     */
    async delete(id) {
        if (!confirm('Delete this question permanently?')) return;

        try {
            let url = '/student/questions/' + id;
            const user = Auth.getCurrentUser();
            
            if (user.role === 'admin') {
                url = '/admin/questions/' + id;
            } else if (user.role === 'college') {
                url = '/college/questions/' + id;
            } else if (user.role === 'department') {
                url = '/department/questions/' + id;
            } else if (user.role === 'batch') {
                url = '/batch/questions/' + id;
            }

            await Utils.apiRequest(url, { method: 'DELETE' });
            this.loadQuestions();
            Utils.showMessage('questionsMessage', 'Question deleted', 'success');
        } catch (error) {
            Utils.showMessage('questionsMessage', 'Delete failed: ' + error.message, 'error');
        }
    },

    /**
     * Save question
     */
    async save() {
        try {
            const title = document.getElementById('questionTitle').value.trim();
            const description = document.getElementById('questionDescription').value.trim();
            const sampleInput = document.getElementById('questionSampleInput').value.trim();
            const sampleOutput = document.getElementById('questionSampleOutput').value.trim();
            const difficulty = document.getElementById('questionDifficulty').value || 'Medium';

            if (!title || !description || !sampleInput || !sampleOutput) {
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

            const user = Auth.getCurrentUser();
            const payload = {
                title,
                description,
                sample_input: sampleInput,
                sample_output: sampleOutput,
                difficulty
            };

            let url = '/admin/questions';
            if (user.role === 'admin') {
                const collegeId = document.getElementById('questionCollege').value.trim();
                const departmentId = document.getElementById('questionDepartment').value.trim();
                const batchId = document.getElementById('questionBatch').value.trim();
                const topicId = document.getElementById('questionTopic').value.trim();
                
                if (!collegeId || !departmentId || !batchId || !topicId) {
                    Utils.showMessage('questionsMessage', 'Please select College, Department, Batch, and Topic', 'error');
                    return;
                }
                
                payload.college_id = collegeId;
                payload.department_id = departmentId;
                payload.batch_id = batchId;
                payload.topic_id = topicId;
            } else if (user.role === 'college') {
                url = '/college/questions';
            } else if (user.role === 'department') {
                url = '/department/questions';
            } else if (user.role === 'batch') {
                url = '/batch/questions';
                const topicId = document.getElementById('questionTopic').value.trim();
                if (topicId) {
                    payload.topic_id = topicId;
                }
            }

            const method = this.editingId ? 'PUT' : 'POST';
            if (this.editingId) {
                url += '/' + this.editingId;
            }

            await Utils.apiRequest(url, {
                method,
                body: JSON.stringify(payload)
            });

            this.loadQuestions();
            UI.closeModal('questionModal');
            Utils.showMessage('questionsMessage', 
                this.editingId ? 'Question updated' : 'Question created', 
                'success');
        } catch (error) {
            Utils.showMessage('questionsMessage', 'Save failed: ' + error.message, 'error');
        }
    }
};
