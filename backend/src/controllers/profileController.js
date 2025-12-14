const pool = require('../config/database');
const { uploadToS3, deleteFromS3, getSignedUrlForObject } = require('../config/s3');
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
    let profilePhoto = user.profile_photo;

    if (profilePhoto && profilePhoto.startsWith('profiles/')) {
      profilePhoto = await getSignedUrlForObject(profilePhoto, 86400);
    }

    res.json({
      success: true,
      message: 'Name updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: profilePhoto
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
    const fileName = `profiles/${req.user.id}-${crypto.randomBytes(16).toString('hex')}.${fileExt}`;

    await uploadToS3(fileName, req.file.buffer, req.file.mimetype);

    const currentUserResult = await pool.query(
      'SELECT profile_photo FROM users WHERE id = $1',
      [req.user.id]
    );

    const oldPhoto = currentUserResult.rows[0]?.profile_photo;

    if (oldPhoto && oldPhoto.startsWith('profiles/')) {
      try {
        await deleteFromS3(oldPhoto);
      } catch (deleteError) {
        console.error('Error deleting old photo:', deleteError);
      }
    }

    const result = await pool.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, email, name, profile_photo',
      [fileName, req.user.id]
    );

    const user = result.rows[0];
    const signedUrl = await getSignedUrlForObject(fileName, 86400);

    res.json({
      success: true,
      message: 'Photo updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: signedUrl
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

    if (oldPhoto && oldPhoto.startsWith('profiles/')) {
      try {
        await deleteFromS3(oldPhoto);
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