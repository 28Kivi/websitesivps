const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
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
