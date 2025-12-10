const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Server = require('../models/Server');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Tüm route'ları koruma altına al
router.use(protect);

// Sunucu ekle
router.post('/add', [
  body('name').trim().notEmpty().withMessage('Sunucu adı gereklidir'),
  body('type').isIn(['VPS', 'VDS']).withMessage('Geçerli bir sunucu tipi seçiniz (VPS veya VDS)'),
  body('ipAddress').isIP().withMessage('Geçerli bir IP adresi giriniz'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      name,
      type,
      ipAddress,
      sshPort,
      sshUsername,
      sshPassword,
      sshKey,
      rdpPort,
      rdpUsername,
      rdpPassword,
      vncPort,
      vncPassword,
      desktopType,
    } = req.body;

    // VPS için gerekli alanları kontrol et
    if (type === 'VPS') {
      if (!sshPassword && !sshKey) {
        return res.status(400).json({
          success: false,
          message: 'VPS için SSH şifresi veya SSH key gereklidir',
        });
      }
    }

    // VDS için gerekli alanları kontrol et
    if (type === 'VDS') {
      if (!rdpUsername && !rdpPassword && !vncPassword) {
        return res.status(400).json({
          success: false,
          message: 'VDS için kullanıcı adı ve şifre gereklidir',
        });
      }
    }

    const server = await Server.create({
      userId: req.user.id,
      name,
      type,
      ipAddress,
      sshPort: sshPort || 22,
      sshUsername: sshUsername || 'root',
      sshPassword,
      sshKey,
      rdpPort: rdpPort || 3389,
      rdpUsername,
      rdpPassword,
      vncPort: vncPort || 5900,
      vncPassword,
      desktopType: desktopType || 'RDP',
    });

    res.status(201).json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        type: server.type,
        ipAddress: server.ipAddress,
        createdAt: server.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu eklenemedi',
      error: error.message,
    });
  }
});

// Kullanıcının tüm sunucularını getir
router.get('/list', async (req, res) => {
  try {
    console.log('Fetching servers for user:', req.user.id);
    const servers = await Server.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['sshPassword', 'sshKey', 'rdpPassword', 'vncPassword'] },
      order: [['createdAt', 'DESC']],
    });

    console.log(`Found ${servers.length} servers`);
    res.json({
      success: true,
      servers,
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucular getirilemedi',
      error: error.message,
    });
  }
});

// Sunucu detaylarını getir (şifrelerle birlikte - düzenleme için)
router.get('/:id', async (req, res) => {
  try {
    const server = await Server.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Sunucu bulunamadı',
      });
    }

    // Şifreleri decrypt et
    const serverData = server.toJSON();
    if (serverData.sshPassword) serverData.sshPassword = server.decrypt(serverData.sshPassword);
    if (serverData.rdpPassword) serverData.rdpPassword = server.decrypt(serverData.rdpPassword);
    if (serverData.vncPassword) serverData.vncPassword = server.decrypt(serverData.vncPassword);

    res.json({
      success: true,
      server: serverData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu getirilemedi',
      error: error.message,
    });
  }
});

// Sunucu güncelle
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Sunucu adı boş olamaz'),
  body('ipAddress').optional().isIP().withMessage('Geçerli bir IP adresi giriniz'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const server = await Server.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Sunucu bulunamadı',
      });
    }

    const updateData = { ...req.body };
    // Şifreler otomatik encrypt edilecek (hook ile)

    await server.update(updateData);

    res.json({
      success: true,
      message: 'Sunucu başarıyla güncellendi',
      server: {
        id: server.id,
        name: server.name,
        type: server.type,
        ipAddress: server.ipAddress,
        updatedAt: server.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu güncellenemedi',
      error: error.message,
    });
  }
});

// Sunucu sil
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting server:', req.params.id, 'for user:', req.user.id);
    
    const server = await Server.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!server) {
      console.log('Server not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Sunucu bulunamadı',
      });
    }

    // İlişkili ConnectionToken'ları da sil
    const ConnectionToken = require('../models/ConnectionToken');
    await ConnectionToken.destroy({
      where: { serverId: server.id },
    });

    await server.destroy();

    console.log('Server deleted successfully:', req.params.id);
    res.json({
      success: true,
      message: 'Sunucu başarıyla silindi',
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu silinemedi',
      error: error.message,
    });
  }
});

module.exports = router;
