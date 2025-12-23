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
                    <div class="grid grid-cols-4" style="margin-bottom: 2rem;">
                        <div class="card" style="text-align: center;">
                            <p class="text-secondary" style="margin-bottom: 0.5rem;">Total Submissions</p>
                            <h2 style="margin: 0; color: #007bff;">${totalSubmissions}</h2>
                        </div>
                        <div class="card" style="text-align: center;">
                            <p class="text-secondary" style="margin-bottom: 0.5rem;">Questions Solved</p>
                            <h2 style="margin: 0; color: #28a745;">${correctSubmissions}</h2>
                        </div>
                        <div class="card" style="text-align: center;">
                            <p class="text-secondary" style="margin-bottom: 0.5rem;">Unique Questions Attempted</p>
                            <h2 style="margin: 0; color: #ffc107;">${uniqueQuestions}</h2>
                        </div>
                        <div class="card" style="text-align: center;">
                            <p class="text-secondary" style="margin-bottom: 0.5rem;">Success Rate</p>
                            <h2 style="margin: 0; color: #17a2b8;">${successRate}%</h2>
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
                    <h2>Recent Activity</h2>
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
            `;
        } catch (error) {
            console.error('Load activity error:', error);
        }
    }
};
