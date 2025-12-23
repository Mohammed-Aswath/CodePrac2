/**
 * Student Practice Module - LeetCode-style interface
 * Three-phase flow: Topic Selection → Question Selection → Code Editor with Problem Solving
 * CRITICAL: Student MUST select topic AND question before accessing code editor
 */

const StudentPractice = {
    // State
    topics: [],
    selectedTopic: null,
    questions: [],
    selectedQuestion: null,
    notes: [],
    currentLanguage: 'python',
    code: '',
    results: null,
    customTestCases: [],  // Array of {input, expected_output}

    // Phase tracking
    currentPhase: 'topics', // 'topics', 'questions', or 'editor'

    // API Endpoints
    topicsEndpoint: `${CONFIG.API_BASE_URL}/student/topics`,
    questionsEndpoint: `${CONFIG.API_BASE_URL}/student/questions`,
    notesEndpoint: `${CONFIG.API_BASE_URL}/student/notes`,

    /**
     * Load student practice page
     * Validates hierarchy and shows topic selection phase
     */
    async load() {
        try {
            const user = Auth.getCurrentUser();

            // Display hierarchy for debugging
            console.log('🔍 Student hierarchy:', {
                college_id: user.college_id,
                department_id: user.department_id,
                batch_id: user.batch_id,
                student_id: user.student_id
            });

            document.getElementById('collegeDisplay').textContent = user.college_id || 'NOT SET';
            document.getElementById('departmentDisplay').textContent = user.department_id || 'NOT SET';
            document.getElementById('batchDisplay').textContent = user.batch_id || 'NOT SET';
            document.getElementById('studentIdDisplay').textContent = user.student_id || 'NOT SET';

            // CRITICAL GUARD: Student must have complete hierarchy
            if (!user.college_id || !user.department_id || !user.batch_id) {
                const missingFields = [];
                if (!user.college_id) missingFields.push("college");
                if (!user.department_id) missingFields.push("department");
                if (!user.batch_id) missingFields.push("batch");

                const message = `Your student account is incomplete. Missing: ${missingFields.join(', ')}. ` +
                    `Please contact your department administrator to complete your profile.`;
                Utils.showMessage('practiceMessage', message, 'error');
                console.error('Student hierarchy incomplete:', { college_id: user.college_id, department_id: user.department_id, batch_id: user.batch_id });
                return;
            }

            // Hierarchy complete - load topics and notes
            await this.loadTopics();
            await this.loadNotes();
            this.showPhase('topics');
        } catch (error) {
            console.error('Student practice load error:', error);
            Utils.showMessage('practiceMessage', 'Failed to load practice topics', 'error');
        }
    },

    /**
     * Load all topics for student's batch
     */
    async loadTopics() {
        const token = localStorage.getItem('token');

        console.log('🔍 Loading topics...');
        console.log('Token:', token ? 'Present' : 'MISSING');
        console.log('Endpoint:', this.topicsEndpoint);
        console.log('this (StudentPractice object):', this);

        try {
            const response = await fetch(this.topicsEndpoint, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                console.log('Response data type:', typeof data);
                console.log('Response data keys:', Object.keys(data));
                console.log('data.error:', data.error);
                console.log('data.message:', data.message);
                console.log('data.data:', data.data);
                console.log('data.data?.topics:', data.data?.topics);
                console.log('data.topics:', data.topics);

                this.topics = data.data?.topics || data.topics || [];
                console.log('After assignment, this.topics:', this.topics);
                console.log('Topics loaded:', this.topics.length);
                console.log('Topics array:', this.topics);
                console.log('About to call renderTopics()...');
                this.renderTopics();
                console.log('renderTopics() call completed');
            } else {
                const errorData = await response.json();
                console.error('Load topics error:', response.status, errorData);
                Utils.showMessage('practiceMessage', `Failed to load topics: ${errorData.message || response.status}`, 'error');
            }
        } catch (error) {
            console.error('Load topics error:', error);
            console.error('Error message:', error.message);
            Utils.showMessage('practiceMessage', `Failed to load topics: ${error.message}`, 'error');
        }
    },

    /**
     * Load all notes for student's batch
     */
    async loadNotes() {
        try {
            const response = await fetch(this.notesEndpoint, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.notes = data.data?.notes || data.notes || [];
                this.renderNotes();
            } else {
                console.error('Load notes error:', response.status);
            }
        } catch (error) {
            console.error('Load notes error:', error);
        }
    },

    /**
     * Render notes in notes section
     */
    renderNotes() {
        const container = document.getElementById('studentNotesList');
        if (!container) return;

        if (!this.notes || this.notes.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; color: #999; text-align: center;">No notes available</div>';
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${this.notes.map(note => `
                    <div class="card" style="padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 0.5rem 0; color: #333;">${this.escapeHtml(note.title)}</h4>
                                <p style="margin: 0; font-size: 0.85rem; color: #666;">
                                    ${note.drive_link ? `<a href="${this.escapeHtml(note.drive_link)}" target="_blank" style="color: #007bff; text-decoration: none;">Open Drive Link</a>` : 'No link provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render topics in left sidebar (Phase 1)
     */
    renderTopics() {
        console.log('🎨 renderTopics called');
        console.log('this:', this);
        console.log('this.topics:', this.topics);
        console.log('typeof this.topics:', typeof this.topics);
        console.log('Array.isArray(this.topics):', Array.isArray(this.topics));

        const container = document.getElementById('studentTopicsList');
        console.log('Container element:', container);
        console.log('Container found:', !!container);

        if (!container) {
            console.error('ERROR: studentTopicsList container not found!');
            return;
        }

        try {
            console.log('Topics to render:', this.topics);
            console.log('Topics count:', this.topics?.length || 0);

            if (!this.topics || this.topics.length === 0) {
                console.log('No topics to display, showing empty message');
                container.innerHTML = '<div style="padding: 1rem; color: #999; text-align: center;">No topics available</div>';
                return;
            }

            console.log('Rendering', this.topics.length, 'topics');
            const html = this.topics.map(topic => {
                const topicName = topic.topic_name || topic.name || 'Untitled Topic';
                console.log('Processing topic:', topicName, 'ID:', topic.id);
                return `
                    <div class="card" style="cursor: pointer; margin-bottom: 0.5rem; padding: 0.75rem; ${this.selectedTopic?.id === topic.id ? 'background: #e8f4f8; border: 2px solid #007bff;' : 'border: 1px solid #ddd;'}" 
                         onclick="StudentPractice.selectTopic('${topic.id}')">
                        <h4 style="margin: 0; margin-bottom: 0.25rem; color: #333;">${Utils.escapeHtml(topicName)}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: #666;">
                            Click to view questions
                        </p>
                    </div>
                `;
            }).join('');
            container.innerHTML = html;
            console.log('Topics rendered successfully');
        } catch (error) {
            console.error('ERROR in renderTopics:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            container.innerHTML = '<div style="padding: 1rem; color: red; text-align: center;">Error rendering topics</div>';
        }
    },

    /**
     * Select a topic and load its questions (transition to Phase 2)
     */
    async selectTopic(topicId) {
        try {
            // Find the topic object
            this.selectedTopic = this.topics.find(t => t.id === topicId);
            if (!this.selectedTopic) {
                throw new Error('Topic not found');
            }

            // Load questions for this topic using correct endpoint
            const response = await fetch(`${this.questionsEndpoint}/by-topic/${topicId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.questions = data.data?.questions || data.questions || [];
            } else {
                throw new Error('Failed to load questions');
            }

            // Reset question selection and code
            this.selectedQuestion = null;
            this.code = '';
            this.results = null;
            this.currentLanguage = 'python';

            // Update UI - highlight selected topic and show questions
            this.renderTopics();
            this.renderQuestions();
            this.showPhase('questions');

        } catch (error) {
            console.error('Select topic error:', error);
            Utils.showMessage('practiceMessage', 'Failed to load questions for this topic', 'error');
        }
    },

    /**
     * Render questions for selected topic in middle panel (Phase 2)
     */
    renderQuestions() {
        const container = document.getElementById('studentQuestionsList');
        if (!container) return;

        if (!this.questions || this.questions.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; color: #999; text-align: center;">No questions in this topic</div>';
            return;
        }

        container.innerHTML = this.questions.map(question => `
            <div class="card" style="cursor: pointer; margin-bottom: 0.5rem; padding: 0.75rem; ${this.selectedQuestion?.id === question.id ? 'background: #e8f4f8; border: 2px solid #007bff;' : 'border: 1px solid #ddd;'}"
                 onclick="StudentPractice.selectQuestion('${question.id}')">
                <h4 style="margin: 0; margin-bottom: 0.25rem; color: #333;">
                    ${Utils.escapeHtml(question.title || question.question_title)}
                </h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: #666;">
                        Difficulty: <strong>${question.difficulty || 'Medium'}</strong>
                    </span>
                    <span class="badge" style="background: ${this.getDifficultyColor(question.difficulty)}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.75rem;">
                        ${question.difficulty || 'Medium'}
                    </span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Select a question and show code editor (transition to Phase 3)
     */
    async selectQuestion(questionId) {
        try {
            // Fetch full question details
            const response = await fetch(`${this.questionsEndpoint}/${questionId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            console.log('📝 selectQuestion response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📝 selectQuestion raw data:', data);
                console.log('📝 data.data:', data.data);
                console.log('📝 data.question:', data.question);

                this.selectedQuestion = data.data?.question || data.question || {};
                console.log('📝 this.selectedQuestion:', this.selectedQuestion);
                console.log('📝 this.selectedQuestion.id:', this.selectedQuestion?.id);
            } else {
                throw new Error('Failed to load question details');
            }

            if (!this.selectedQuestion || !this.selectedQuestion.id) {
                console.error('❌ selectedQuestion validation failed:', this.selectedQuestion);
                throw new Error('Question details not found');
            }

            // Reset code and results
            this.code = '';
            this.results = null;
            this.currentLanguage = 'python';
            this.customTestCases = [];  // Reset custom test cases for new question

            // Update UI and show editor
            this.renderQuestions();
            this.renderEditor();
            this.showPhase('editor');

            // Initialize button visibility
            const runBtn = document.getElementById('runBtn');
            const submitBtn = document.getElementById('submitBtn');
            const analyzeEfficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
            
            if (runBtn) runBtn.style.display = 'inline-block';
            if (submitBtn) submitBtn.style.display = 'inline-block';
            if (analyzeEfficiencyBtn) analyzeEfficiencyBtn.style.display = 'none';  // Hidden until correct submission

        } catch (error) {
            console.error('Select question error:', error);
            Utils.showMessage('practiceMessage', 'Failed to load question details', 'error');
        }
    },

    /**
     * Render LeetCode-style code editor and problem statement (Phase 3)
     */
    renderEditor() {
        if (!this.selectedQuestion) return;

        const q = this.selectedQuestion;

        // Update header
        document.getElementById('problemTitle').textContent = Utils.escapeHtml(q.title || q.question_title);
        document.getElementById('problemDifficulty').innerHTML = `
            Difficulty: <strong>${q.difficulty || 'Medium'}</strong> | 
            Topic: <strong>${Utils.escapeHtml(this.selectedTopic?.name || this.selectedTopic?.topic_name || 'N/A')}</strong>
        `;

        // Update problem statement (left panel)
        document.getElementById('problemDescription').innerHTML = Utils.escapeHtml(q.description || 'No description available');

        // Update example input/output
        document.getElementById('exampleInput').textContent = q.sample_input || q.example_input || 'N/A';
        document.getElementById('exampleOutput').textContent = q.sample_output || q.example_output || 'N/A';

        // Show/hide constraints section
        const constraintsSection = document.getElementById('constraintsSection');
        if (q.constraints) {
            document.getElementById('constraints').innerHTML = Utils.escapeHtml(q.constraints);
            constraintsSection.style.display = 'block';
        } else {
            constraintsSection.style.display = 'none';
        }

        // Update code editor
        const editor = document.getElementById('codeEditor');
        if (editor) {
            if (!this.code) {
                // Set default template based on language
                this.code = this.getDefaultTemplate(this.currentLanguage, q.function_name);
            }
            editor.value = this.code;
        }

        // Show/hide Run and Submit buttons
        document.getElementById('runBtn').style.display = 'block';
        document.getElementById('submitBtn').style.display = 'block';

        // Show problem and editor sections
        document.getElementById('problemSection').style.display = 'flex';
        document.getElementById('editorSection').style.display = 'flex';
    },

    /**
     * Change programming language
     */
    changeLanguage(language) {
        this.currentLanguage = language;
        const editor = document.getElementById('codeEditor');
        if (editor && !editor.value.trim()) {
            editor.value = this.getDefaultTemplate(language, this.selectedQuestion?.function_name);
        }
    },

    /**
     * Get default code template for language
     */
    getDefaultTemplate(language, functionName = 'solve') {
        const templates = {
            python: `def ${functionName}(input_str):
    # Write your solution here
    pass
`,
            javascript: `function ${functionName}(inputStr) {
    // Write your solution here
    
}
`,
            java: `public class Solution {
    public static String ${functionName}(String inputStr) {
        // Write your solution here
        return "";
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

string ${functionName}(string input_str) {
    // Write your solution here
    return "";
}

int main() {
    return 0;
}
`
        };
        return templates[language] || templates.python;
    },

    /**
     * Add a custom test case
     */
    addCustomTestCase() {
        const customInput = document.getElementById('customInput');
        const customOutput = document.getElementById('customOutput');

        if (!customInput || !customOutput) {
            Utils.showMessage('practiceMessage', 'Input/output fields not found', 'error');
            return;
        }

        const input = customInput.value.trim();
        const output = customOutput.value.trim();

        if (!input || !output) {
            Utils.showMessage('practiceMessage', 'Please enter both input and expected output', 'error');
            return;
        }

        // Add to custom test cases
        this.customTestCases.push({ input, output });

        // Clear inputs
        customInput.value = '';
        customOutput.value = '';

        // Render custom test cases list
        this.renderCustomTestCases();
        Utils.showMessage('practiceMessage', 'Test case added successfully', 'success');
    },

    /**
     * Remove a custom test case
     */
    removeCustomTestCase(index) {
        this.customTestCases.splice(index, 1);
        this.renderCustomTestCases();
    },

    /**
     * Render list of custom test cases
     */
    renderCustomTestCases() {
        const container = document.getElementById('customTestCasesList');
        if (!container) return;

        if (this.customTestCases.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        let html = '<div style="font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: bold;">Added Test Cases:</div>';

        this.customTestCases.forEach((tc, index) => {
            html += `
                <div style="background: #fff; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">
                                <strong>Input:</strong> <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">${Utils.escapeHtml(tc.input)}</code>
                            </div>
                            <div style="font-size: 0.85rem; color: #666;">
                                <strong>Expected:</strong> <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">${Utils.escapeHtml(tc.output)}</code>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="StudentPractice.removeCustomTestCase(${index})" style="margin-left: 0.5rem;">Remove</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Run code with sample test case (Compiler Agent)
     */
    async runCode() {
        const editor = document.getElementById('codeEditor');
        if (!editor) {
            Utils.showMessage('practiceMessage', 'Code editor not found', 'error');
            return;
        }

        this.code = editor.value;
        if (!this.code.trim()) {
            Utils.showMessage('practiceMessage', 'Please write some code first', 'error');
            return;
        }

        if (!this.selectedQuestion) {
            Utils.showMessage('practiceMessage', 'No question selected', 'error');
            return;
        }

        try {
            const runBtn = document.getElementById('runBtn');
            if (runBtn) runBtn.disabled = true;

            Utils.showMessage('practiceMessage', 'Compiling and running code...', 'info');

            // Collect all test cases (sample + custom)
            const testCases = [];
            
            // Add sample test case
            if (this.selectedQuestion.sample_input) {
                testCases.push({
                    name: 'Sample Test',
                    input: this.selectedQuestion.sample_input,
                    expected: this.selectedQuestion.sample_output || '',
                    is_sample: true
                });
            }

            // Add custom test cases
            this.customTestCases.forEach((tc, index) => {
                testCases.push({
                    name: `Custom Test ${index + 1}`,
                    input: tc.input,
                    expected: tc.output,
                    is_sample: false
                });
            });

            // Run code against all test cases
            const results = [];
            for (const tc of testCases) {
                const response = await fetch(`${CONFIG.API_BASE_URL}/student/run`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        question_id: this.selectedQuestion.id,
                        code: this.code,
                        language: this.currentLanguage,
                        test_input: tc.input
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    results.push({
                        name: tc.name,
                        input: tc.input,
                        expected: tc.expected,
                        is_sample: tc.is_sample,
                        output: null,
                        error: data.message || 'Execution failed',
                        execution_time: 0
                    });
                } else {
                    results.push({
                        name: tc.name,
                        input: tc.input,
                        expected: tc.expected,
                        is_sample: tc.is_sample,
                        output: data.data?.output || '',
                        error: data.data?.error || null,
                        execution_time: data.data?.execution_time || 0
                    });
                }
            }

            this.results = {
                type: 'run',
                test_results: results
            };

            this.renderResults();

            const hasErrors = results.some(r => r.error);
            if (!hasErrors) {
                Utils.showMessage('practiceMessage', `Code executed successfully for all ${results.length} test case(s)`, 'success');
            } else {
                Utils.showMessage('practiceMessage', 'Some test cases had errors', 'error');
            }

        } catch (error) {
            console.error('Run code error:', error);
            Utils.showMessage('practiceMessage', 'Execution failed: ' + error.message, 'error');
        } finally {
            const runBtn = document.getElementById('runBtn');
            if (runBtn) runBtn.disabled = false;
        }
    },

    /**
     * Submit code for full evaluation (Evaluator + Efficiency Agents)
     */
    async submitCode() {
        const editor = document.getElementById('codeEditor');
        if (!editor) {
            Utils.showMessage('practiceMessage', 'Code editor not found', 'error');
            return;
        }

        this.code = editor.value;
        if (!this.code.trim()) {
            Utils.showMessage('practiceMessage', 'Please write some code first', 'error');
            return;
        }

        if (!this.selectedQuestion) {
            Utils.showMessage('practiceMessage', 'No question selected', 'error');
            return;
        }

        try {
            const submitBtn = document.getElementById('submitBtn');
            const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
            if (submitBtn) submitBtn.disabled = true;
            if (efficiencyBtn) efficiencyBtn.disabled = true;

            Utils.showMessage('practiceMessage', 'Evaluating your solution...', 'info');

            const response = await fetch(`${CONFIG.API_BASE_URL}/student/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    question_id: this.selectedQuestion.id,
                    code: this.code,
                    language: this.currentLanguage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Code evaluation failed');
            }

            this.results = {
                type: 'submit',
                status: data.data?.status || 'incorrect',
                is_correct: data.data?.status === 'correct',
                test_results: data.data?.test_results || {},
                efficiency_feedback: null,  // Don't show efficiency feedback until button clicked
                performance_id: data.data?.performance_id || null
            };

            this.renderResults();

            if (this.results.is_correct) {
                Utils.showMessage('practiceMessage', 'Correct! All test cases passed!', 'success');
                // Show Analyze Efficiency button only if code is correct
                const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
                if (efficiencyBtn) efficiencyBtn.style.display = 'inline-block';
            } else {
                Utils.showMessage('practiceMessage', 'Incorrect solution. Review the test results.', 'error');
                // Hide Analyze Efficiency button if code is incorrect
                const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
                if (efficiencyBtn) efficiencyBtn.style.display = 'none';
            }

        } catch (error) {
            console.error('Submit code error:', error);
            Utils.showMessage('practiceMessage', 'Submission failed: ' + error.message, 'error');
        } finally {
            const submitBtn = document.getElementById('submitBtn');
            const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
            if (submitBtn) submitBtn.disabled = false;
            if (efficiencyBtn && efficiencyBtn.style.display === 'inline-block') efficiencyBtn.disabled = false;
        }
    },

    /**
     * Analyze efficiency of correct solution
     */
    async analyzeEfficiency() {
        if (!this.results || !this.results.is_correct) {
            Utils.showMessage('practiceMessage', 'Please submit a correct solution first', 'error');
            return;
        }

        if (!this.selectedQuestion) {
            Utils.showMessage('practiceMessage', 'No question selected', 'error');
            return;
        }

        try {
            const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
            if (efficiencyBtn) efficiencyBtn.disabled = true;

            Utils.showMessage('practiceMessage', 'Analyzing code efficiency...', 'info');

            const response = await fetch(`${CONFIG.API_BASE_URL}/student/efficiency`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    question_id: this.selectedQuestion.id,
                    code: this.code,
                    language: this.currentLanguage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Efficiency analysis failed');
            }

            this.results.efficiency_feedback = data.data;
            this.renderResults();
            Utils.showMessage('practiceMessage', 'Efficiency analysis complete', 'success');

        } catch (error) {
            console.error('Efficiency analysis error:', error);
            Utils.showMessage('practiceMessage', 'Efficiency analysis failed: ' + error.message, 'error');
        } finally {
            const efficiencyBtn = document.getElementById('analyzeEfficiencyBtn');
            if (efficiencyBtn) efficiencyBtn.disabled = false;
        }
    },

    /**
     * Render test results in results section - matching prototype design
     */
    renderResults() {
        const container = document.getElementById('testResults');
        if (!container || !this.results) return;

        const r = this.results;
        
        let html = '';

        // For RUN type: Show only output for all test cases (no status)
        if (r.type === 'run') {
            if (!r.test_results || r.test_results.length === 0) {
                html = '<div style="color: #ccc;">No test results available</div>';
            } else {
                // Display each test case result
                r.test_results.forEach((result, index) => {
                    const isSample = result.is_sample;
                    html += `
                        <div style="background: #1e1e1e; color: #fff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #444;">
                            <!-- Test case header -->
                            <div style="margin-bottom: 1rem;">
                                <strong>${Utils.escapeHtml(result.name)}</strong>
                                ${isSample ? '<span style="margin-left: 0.5rem; font-size: 0.85rem; color: #90ee90;">(Sample)</span>' : '<span style="margin-left: 0.5rem; font-size: 0.85rem; color: #87ceeb;">(Custom)</span>'}
                            </div>
                            
                            <!-- Input -->
                            <div style="margin-bottom: 0.75rem;">
                                <div style="font-size: 0.9rem; color: #a0aec0; margin-bottom: 0.25rem;">Input:</div>
                                <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; max-height: 100px; overflow-y: auto;">
                                    <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #e0e0e0; font-size: 0.9rem;">${Utils.escapeHtml(result.input)}</pre>
                                </div>
                            </div>
                            
                            <!-- Show ONLY Error if present, otherwise show Output + Expected -->
                            ${result.error ? `
                                <div style="padding: 0.75rem; background: rgba(248, 113, 113, 0.1); border-left: 3px solid #f87171; border-radius: 4px;">
                                    <div style="font-size: 0.9rem; color: #fca5a5; font-weight: bold; margin-bottom: 0.25rem;">Error:</div>
                                    <div style="color: #fca5a5; font-size: 0.9rem;">${Utils.escapeHtml(result.error)}</div>
                                </div>
                            ` : `
                                <!-- Output -->
                                <div style="margin-bottom: 0.75rem;">
                                    <div style="font-size: 0.9rem; color: #a0aec0; margin-bottom: 0.25rem;">Output:</div>
                                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; max-height: 100px; overflow-y: auto;">
                                        <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #e0e0e0; font-size: 0.9rem;">${Utils.escapeHtml(result.output || '')}</pre>
                                    </div>
                                </div>
                                
                                <!-- Expected Output -->
                                <div>
                                    <div style="font-size: 0.9rem; color: #a0aec0; margin-bottom: 0.25rem;">Expected Output:</div>
                                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; max-height: 100px; overflow-y: auto;">
                                        <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #90ee90; font-size: 0.9rem;">${Utils.escapeHtml(result.expected)}</pre>
                                    </div>
                                </div>
                            `}
                        </div>
                    `;
                });
            }
        } 
        // For SUBMIT type: Show status and test breakdown
        else if (r.type === 'submit') {
            // Determine status
            let statusClass = 'incorrect';
            let statusText = 'Incorrect';
            
            if (r.is_correct || r.status === 'correct') {
                statusClass = 'correct';
                statusText = 'Correct';
            } else if (r.status === 'execution_error' || r.error) {
                statusClass = 'error';
                statusText = 'Execution Error';
            }

            html = `
                <div style="background: #1e1e1e; color: #fff; padding: 1.5rem; border-radius: 8px; font-family: monospace;">
                    <div style="margin-bottom: 1rem;">
                        <strong>Status:</strong> <span style="color: ${statusClass === 'correct' ? '#4ade80' : statusClass === 'error' ? '#f87171' : '#facc15'};">${statusText}</span>
                    </div>
            `;

            // Show reason if available
            if (r.test_results && r.test_results.reason) {
                html += `<div style="margin-bottom: 1rem; color: #ccc;">Reason: ${Utils.escapeHtml(r.test_results.reason)}</div>`;
            }

            // Show execution error
            if (r.error) {
                html += `
                    <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(248, 113, 113, 0.1); border-left: 3px solid #f87171; border-radius: 4px;">
                        <strong>Error:</strong><br>
                        <span style="color: #fca5a5; font-size: 0.9rem;">${Utils.escapeHtml(r.error)}</span>
                    </div>
                `;
            }

            // Show test results breakdown
            if (r.test_results) {
                const tr = r.test_results;
                if (tr.is_correct !== undefined) {
                    html += `
                        <div style="margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid #444;">
                            <strong>Test Results:</strong><br>
                            <div style="margin-top: 0.5rem; color: #ccc;">
                                <div>Total Passed: <strong style="color: #4ade80;">${tr.is_correct ? 'All' : 'Some'} tests passed</strong></div>
                            </div>
                        </div>
                    `;
                }
            }

            // Show efficiency feedback if available
            if (r.efficiency_feedback) {
                const eff = r.efficiency_feedback;
                html += `
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #444;">
                        <strong>Efficiency Analysis:</strong><br>
                        <div style="margin-top: 0.75rem; color: #ccc;">
                `;

                if (eff.time_complexity) {
                    html += `<div style="margin-bottom: 0.5rem;">
                        <span style="color: #a0aec0;">Time Complexity:</span> <strong>${Utils.escapeHtml(eff.time_complexity)}</strong>
                    </div>`;
                }

                if (eff.space_complexity) {
                    html += `<div style="margin-bottom: 0.5rem;">
                        <span style="color: #a0aec0;">Space Complexity:</span> <strong>${Utils.escapeHtml(eff.space_complexity)}</strong>
                    </div>`;
                }

                if (eff.approach_summary) {
                    html += `<div style="margin-bottom: 0.5rem;">
                        <span style="color: #a0aec0;">Approach:</span> ${Utils.escapeHtml(eff.approach_summary)}
                    </div>`;
                }

                if (eff.improvement_suggestions) {
                    html += `<div style="margin-bottom: 0.5rem;">
                        <span style="color: #a0aec0;">Suggestions:</span> ${Utils.escapeHtml(eff.improvement_suggestions)}
                    </div>`;
                }

                if (eff.optimal_method) {
                    html += `<div>
                        <span style="color: #a0aec0;">Optimal Method:</span> ${Utils.escapeHtml(eff.optimal_method)}
                    </div>`;
                }

                html += `
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
        }

        container.innerHTML = html;
        document.getElementById('resultsSection').style.display = 'block';
    },

    /**
     * Switch between Practice and Notes tabs
     */
    switchTab(tabName) {
        const practiceTab = document.getElementById('practiceTabContent');
        const notesTab = document.getElementById('notesTabContent');
        const practiceBtn = document.querySelector('button[onclick="StudentPractice.switchTab(\'practice\')"]');
        const notesBtn = document.getElementById('notesTabBtn');

        if (tabName === 'practice') {
            practiceTab.style.display = 'block';
            notesTab.style.display = 'none';
            practiceBtn.style.borderBottomColor = '#007bff';
            practiceBtn.style.color = '#007bff';
            notesBtn.style.borderBottomColor = 'transparent';
            notesBtn.style.color = '#666';
        } else if (tabName === 'notes') {
            practiceTab.style.display = 'none';
            notesTab.style.display = 'block';
            practiceBtn.style.borderBottomColor = 'transparent';
            practiceBtn.style.color = '#666';
            notesBtn.style.borderBottomColor = '#007bff';
            notesBtn.style.color = '#007bff';
        }
    },

    /**
     * Show/hide phases and update UI visibility
     */
    showPhase(phase) {
        this.currentPhase = phase;

        // Get panel elements
        const topicsPhasePanel = document.getElementById('topicsPhasePanel');
        const questionsPhasePanel = document.getElementById('questionsPhasePanel');
        const editorPhasePanel = document.getElementById('editorPhasePanel');

        // Hide all panels first
        if (topicsPhasePanel) topicsPhasePanel.style.display = 'none';
        if (questionsPhasePanel) questionsPhasePanel.style.display = 'none';
        if (editorPhasePanel) editorPhasePanel.style.display = 'none';

        // Show selected phase
        if (phase === 'topics') {
            if (topicsPhasePanel) topicsPhasePanel.style.display = 'flex';
        } else if (phase === 'questions') {
            if (questionsPhasePanel) questionsPhasePanel.style.display = 'flex';
        } else if (phase === 'editor') {
            if (editorPhasePanel) editorPhasePanel.style.display = 'flex';
        }
    },

    /**
     * Navigate back to questions from editor
     */
    goBackToQuestions() {
        this.selectedQuestion = null;
        this.code = '';
        this.results = null;
        document.getElementById('problemSection').style.display = 'none';
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        this.showPhase('questions');
    },

    /**
     * Navigate back to topics from questions
     */
    goBackToTopics() {
        this.selectedTopic = null;
        this.questions = [];
        this.selectedQuestion = null;
        this.code = '';
        this.results = null;
        this.renderQuestions();
        document.getElementById('problemSection').style.display = 'none';
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        this.showPhase('topics');
    },

    /**
     * Get color for difficulty badge
     */
    getDifficultyColor(difficulty) {
        const difficulty_lower = (difficulty || 'medium').toLowerCase();
        if (difficulty_lower === 'easy') return '#28a745';
        if (difficulty_lower === 'medium') return '#ffc107';
        if (difficulty_lower === 'hard') return '#dc3545';
        return '#6c757d';
    },

    /**
     * Escape HTML to prevent XSS
     */
    /**
     * Toggle custom test cases panel visibility
     */
    toggleCustomTestCasesPanel() {
        const panel = document.getElementById('customTestCasesPanel');
        const toggle = document.getElementById('customTestCasesToggle');
        
        if (panel && toggle) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                panel.style.display = 'none';
                toggle.textContent = '▶';
            }
        }
    },

    /**
     * Toggle results panel visibility (minimize/expand)
     */
    toggleResultsPanel() {
        const resultsSection = document.getElementById('resultsSection');
        const testResults = document.getElementById('testResults');
        
        if (resultsSection && testResults) {
            if (testResults.style.display === 'none') {
                testResults.style.display = 'block';
            } else {
                testResults.style.display = 'none';
            }
        }
    },

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

window.StudentPractice = StudentPractice;
