import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import { FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user, organization } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        taskAPI.getStats(),
        taskAPI.getAll({ limit: 5 })
      ]);

      setStats(statsRes.data.data);
      setRecentTasks(tasksRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: FiTrendingUp,
      color: 'cyan',
      gradient: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)'
    },
    {
      title: 'In Progress',
      value: stats?.in_progress_count || 0,
      icon: FiClock,
      color: 'purple',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D3DC4 100%)'
    },
    {
      title: 'Completed',
      value: stats?.completed_count || 0,
      icon: FiCheckCircle,
      color: 'green',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      title: 'Overdue',
      value: stats?.overdue_count || 0,
      icon: FiAlertCircle,
      color: 'red',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    }
  ];

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header fade-in">
          <div>
            <h1>Welcome back, <span className="gradient-text">{user?.name}</span></h1>
            <p>Here's what's happening with your tasks today</p>
          </div>
          <div className="org-info glass-effect">
            <span>{organization?.name}</span>
            <span className="badge">{organization?.subscriptionPlan}</span>
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="stat-card glass-effect card-hover slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-header">
                <div className="stat-icon" style={{ background: stat.gradient }}>
                  <stat.icon />
                </div>
                <div className="stat-info">
                  <p className="stat-title">{stat.title}</p>
                  <h2 className="stat-value">{stat.value}</h2>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="recent-tasks fade-in">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <a href="/tasks" className="view-all">View All →</a>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state glass-effect">
              <p>No tasks yet. Create your first task to get started!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {recentTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="task-item glass-effect card-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="task-content">
                    <div className="task-header-row">
                      <h3>{task.title}</h3>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="task-description">{task.description || 'No description'}</p>
                    <div className="task-meta">
                      {task.workspace_name && (
                        <span className="workspace-tag" style={{ borderColor: task.workspace_color }}>
                          {task.workspace_name}
                        </span>
                      )}
                      {task.assigned_to_name && (
                        <span className="assigned-to">👤 {task.assigned_to_name}</span>
                      )}
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
