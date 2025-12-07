const pool = require('../config/database');

// Get all tasks for organization
const getTasks = async (req, res) => {
  try {
    const { workspace_id, status, assigned_to } = req.query;
    let query = `
      SELECT t.*,
             u.name as assigned_to_name,
             c.name as created_by_name,
             w.name as workspace_name,
             w.color as workspace_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.organization_id = $1
    `;
    const params = [req.organizationId];
    let paramCount = 1;

    if (workspace_id) {
      paramCount++;
      query += ` AND t.workspace_id = $${paramCount}`;
      params.push(workspace_id);
    }

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (assigned_to) {
      paramCount++;
      query += ` AND t.assigned_to = $${paramCount}`;
      params.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('GetTasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*,
              u.name as assigned_to_name,
              c.name as created_by_name,
              w.name as workspace_name,
              w.color as workspace_color
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN workspaces w ON t.workspace_id = w.id
       WHERE t.id = $1 AND t.organization_id = $2`,
      [id, req.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('GetTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const { workspace_id, title, description, priority, assigned_to, due_date } = req.body;

    if (!workspace_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and title are required.'
      });
    }

    // Verify workspace belongs to organization
    const workspaceCheck = await pool.query(
      'SELECT id FROM workspaces WHERE id = $1 AND organization_id = $2',
      [workspace_id, req.organizationId]
    );

    if (workspaceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.'
      });
    }

    // If assigned_to is provided, verify user belongs to organization
    if (assigned_to) {
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
        [assigned_to, req.organizationId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found in your organization.'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (organization_id, workspace_id, title, description, priority, assigned_to, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.organizationId, workspace_id, title, description, priority || 'medium', assigned_to, req.user.id, due_date]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    // Check if task exists and belongs to organization
    const taskCheck = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND organization_id = $2',
      [id, req.organizationId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);

      // If status is completed, set completed_at
      if (status === 'completed') {
        paramCount++;
        updates.push(`completed_at = $${paramCount}`);
        params.push(new Date());
      }
    }

    if (priority !== undefined) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
    }

    if (assigned_to !== undefined) {
      // Verify user belongs to organization
      if (assigned_to !== null) {
        const userCheck = await pool.query(
          'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
          [assigned_to, req.organizationId]
        );

        if (userCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user not found in your organization.'
          });
        }
      }

      paramCount++;
      updates.push(`assigned_to = $${paramCount}`);
      params.push(assigned_to);
    }

    if (due_date !== undefined) {
      paramCount++;
      updates.push(`due_date = $${paramCount}`);
      params.push(due_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    // Add updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    // Add WHERE clause params
    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.organizationId);

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, req.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });

  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_count
       FROM tasks
       WHERE organization_id = $1`,
      [req.organizationId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('GetTaskStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};
