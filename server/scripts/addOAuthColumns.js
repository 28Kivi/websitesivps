require('dotenv').config();
const sequelize = require('../config/database');

async function addOAuthColumns() {
  try {
    console.log('PostgreSQL bağlantısı test ediliyor...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL bağlantısı başarılı');

    console.log('\nEksik kolonlar ekleniyor...');

    // googleId kolonu
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255) UNIQUE;
      `);
      console.log('✓ googleId kolonu eklendi');
    } catch (err) {
      console.log('⚠ googleId:', err.message);
    }

    // githubId kolonu
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "githubId" VARCHAR(255) UNIQUE;
      `);
      console.log('✓ githubId kolonu eklendi');
    } catch (err) {
      console.log('⚠ githubId:', err.message);
    }

    // googleAvatar kolonu
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "googleAvatar" VARCHAR(255);
      `);
      console.log('✓ googleAvatar kolonu eklendi');
    } catch (err) {
      console.log('⚠ googleAvatar:', err.message);
    }

    // githubAvatar kolonu
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "githubAvatar" VARCHAR(255);
      `);
      console.log('✓ githubAvatar kolonu eklendi');
    } catch (err) {
      console.log('⚠ githubAvatar:', err.message);
    }

    console.log('\n✓ Tüm kolonlar eklendi!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Hata:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

addOAuthColumns();

