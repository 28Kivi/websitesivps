# VPS/VDS Bağlantı Platformu

Kullanıcıların kendi VPS veya VDS sunucularına tek bir web sitesi üzerinden güvenli şekilde bağlanabilmelerini sağlayan modern bir platform.

## Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ VPS sunucu ekleme (SSH bağlantısı)
- ✅ VDS sunucu ekleme (RDP/VNC bağlantısı)
- ✅ Tarayıcı tabanlı SSH terminal arayüzü
- ✅ Güvenli token tabanlı bağlantı sistemi
- ✅ Şifreli veri saklama
- ✅ Modern ve responsive kullanıcı arayüzü

## Teknolojiler

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- WebSocket (SSH bağlantıları için)
- SSH2 (SSH bağlantıları için)
- bcryptjs (Şifre hash'leme)
- AES şifreleme (sunucu bilgileri için)

### Frontend
- React
- React Router
- Axios
- xterm.js (Terminal arayüzü)
- React Toastify

## Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- MongoDB (yerel veya MongoDB Atlas)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın veya indirin**

2. **Tüm bağımlılıkları yükleyin**
   ```bash
   npm run install-all
   ```

3. **Backend ortam değişkenlerini ayarlayın**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   `.env` dosyasını düzenleyin:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/vps-vds-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ENCRYPTION_KEY=your-32-character-encryption-key-here!!
   
   # Guacamole (RDP/VNC için - opsiyonel)
   GUACAMOLE_URL=http://localhost:8080/guacamole
   GUACAMOLE_USER=guacadmin
   GUACAMOLE_PASS=guacadmin
   ```

4. **MongoDB'yi başlatın**
   - Yerel MongoDB kullanıyorsanız: `mongod` komutunu çalıştırın
   - MongoDB Atlas kullanıyorsanız: Connection string'i `.env` dosyasına ekleyin

5. **Uygulamayı başlatın**

   Geliştirme modu (backend + frontend birlikte):
   ```bash
   npm run dev
   ```

   Veya ayrı ayrı:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm start
   ```

6. **Tarayıcıda açın**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Kullanım

1. **Kayıt Ol**: Yeni bir hesap oluşturun
2. **Sunucu Ekle**: VPS veya VDS sunucunuzu ekleyin
   - VPS için: IP, SSH port, kullanıcı adı, şifre veya SSH key
   - VDS için: IP, RDP/VNC port, kullanıcı adı ve şifre
3. **Bağlan**: Sunucu listesinden "Bağlan" butonuna tıklayın
4. **Yönet**: Tarayıcı tabanlı terminal veya masaüstü arayüzü ile sunucunuzu yönetin

## Güvenlik Notları

⚠️ **ÖNEMLİ**: Bu proje geliştirme amaçlıdır. Production ortamında kullanmadan önce:

1. **JWT_SECRET** ve **ENCRYPTION_KEY** değerlerini güçlü, rastgele değerlerle değiştirin
2. HTTPS kullanın
3. Rate limiting ekleyin
4. CORS ayarlarını production ortamına göre yapılandırın
5. Veritabanı bağlantılarını güvenli hale getirin
6. Loglama ve monitoring ekleyin
7. RDP/VNC bağlantıları için güvenli bir proxy gateway kullanın (Apache Guacamole önerilir)

## RDP/VNC Bağlantıları

Mevcut implementasyonda SSH terminal bağlantıları tam olarak çalışmaktadır. RDP/VNC bağlantıları için backend'de ek bir gateway servisi gereklidir:

### Önerilen Çözümler:

1. **Apache Guacamole**: RDP, VNC ve SSH için web tabanlı gateway
2. **noVNC + websockify**: VNC için WebSocket proxy
3. **RDP.js**: Tarayıcı tabanlı RDP istemcisi

## Proje Yapısı

```
vps-vds-connection-platform/
├── server/                 # Backend API
│   ├── models/            # MongoDB modelleri
│   ├── routes/            # API route'ları
│   ├── middleware/        # Auth middleware
│   ├── websocket/         # WebSocket handler'ları
│   └── index.js           # Ana server dosyası
├── client/                # Frontend React uygulaması
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── context/       # Context API
│   │   └── App.js         # Ana uygulama
│   └── public/
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Kullanıcı bilgileri

### Servers
- `POST /api/servers/add` - Sunucu ekle
- `GET /api/servers/list` - Sunucu listesi
- `GET /api/servers/:id` - Sunucu detayları
- `DELETE /api/servers/:id` - Sunucu sil

### Connection
- `POST /api/connect/generate` - Bağlantı token'ı oluştur
- `GET /api/connect/:token` - Token ile bağlantı bilgileri

### WebSocket
- `WS /ws/ssh` - SSH terminal bağlantısı

## Lisans

MIT

## Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için lütfen önce bir issue açarak neyi değiştirmek istediğinizi tartışın.

## Destek

Sorularınız veya sorunlarınız için bir issue açabilirsiniz.

