const pool = require('../config/database');

// Get all workspaces for organization
const getWorkspaces = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.name as created_by_name,
              (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id) as task_count
       FROM workspaces w
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.organization_id = $1
       ORDER BY w.created_at DESC`,
      [req.organizationId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('GetWorkspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get single workspace
const getWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT w.*, u.name as created_by_name,
              (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id) as task_count
       FROM workspaces w
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.id = $1 AND w.organization_id = $2`,
      [id, req.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('GetWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create workspace
const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required.'
      });
    }

    const result = await pool.query(
      `INSERT INTO workspaces (organization_id, name, description, color, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.organizationId, name, description, color || '#00D9FF', req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('CreateWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update workspace
const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Check if workspace exists and belongs to organization
    const workspaceCheck = await pool.query(
      'SELECT id FROM workspaces WHERE id = $1 AND organization_id = $2',
      [id, req.organizationId]
    );

    if (workspaceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.'
      });
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (color !== undefined) {
      paramCount++;
      updates.push(`color = $${paramCount}`);
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.organizationId);

    const query = `
      UPDATE workspaces
      SET ${updates.join(', ')}
      WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Workspace updated successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('UpdateWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Delete workspace
const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are tasks in this workspace
    const taskCheck = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE workspace_id = $1',
      [id]
    );

    if (parseInt(taskCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete workspace with existing tasks. Please delete or move tasks first.'
      });
    }

    const result = await pool.query(
      'DELETE FROM workspaces WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, req.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.'
      });
    }

    res.json({
      success: true,
      message: 'Workspace deleted successfully.'
    });

  } catch (error) {
    console.error('DeleteWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
};
