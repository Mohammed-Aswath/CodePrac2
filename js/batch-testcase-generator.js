/**
 * Batch Admin - Test Case Generation
 * For generating hidden test cases for questions
 */

const BatchTestCaseGenerator = {
    // State
    questions: [],
    selectedQuestion: null,
    generatingTestCases: false,

    // API Endpoints
    questionsEndpoint: `${CONFIG.API_BASE_URL}/batch/questions`,
    generateTestcasesEndpoint: `${CONFIG.API_BASE_URL}/batch/generate-testcases`,

    /**
     * Initialize test case generator
     */
    async init() {
        try {
            await this.loadQuestions();
            this.setupEventListeners();
        } catch (error) {
            console.error('Test case generator init error:', error);
            Utils.showMessage('testCaseMessage', 'Failed to initialize test case generator', 'error');
        }
    },

    /**
     * Load all questions for batch
     */
    async loadQuestions() {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(this.questionsEndpoint, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load questions');
            }

            const data = await response.json();
            this.questions = data.data?.questions || data.questions || [];
            this.renderQuestionsList();

        } catch (error) {
            console.error('Load questions error:', error);
            Utils.showMessage('testCaseMessage', 'Failed to load questions: ' + error.message, 'error');
        }
    },

    /**
     * Render list of questions
     */
    renderQuestionsList() {
        const container = document.getElementById('testCaseQuestionsList');
        if (!container) return;

        if (!this.questions || this.questions.length === 0) {
            container.innerHTML = '<p style="color: #999;">No questions available</p>';
            return;
        }

        container.innerHTML = this.questions.map(q => `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.2s;" 
                 onmouseover="this.style.background='var(--bg-elevated)'" 
                 onmouseout="this.style.background='transparent'"
                 onclick="BatchTestCaseGenerator.selectQuestion('${q.id}')">
                <div style="font-weight: 500; color: var(--text-main);">${this.escapeHtml(q.title || q.question_title)}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Sample: ${this.escapeHtml((q.sample_input || '').substring(0, 30))}</div>
            </div>
        `).join('');
    },

    /**
     * Select question for test case generation
     */
    selectQuestion(questionId) {
        this.selectedQuestion = this.questions.find(q => q.id === questionId);
        if (!this.selectedQuestion) {
            Utils.showMessage('testCaseMessage', 'Question not found', 'error');
            return;
        }

        this.renderQuestionDetails();
    },

    /**
     * Render selected question details and form
     */
    renderQuestionDetails() {
        const container = document.getElementById('testCaseForm');
        if (!container || !this.selectedQuestion) return;

        const q = this.selectedQuestion;

        container.innerHTML = `
            <div style="padding: 1.5rem; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border-subtle);">
                <h3 style="margin-top: 0; color: var(--text-main);">${this.escapeHtml(q.title || q.question_title)}</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--text-muted); margin-top: 1rem;">Description</h4>
                    <div style="padding: 1rem; background: var(--bg-app); border-radius: 4px; border: 1px solid var(--border-subtle); color: var(--text-body);">
                        ${this.escapeHtml(q.description || 'No description').substring(0, 200)}...
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h4 style="color: var(--text-muted);">Sample Input</h4>
                        <div class="generated-test-case-box" style="padding: 0.75rem; border-radius: 4px; max-height: 100px; overflow-y: auto;">
                            ${this.escapeHtml(q.sample_input || 'N/A')}
                        </div>
                    </div>
                    <div>
                        <h4 style="color: var(--text-muted);">Sample Output</h4>
                         <div class="generated-test-case-box" style="padding: 0.75rem; border-radius: 4px; max-height: 100px; overflow-y: auto;">
                            ${this.escapeHtml(q.sample_output || 'N/A')}
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-elevated); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="BatchTestCaseGenerator.generateTestCases()" 
                                class="btn btn-primary"
                                style="flex: 1;"
                                id="generateBtn">
                            Generate Test Cases
                        </button>
                        <button onclick="BatchTestCaseGenerator.clearSelection()" 
                                class="btn btn-secondary"
                                style="flex: 1;">
                            Clear
                        </button>
                    </div>
                </div>

                <div id="testCaseResults" style="display: none;"></div>
            </div>
        `;
    },

    /**
     * Generate test cases for selected question
     */
    async generateTestCases() {
        if (!this.selectedQuestion) {
            Utils.showMessage('testCaseMessage', 'Please select a question first', 'error');
            return;
        }

        const required = ['description', 'sample_input', 'sample_output'];
        const missing = required.filter(field => !this.selectedQuestion[field]);

        if (missing.length > 0) {
            Utils.showMessage('testCaseMessage', `Question missing required fields: ${missing.join(', ')}`, 'error');
            return;
        }

        try {
            const generateBtn = document.getElementById('generateBtn');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating...';
            }

            Utils.showMessage('testCaseMessage', 'Generating test cases using AI...', 'info');

            const response = await fetch(this.generateTestcasesEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    question_id: this.selectedQuestion.id,
                    description: this.selectedQuestion.description,
                    sample_input: this.selectedQuestion.sample_input,
                    sample_output: this.selectedQuestion.sample_output
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Test case generation failed');
            }

            this.displayTestCases(data.data?.testcases || data.testcases || []);
            Utils.showMessage('testCaseMessage', 'Test cases generated successfully', 'success');

        } catch (error) {
            console.error('Generate test cases error:', error);
            Utils.showMessage('testCaseMessage', 'Failed to generate test cases: ' + error.message, 'error');
        } finally {
            const generateBtn = document.getElementById('generateBtn');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Test Cases';
            }
        }
    },

    /**
     * Display generated test cases
     */
    displayTestCases(testcases) {
        const container = document.getElementById('testCaseResults');
        if (!container) return;

        if (!testcases || testcases.length === 0) {
            container.innerHTML = '<p style="color: #999;">No test cases generated</p>';
            return;
        }

        let html = `
            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 4px; border-left: 4px solid var(--success);">
                <h4 style="margin-top: 0; color: var(--success);">Generated Test Cases (${testcases.length})</h4>
                <div style="display: grid; gap: 1rem;">
        `;

        testcases.forEach((tc, index) => {
            html += `
                <div style="padding: 0.75rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 4px;">
                    <div style="font-weight: 500; color: var(--text-main); margin-bottom: 0.5rem;">Test Case ${index + 1}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">Input:</span>
                            <div class="generated-test-case-box" style="padding: 0.5rem; border-radius: 3px; word-break: break-all;">
                                ${this.escapeHtml(tc.input || tc.test_input || 'N/A')}
                            </div>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">Expected Output:</span>
                            <div class="generated-test-case-box" style="padding: 0.5rem; border-radius: 3px; word-break: break-all;">
                                ${this.escapeHtml(tc.expected_output || 'N/A')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div style="margin-top: 1rem;">
                    <button onclick="BatchTestCaseGenerator.saveTestCases()" 
                            class="btn btn-success">
                        Save Test Cases
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';
    },

    /**
     * Save test cases to question
     */
    async saveTestCases() {
        if (!this.selectedQuestion) {
            Utils.showMessage('testCaseMessage', 'No question selected', 'error');
            return;
        }

        try {
            Utils.showMessage('testCaseMessage', 'Saving test cases...', 'info');

            // The testcases would have been already displayed, here we would send update to backend
            const response = await fetch(`${this.questionsEndpoint}/${this.selectedQuestion.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    // Update would include test cases
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save test cases');
            }

            Utils.showMessage('testCaseMessage', 'Test cases saved successfully', 'success');
            this.clearSelection();

        } catch (error) {
            console.error('Save test cases error:', error);
            Utils.showMessage('testCaseMessage', 'Failed to save test cases: ' + error.message, 'error');
        }
    },

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedQuestion = null;
        document.getElementById('testCaseForm').innerHTML = '';
        document.getElementById('testCaseResults').innerHTML = '';
        document.getElementById('testCaseResults').style.display = 'none';
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Any additional event listeners can be set up here
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
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

window.BatchTestCaseGenerator = BatchTestCaseGenerator;
