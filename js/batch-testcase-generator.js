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
            <div style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; hover: background: #f9f9f9;" onclick="BatchTestCaseGenerator.selectQuestion('${q.id}')">
                <div style="font-weight: 500; color: #333;">${this.escapeHtml(q.title || q.question_title)}</div>
                <div style="font-size: 0.85rem; color: #999;">Sample Input: ${this.escapeHtml((q.sample_input || '').substring(0, 30))}</div>
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
            <div style="padding: 1.5rem; background: #f9f9f9; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">${this.escapeHtml(q.title || q.question_title)}</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #555; margin-top: 1rem;">Description</h4>
                    <div style="padding: 1rem; background: white; border-radius: 4px; border: 1px solid #ddd; color: #666;">
                        ${this.escapeHtml(q.description || 'No description').substring(0, 200)}...
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h4 style="color: #555;">Sample Input</h4>
                        <div style="padding: 0.75rem; background: white; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #333; max-height: 100px; overflow-y: auto;">
                            ${this.escapeHtml(q.sample_input || 'N/A')}
                        </div>
                    </div>
                    <div>
                        <h4 style="color: #555;">Sample Output</h4>
                        <div style="padding: 0.75rem; background: white; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #333; max-height: 100px; overflow-y: auto;">
                            ${this.escapeHtml(q.sample_output || 'N/A')}
                        </div>
                    </div>
                </div>

                <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="BatchTestCaseGenerator.generateTestCases()" 
                                style="flex: 1; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;"
                                id="generateBtn">
                            Generate Test Cases
                        </button>
                        <button onclick="BatchTestCaseGenerator.clearSelection()" 
                                style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
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
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f0f8ff; border-radius: 4px; border-left: 4px solid #007bff;">
                <h4 style="margin-top: 0; color: #0056b3;">Generated Test Cases (${testcases.length})</h4>
                <div style="display: grid; gap: 1rem;">
        `;

        testcases.forEach((tc, index) => {
            html += `
                <div style="padding: 0.75rem; background: white; border: 1px solid #dee2e6; border-radius: 4px;">
                    <div style="font-weight: 500; color: #333; margin-bottom: 0.5rem;">Test Case ${index + 1}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div>
                            <span style="color: #666; font-size: 0.85rem;">Input:</span>
                            <div style="font-family: monospace; color: #333; font-size: 0.85rem; background: #f9f9f9; padding: 0.5rem; border-radius: 3px; word-break: break-all;">
                                ${this.escapeHtml(tc.input || tc.test_input || 'N/A')}
                            </div>
                        </div>
                        <div>
                            <span style="color: #666; font-size: 0.85rem;">Expected Output:</span>
                            <div style="font-family: monospace; color: #333; font-size: 0.85rem; background: #f9f9f9; padding: 0.5rem; border-radius: 3px; word-break: break-all;">
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
                            style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
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
