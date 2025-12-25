const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { getSignedUrlForObject } = require('../config/s3');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const rpName = process.env.RP_NAME || 'QUICKCLIP';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || 'http://localhost:3001';

const registerOptions = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and name.'
      });
    }

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

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(email),
      userName: email,
      userDisplayName: name,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO passkey_challenges (email, challenge, expires_at) VALUES ($1, $2, $3)',
      [email, options.challenge, expiresAt]
    );

    res.json({
      success: true,
      data: { options, email, name }
    });

  } catch (error) {
    console.error('Register options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
};

const registerVerify = async (req, res) => {
  try {
    const { email, name, credential } = req.body;

    if (!email || !name || !credential) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.'
      });
    }

    const challengeResult = await pool.query(
      'SELECT challenge FROM passkey_challenges WHERE email = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge.'
      });
    }

    const expectedChallenge = challengeResult.rows[0].challenge;

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed.'
      });
    }

    const { credential: registeredCredential } = verification.registrationInfo;

    const userResult = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name, created_at, profile_photo',
      [email, name]
    );

    const user = userResult.rows[0];

    await pool.query(
      'INSERT INTO passkey_credentials (user_id, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)',
      [user.id, registeredCredential.id, Buffer.from(registeredCredential.publicKey).toString('base64'), registeredCredential.counter]
    );

    await pool.query(
      'DELETE FROM passkey_challenges WHERE email = $1',
      [email]
    );

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: null
        }
      }
    });

  } catch (error) {
    console.error('Register verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
};

const loginOptions = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email.'
      });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email.'
      });
    }

    const user = userResult.rows[0];

    const credentialsResult = await pool.query(
      'SELECT credential_id FROM passkey_credentials WHERE user_id = $1',
      [user.id]
    );

    const allowCredentials = credentialsResult.rows.map(row => ({
      id: row.credential_id,
      type: 'public-key',
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO passkey_challenges (user_id, email, challenge, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, email, options.challenge, expiresAt]
    );

    res.json({
      success: true,
      data: { options }
    });

  } catch (error) {
    console.error('Login options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

const loginVerify = async (req, res) => {
  try {
    const { email, credential } = req.body;

    if (!email || !credential) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.'
      });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email.'
      });
    }

    const user = userResult.rows[0];

    const challengeResult = await pool.query(
      'SELECT challenge FROM passkey_challenges WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge.'
      });
    }

    const expectedChallenge = challengeResult.rows[0].challenge;

    const credentialResult = await pool.query(
      'SELECT credential_id, public_key, counter FROM passkey_credentials WHERE credential_id = $1 AND user_id = $2',
      [credential.id, user.id]
    );

    if (credentialResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credential not found.'
      });
    }

    const dbCredential = credentialResult.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCredential.credential_id,
        publicKey: Buffer.from(dbCredential.public_key, 'base64'),
        counter: parseInt(dbCredential.counter),
      },
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed.'
      });
    }

    await pool.query(
      'UPDATE passkey_credentials SET counter = $1 WHERE credential_id = $2',
      [verification.authenticationInfo.newCounter, dbCredential.credential_id]
    );

    await pool.query(
      'DELETE FROM passkey_challenges WHERE user_id = $1',
      [user.id]
    );

    const userDataResult = await pool.query(
      'SELECT id, email, name, profile_photo FROM users WHERE id = $1',
      [user.id]
    );

    const userData = userDataResult.rows[0];
    let profilePhoto = userData.profile_photo;
    if (profilePhoto && profilePhoto.startsWith('profiles/')) {
      profilePhoto = await getSignedUrlForObject(profilePhoto, 86400);
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          profilePhoto: profilePhoto
        }
      }
    });

  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, profile_photo, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    let profilePhoto = user.profile_photo;
    if (profilePhoto && profilePhoto.startsWith('profiles/')) {
      profilePhoto = await getSignedUrlForObject(profilePhoto, 86400);
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: profilePhoto,
          createdAt: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = { registerOptions, registerVerify, loginOptions, loginVerify, getMe };
