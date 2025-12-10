require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const Server = require('../models/Server');
const ConnectionToken = require('../models/ConnectionToken');

// İlişkileri tanımla
Server.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Server, { foreignKey: 'userId', as: 'servers' });

ConnectionToken.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });
ConnectionToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Server.hasMany(ConnectionToken, { foreignKey: 'serverId', as: 'tokens' });
User.hasMany(ConnectionToken, { foreignKey: 'userId', as: 'tokens' });

async function createTables() {
  try {
    console.log('PostgreSQL bağlantısı test ediliyor...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL bağlantısı başarılı');

    // UUID extension
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✓ UUID extension hazır');
    } catch (err) {
      console.log('⚠ UUID extension:', err.message);
    }

    // Tabloları oluştur
    console.log('\nTablolar oluşturuluyor...');
    await sequelize.sync({ force: false });
    console.log('✓ Tablolar oluşturuldu');

    // Tabloları kontrol et
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n✓ Mevcut tablolar:');
    results.forEach(r => console.log(`  - ${r.table_name}`));

    process.exit(0);
  } catch (error) {
    console.error('✗ Hata:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createTables();

