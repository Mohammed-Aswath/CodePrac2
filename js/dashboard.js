/**
 * Dashboard Module
 */

const Dashboard = {
    /**
     * Load dashboard data
     */
    async load() {
        try {
            const user = Auth.getCurrentUser();

            if (user.role === 'student') {
                await this.loadStudentDashboard();
            } else {
                await this.loadAdminDashboard();
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    },

    /**
     * Load student dashboard
     */
    async loadStudentDashboard() {
        try {
            const response = await Utils.apiRequest('/student/performance');
            const performance = response.data?.performance || response.performance || [];

            // Calculate stats from performance data
            const totalSubmissions = performance.length;
            const correctSubmissions = performance.filter(p => p.status === 'correct').length;
            const uniqueQuestions = new Set(performance.map(p => p.question_id)).size;
            const successRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

            // Build dashboard HTML
            const dashboardContent = document.getElementById('dashboardContent');
            if (dashboardContent) {
                dashboardContent.innerHTML = `
                    <div class="dashboard-grid">
                        <div class="stat-card">
                            <h3>Total Submissions</h3>
                            <div class="value">${totalSubmissions}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Questions Solved</h3>
                            <div class="value" style="color: var(--success);">${correctSubmissions}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Unique Questions</h3>
                            <div class="value" style="color: var(--warning);">${uniqueQuestions}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Success Rate</h3>
                            <div class="value" style="color: var(--info);">${successRate}%</div>
                        </div>
                    </div>
                `;
            }

            // Load recent activity
            await this.loadRecentActivity(performance);
        } catch (error) {
            console.error('Student dashboard error:', error);
            Utils.showMessage('dashboardMessage', 'Failed to load dashboard stats', 'error');
        }
    },

    /**
     * Load admin dashboard
     */
    async loadAdminDashboard() {
        try {
            // Could add admin-specific stats here
            console.log('Admin dashboard loaded');
        } catch (error) {
            console.error('Admin dashboard error:', error);
        }
    },

    /**
     * Load recent activity
     */
    async loadRecentActivity(performance) {
        try {
            const activitySection = document.getElementById('activitySection');
            if (!activitySection) return;

            if (!performance || performance.length === 0) {
                activitySection.innerHTML = `
                    <div class="card">
                        <h2>Recent Activity</h2>
                        <p class="text-secondary">No submissions yet. Start practicing!</p>
                    </div>
                `;
                return;
            }

            // Show 5 most recent submissions
            const recentSubmissions = performance.slice(0, 5);

            activitySection.innerHTML = `
                <div class="card">
                    <div class="card-header">Recent Activity</div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Question ID</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentSubmissions.map(submission => `
                                    <tr>
                                        <td>${Utils.escapeHtml(submission.question_id || 'Unknown')}</td>
                                        <td>
                                            <span class="badge ${submission.status === 'correct' ? 'badge-success' : submission.status === 'execution_error' ? 'badge-danger' : 'badge-warning'}">
                                                ${submission.status || 'pending'}
                                            </span>
                                        </td>
                                        <td>${Utils.formatDate(submission.submitted_at || new Date().toISOString())}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Load activity error:', error);
        }
    }
};
