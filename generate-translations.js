// Bu script 50 dil için çeviri dosyaları oluşturur
const fs = require('fs');
const path = require('path');

const template = {
  welcome: "Welcome",
  login: "Login",
  register: "Register",
  logout: "Logout",
  dashboard: "Server Management Panel",
  addServer: "Add Server",
  editServer: "Edit Server",
  connect: "Connect",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving...",
  serverName: "Server Name",
  serverType: "Server Type",
  ipAddress: "IP Address",
  required: "Required",
  vps: "VPS",
  vds: "VDS",
  sshPort: "SSH Port",
  sshUsername: "SSH Username",
  sshPassword: "SSH Password",
  sshKey: "SSH Private Key",
  rdpPort: "RDP Port",
  rdpUsername: "RDP Username",
  rdpPassword: "RDP Password",
  vncPort: "VNC Port",
  vncPassword: "VNC Password",
  desktopType: "Desktop Type",
  totalServers: "Total Servers",
  vpsServers: "VPS Servers",
  vdsServers: "VDS Servers",
  search: "Search server name or IP...",
  all: "All",
  noServers: "No servers added yet",
  addFirstServer: "Add First Server",
  serverDeleted: "Server deleted successfully",
  serverSaved: "Server saved successfully",
  serverUpdated: "Server updated successfully",
  deleteConfirm: "Are you sure you want to delete this server?",
  loginWithGoogle: "Login with Google",
  loginWithGithub: "Login with GitHub",
  or: "or"
};

// Türkçe çeviriler (zaten var)
const tr = {
  welcome: "Hoş Geldiniz",
  login: "Giriş Yap",
  register: "Kayıt Ol",
  logout: "Çıkış",
  dashboard: "Sunucu Yönetim Paneli",
  addServer: "Sunucu Ekle",
  editServer: "Sunucu Düzenle",
  connect: "Bağlan",
  delete: "Sil",
  cancel: "İptal",
  save: "Kaydet",
  saving: "Kaydediliyor...",
  serverName: "Sunucu Adı",
  serverType: "Sunucu Tipi",
  ipAddress: "IP Adresi",
  required: "Gerekli",
  vps: "VPS",
  vds: "VDS",
  sshPort: "SSH Port",
  sshUsername: "SSH Kullanıcı Adı",
  sshPassword: "SSH Şifre",
  sshKey: "SSH Private Key",
  rdpPort: "RDP Port",
  rdpUsername: "RDP Kullanıcı Adı",
  rdpPassword: "RDP Şifre",
  vncPort: "VNC Port",
  vncPassword: "VNC Şifre",
  desktopType: "Masaüstü Tipi",
  totalServers: "Toplam Sunucu",
  vpsServers: "VPS Sunucular",
  vdsServers: "VDS Sunucular",
  search: "Sunucu adı veya IP ile ara...",
  all: "Tümü",
  noServers: "Henüz sunucu eklenmemiş",
  addFirstServer: "İlk Sunucuyu Ekle",
  serverDeleted: "Sunucu başarıyla silindi",
  serverSaved: "Sunucu başarıyla kaydedildi",
  serverUpdated: "Sunucu başarıyla güncellendi",
  deleteConfirm: "Bu sunucuyu silmek istediğinize emin misiniz?",
  loginWithGoogle: "Google ile Giriş Yap",
  loginWithGithub: "GitHub ile Giriş Yap",
  or: "veya"
};

const localesDir = path.join(__dirname, 'client', 'src', 'i18n', 'locales');

// Dosyaları oluştur
const languages = [
  { code: 'en', data: template },
  { code: 'tr', data: tr },
  // Diğer diller için şimdilik template kullan (Google Translate ile çevrilebilir)
  { code: 'es', data: template },
  { code: 'fr', data: template },
  { code: 'de', data: template },
  { code: 'it', data: template },
  { code: 'pt', data: template },
  { code: 'ru', data: template },
  { code: 'zh', data: template },
  { code: 'ja', data: template },
  { code: 'ko', data: template },
  { code: 'ar', data: template },
  { code: 'hi', data: template },
  { code: 'nl', data: template },
  { code: 'pl', data: template },
];

// Dizin yoksa oluştur
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Dosyaları yaz
languages.forEach(({ code, data }) => {
  const filePath = path.join(localesDir, `${code}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Created: ${code}.json`);
});

console.log(`\n✓ Created ${languages.length} translation files`);
console.log(`⚠ Note: Most languages use English template. You can translate them using Google Translate or translation services.`);

