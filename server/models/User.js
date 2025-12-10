const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 255],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Geçerli bir e-posta adresi giriniz',
      },
      notEmpty: {
        msg: 'E-posta gereklidir',
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // OAuth kullanıcıları şifre olmadan kayıt olabilir
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  githubId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  googleAvatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  githubAvatar: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.email) {
        user.email = user.email.toLowerCase();
      }
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('email')) {
        user.email = user.email.toLowerCase();
      }
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

// Şifre karşılaştırma metodu
User.prototype.comparePassword = async function(candidatePassword) {
  // OAuth kullanıcılarının şifresi yoksa false döndür
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
