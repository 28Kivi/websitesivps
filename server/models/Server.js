const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const Server = sequelize.define('Server', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('VPS', 'VDS'),
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  // VPS için
  sshPort: {
    type: DataTypes.INTEGER,
    defaultValue: 22,
  },
  sshUsername: {
    type: DataTypes.STRING,
    defaultValue: 'root',
  },
  sshPassword: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sshKey: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // VDS için
  rdpPort: {
    type: DataTypes.INTEGER,
    defaultValue: 3389,
  },
  rdpUsername: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rdpPassword: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vncPort: {
    type: DataTypes.INTEGER,
    defaultValue: 5900,
  },
  vncPassword: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  desktopType: {
    type: DataTypes.ENUM('RDP', 'VNC'),
    defaultValue: 'RDP',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'servers',
  hooks: {
    beforeSave: async (server) => {
      const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!';
      
      if (server.changed('sshPassword') && server.sshPassword) {
        server.sshPassword = Server.encrypt(server.sshPassword, key);
      }
      if (server.changed('rdpPassword') && server.rdpPassword) {
        server.rdpPassword = Server.encrypt(server.rdpPassword, key);
      }
      if (server.changed('vncPassword') && server.vncPassword) {
        server.vncPassword = Server.encrypt(server.vncPassword, key);
      }
    },
  },
});

// Şifreleme metodu
Server.encrypt = function(text, key) {
  const algorithm = 'aes-256-cbc';
  const encryptionKey = key.slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Şifre çözme metodu
Server.prototype.decrypt = function(encryptedText) {
  if (!encryptedText) return null;
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!';
  const encryptionKey = key.slice(0, 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = Server;
