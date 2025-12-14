const pool = require('../config/database');
const { minioClient, bucketName } = require('../config/minio');
const crypto = require('crypto');

const updateName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name.'
      });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, profile_photo',
      [name.trim(), req.user.id]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Name updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: user.profile_photo
        }
      }
    });

  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during name update.'
    });
  }
};

const updatePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a photo file.'
      });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${req.user.id}-${crypto.randomBytes(16).toString('hex')}.${fileExt}`;

    await minioClient.putObject(
      bucketName,
      fileName,
      req.file.buffer,
      req.file.size,
      {
        'Content-Type': req.file.mimetype
      }
    );

    const currentUserResult = await pool.query(
      'SELECT profile_photo FROM users WHERE id = $1',
      [req.user.id]
    );

    const oldPhoto = currentUserResult.rows[0]?.profile_photo;

    if (oldPhoto) {
      const oldFileName = oldPhoto.split('/').pop();
      try {
        await minioClient.removeObject(bucketName, oldFileName);
      } catch (deleteError) {
        console.error('Error deleting old photo:', deleteError);
      }
    }

    const photoUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;

    const result = await pool.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, email, name, profile_photo',
      [photoUrl, req.user.id]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Photo updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: user.profile_photo
        }
      }
    });

  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during photo upload.'
    });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const currentUserResult = await pool.query(
      'SELECT profile_photo FROM users WHERE id = $1',
      [req.user.id]
    );

    const oldPhoto = currentUserResult.rows[0]?.profile_photo;

    if (oldPhoto) {
      const oldFileName = oldPhoto.split('/').pop();
      try {
        await minioClient.removeObject(bucketName, oldFileName);
      } catch (deleteError) {
        console.error('Error deleting photo:', deleteError);
      }
    }

    const result = await pool.query(
      'UPDATE users SET profile_photo = NULL WHERE id = $1 RETURNING id, email, name, profile_photo',
      [req.user.id]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Photo deleted successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: user.profile_photo
        }
      }
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during photo deletion.'
    });
  }
};

module.exports = { updateName, updatePhoto, deletePhoto };
