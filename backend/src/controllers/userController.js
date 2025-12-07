const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Get all users in organization
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [req.organizationId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Invite/Create new user
const inviteUser = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    // Only admin can invite users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can invite users.'
      });
    }

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required.'
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (organization_id, email, password, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, created_at`,
      [req.organizationId, email, hashedPassword, name, role || 'member']
    );

    res.status(201).json({
      success: true,
      message: 'User invited successfully.',
      data: {
        user: result.rows[0],
        temporaryPassword: tempPassword
      }
    });

  } catch (error) {
    console.error('InviteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    // Only admin can update other users
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile.'
      });
    }

    // Verify user belongs to same organization
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [id, req.organizationId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
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

    // Only admin can change roles
    if (role !== undefined && req.user.role === 'admin') {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    // Only admin can activate/deactivate users
    if (is_active !== undefined && req.user.role === 'admin') {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
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

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, is_active, created_at
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = {
  getUsers,
  inviteUser,
  updateUser
};
