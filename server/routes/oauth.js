const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');

const router = express.Router();

// JWT token oluşturma
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// OAuth callback handler
const handleOAuthCallback = async (req, res, profile, provider) => {
  try {
    const providerId = String(profile.id || profile.sub || '');
    const email = profile.emails?.[0]?.value || profile.email || '';
    const username = profile.displayName || profile.name || profile.username || profile.login || email?.split('@')[0] || `user_${Date.now()}`;
    const avatar = profile.photos?.[0]?.value || profile.avatar_url || '';

    if (!providerId) {
      throw new Error('Provider ID not found');
    }

    console.log(`OAuth ${provider} callback:`, { providerId, email, username });

    // Kullanıcıyı bul veya oluştur
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { [`${provider}Id`]: providerId },
          ...(email ? [{ email: email.toLowerCase() }] : []),
        ],
      },
    });

    if (!user) {
      // Yeni kullanıcı oluştur
      const userData = {
        username: username.substring(0, 255),
        email: email?.toLowerCase() || `${providerId}@${provider}.oauth`,
        [`${provider}Id`]: providerId,
        password: null,
      };
      
      if (avatar) {
        userData[`${provider}Avatar`] = avatar;
      }

      user = await User.create(userData);
      console.log(`New ${provider} user created:`, user.id);
    } else {
      // Mevcut kullanıcıyı güncelle
      const updateData = {};
      if (!user[`${provider}Id`]) {
        updateData[`${provider}Id`] = providerId;
      }
      if (avatar && !user[`${provider}Avatar`]) {
        updateData[`${provider}Avatar`] = avatar;
      }
      
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
        console.log(`${provider} user updated:`, user.id);
      }
    }

    const token = generateToken(user.id);
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    
    console.log(`OAuth ${provider} success, redirecting to:`, `${CLIENT_URL}/auth/callback?token=${token.substring(0, 20)}...&success=true`);
    
    // Token'ı URL parametresi olarak gönder
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&success=true`);
  } catch (error) {
    console.error(`OAuth ${provider} callback error:`, error);
    console.error('Error stack:', error.stack);
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${CLIENT_URL}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

// Check if strategy is registered
const isStrategyRegistered = (strategyName) => {
  try {
    return passport._strategy(strategyName) !== undefined;
  } catch (error) {
    return false;
  }
};

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
  }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
      if (!req.user) {
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
      }
      await handleOAuthCallback(req, res, req.user, 'google');
    }
  );
} else {
  // OAuth not configured - return error
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    });
  });

  router.get('/google/callback', (req, res) => {
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${CLIENT_URL}/login?error=oauth_not_configured`);
  });
}

// GitHub OAuth
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get('/github', passport.authenticate('github', {
    scope: ['user:email'],
  }));

  router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
      if (!req.user) {
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
      }
      await handleOAuthCallback(req, res, req.user, 'github');
    }
  );
} else {
  // OAuth not configured - return error
  router.get('/github', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
    });
  });

  router.get('/github/callback', (req, res) => {
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${CLIENT_URL}/login?error=oauth_not_configured`);
  });
}

module.exports = router;

