const express = require('express');
const ConnectionToken = require('../models/ConnectionToken');
const Server = require('../models/Server');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Bağlantı token'ı oluştur
router.post('/generate', protect, async (req, res) => {
  try {
    console.log('Generate token request:', { serverId: req.body.serverId, userId: req.user.id });
    const { serverId } = req.body;

    if (!serverId) {
      return res.status(400).json({
        success: false,
        message: 'Sunucu ID gereklidir',
      });
    }

    // Sunucunun kullanıcıya ait olduğunu kontrol et
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });

    if (!server) {
      console.log('Server not found or access denied');
      return res.status(404).json({
        success: false,
        message: 'Sunucu bulunamadı veya erişim yetkiniz yok',
      });
    }

    console.log('Server found, creating token...');
    // Yeni token oluştur
    const token = ConnectionToken.generateToken();
    const connectionToken = await ConnectionToken.create({
      token,
      serverId: server.id,
      userId: req.user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
    });

    console.log('Token created successfully:', connectionToken.token);
    res.json({
      success: true,
      token: connectionToken.token,
      url: `/connect/${connectionToken.token}`,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token oluşturulamadı',
      error: error.message,
    });
  }
});

// Token ile bağlantı bilgilerini getir (public endpoint - token ile erişim)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('GET /connect/:token - Token:', token);

    const connectionToken = await ConnectionToken.findOne({
      where: { token },
      include: [
        { model: Server, as: 'server' },
        { model: User, as: 'user' },
      ],
    });

    if (!connectionToken) {
      console.log('Connection token not found:', token);
      return res.status(404).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş bağlantı',
      });
    }

    if (new Date(connectionToken.expiresAt) < new Date()) {
      console.log('Connection token expired:', token, 'Expired at:', connectionToken.expiresAt);
      return res.status(410).json({
        success: false,
        message: 'Bağlantı süresi dolmuş',
      });
    }

    // Sunucu bilgilerini getir
    const server = await Server.findByPk(connectionToken.serverId);
    console.log('Server found:', server ? { id: server.id, name: server.name, type: server.type } : 'null');

    if (!server) {
      console.log('Server not found for connection token:', token);
      return res.status(404).json({
        success: false,
        message: 'Sunucu bulunamadı',
      });
    }

    // Şifreleri çöz
    const serverData = {
      id: server.id,
      name: server.name,
      type: server.type,
      ipAddress: server.ipAddress,
    };

    if (server.type === 'VPS') {
      serverData.sshPort = server.sshPort;
      serverData.sshUsername = server.sshUsername;
      serverData.sshPassword = server.sshPassword ? server.decrypt(server.sshPassword) : null;
      serverData.sshKey = server.sshKey;
    } else if (server.type === 'VDS') {
      serverData.rdpPort = server.rdpPort;
      serverData.rdpUsername = server.rdpUsername;
      serverData.rdpPassword = server.rdpPassword ? server.decrypt(server.rdpPassword) : null;
      serverData.vncPort = server.vncPort;
      serverData.vncPassword = server.vncPassword ? server.decrypt(server.vncPassword) : null;
      serverData.desktopType = server.desktopType;
    }

    // Token'ı kullanıldı olarak işaretle
    connectionToken.used = true;
    await connectionToken.save();

    console.log('Sending server data:', { 
      id: serverData.id, 
      name: serverData.name, 
      type: serverData.type 
    });

    res.json({
      success: true,
      server: serverData,
      token: connectionToken.token,
    });
  } catch (error) {
    console.error('Error in /connect/:token:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Bağlantı bilgileri alınamadı',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
