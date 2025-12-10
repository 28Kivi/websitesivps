const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// JWT token oluşturma
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Kayıt
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalıdır'),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
], async (req, res) => {
  try {
    console.log('Register request received:', { username: req.body.username, email: req.body.email });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // Kullanıcı kontrolü (email'i lowercase yap)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: email.toLowerCase() }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor',
      });
    }

    // Yeni kullanıcı oluştur
    console.log('Creating user...');
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    console.log('User created:', { id: user.id, username: user.username, email: user.email });

    const token = generateToken(user.id);
    console.log('Token generated');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    console.error('Error stack:', error.stack);
    
    // Sequelize validation hatalarını yakala
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    
    // Unique constraint hatalarını yakala
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Kayıt işlemi başarısız',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Giriş
router.post('/login', [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password').notEmpty().withMessage('Şifre gereklidir'),
], async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul (email'i lowercase yap)
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre',
      });
    }

    console.log('User found, checking password...');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre',
      });
    }

    console.log('Password valid, generating token...');
    const token = generateToken(user.id);
    console.log('Login successful for user:', user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Giriş işlemi başarısız',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınamadı',
      error: error.message,
    });
  }
});

module.exports = router;
