const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Environment variables'ı en başta yükle
dotenv.config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const connectRoutes = require('./routes/connect');
const guacamoleRoutes = require('./routes/guacamole');
const { initializeWebSocket } = require('./websocket/sshWebSocket');

// Model importları (ilişkiler için) - dotenv'den sonra
const User = require('./models/User');
const Server = require('./models/Server');
const ConnectionToken = require('./models/ConnectionToken');

// İlişkileri tanımla (circular dependency'yi önlemek için)
Server.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Server, { foreignKey: 'userId', as: 'servers' });

ConnectionToken.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });
ConnectionToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Server.hasMany(ConnectionToken, { foreignKey: 'serverId', as: 'tokens' });
User.hasMany(ConnectionToken, { foreignKey: 'userId', as: 'tokens' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS ayarları - Render için esnek
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Origin yoksa (mobile app, Postman, vb.) izin ver
    if (!origin) return callback(null, true);
    
    // Allowed origins listesinde var mı kontrol et
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      // Render subdomain'leri için esnek kontrol
      if (origin.includes('onrender.com')) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Database connection ve sync - server başlamadan önce
async function startServer() {
  try {
    // Database bağlantısını test et
    await sequelize.authenticate();
    console.log('PostgreSQL bağlantısı başarılı');

    // UUID extension'ını etkinleştir (eğer yoksa)
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('UUID extension hazır');
    } catch (err) {
      console.log('UUID extension zaten mevcut veya gerekli değil');
    }

    // Tabloları oluştur (sync)
    console.log('Tablolar oluşturuluyor...');
    await sequelize.sync({ force: false });
    console.log('Veritabanı tabloları hazır');
    
    // Tabloların oluştuğunu kontrol et
    try {
      const [results] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      console.log('Mevcut tablolar:', results.map(r => r.table_name).join(', ') || 'Hiç tablo yok!');
      
      // Eğer tablo yoksa force: true ile oluştur
      if (results.length === 0) {
        console.log('Tablolar bulunamadı, force: true ile oluşturuluyor...');
        await sequelize.sync({ force: true });
        console.log('Tablolar başarıyla oluşturuldu!');
      }
    } catch (err) {
      console.error('Tablo kontrolü hatası:', err.message);
    }

    // Passport initialization
    require('./config/passport');
    const passport = require('passport');
    app.use(passport.initialize());

    // Routes
    app.use('/api/auth', authRoutes);
    const oauthRoutes = require('./routes/oauth');
    app.use('/api/auth', oauthRoutes);
    app.use('/api/servers', serverRoutes);
    app.use('/api/connect', connectRoutes);
    app.use('/api/guacamole', guacamoleRoutes);

    // Guacamole Proxy - Backend üzerinden Guacamole'i proxy et (same-origin için)
    const GUACAMOLE_URL = process.env.GUACAMOLE_URL || 'http://localhost:8080/guacamole';
    app.use('/guacamole', createProxyMiddleware({
      target: GUACAMOLE_URL,
      changeOrigin: true,
      ws: true, // WebSocket desteği
      pathRewrite: {
        '^/guacamole': '', // /guacamole path'ini kaldır
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Guacamole Proxy] ${req.method} ${req.path} -> ${GUACAMOLE_URL}${req.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Cookie'leri same-site olarak ayarla
        const cookies = proxyRes.headers['set-cookie'];
        if (cookies) {
          proxyRes.headers['set-cookie'] = cookies.map(cookie => 
            cookie.replace(/; Secure/gi, '').replace(/; SameSite=\w+/gi, '; SameSite=None')
          );
        }
      },
      onError: (err, req, res) => {
        console.error('[Guacamole Proxy Error]:', err.message);
        res.status(500).json({ 
          error: 'Guacamole proxy hatası', 
          message: err.message 
        });
      }
    }));

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'Server çalışıyor' });
    });

    // Initialize WebSocket server for SSH connections
    const server = app.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor`);
      initializeWebSocket(server);
    });
  } catch (error) {
    console.error('PostgreSQL bağlantı hatası:', error);
    console.error('Hata detayları:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Sunucuyu başlat
startServer();
