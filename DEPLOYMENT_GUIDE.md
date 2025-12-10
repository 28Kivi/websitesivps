# 🚀 Site Yayınlama Rehberi

Bu rehber, VPS/VDS Connection Platform'unu production ortamına nasıl deploy edeceğinizi açıklar.

## 📋 İçindekiler
1. [Hazırlık](#hazırlık)
2. [Deployment Seçenekleri](#deployment-seçenekleri)
3. [VPS/Cloud Server Deployment](#vpscloud-server-deployment)
4. [Platform-as-a-Service (PaaS)](#platform-as-a-service-paas)
5. [Environment Variables](#environment-variables)
6. [Build ve Deploy Adımları](#build-ve-deploy-adımları)

---

## 🔧 Hazırlık

### 1. Production Build Oluşturma

```bash
# Frontend build
cd client
npm run build

# Bu, client/build klasörü oluşturur
```

### 2. Gerekli Dosyalar
- ✅ `server/` - Backend kodu
- ✅ `client/build/` - Frontend build dosyaları
- ✅ `docker-compose.guacamole.yml` - Guacamole için
- ✅ `.env` dosyaları (production için)

---

## 🌐 Deployment Seçenekleri

### Seçenek 1: VPS/Cloud Server (Önerilen)
**Avantajlar:**
- Tam kontrol
- Daha ucuz (uzun vadede)
- Özelleştirme imkanı

**Popüler Seçenekler:**
- DigitalOcean ($6-12/ay)
- Vultr ($6-12/ay)
- Hetzner ($4-8/ay)
- AWS EC2
- Google Cloud Platform
- Azure

### Seçenek 2: Platform-as-a-Service (PaaS)
**Avantajlar:**
- Kolay kurulum
- Otomatik scaling
- Daha az yönetim

**Popüler Seçenekler:**
- Railway.app
- Render.com
- Heroku
- Fly.io
- Vercel (sadece frontend için)

---

## 🖥️ VPS/Cloud Server Deployment

### Adım 1: Server Hazırlığı

```bash
# Ubuntu/Debian için
sudo apt update
sudo apt upgrade -y

# Node.js 18+ kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 kurulumu (process manager)
sudo npm install -g pm2

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Nginx kurulumu (reverse proxy için)
sudo apt install -y nginx
```

### Adım 2: Projeyi Server'a Yükleme

```bash
# Git ile
git clone <your-repo-url>
cd <project-folder>

# Veya SCP ile
scp -r . user@your-server-ip:/path/to/project
```

### Adım 3: Environment Variables Ayarlama

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# OAuth (opsiyonel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend URL
REACT_APP_API_URL=https://api.yourdomain.com/api
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_GUACAMOLE_URL=https://guacamole.yourdomain.com/guacamole
```

### Adım 4: Database Kurulumu

```bash
# PostgreSQL kurulumu
sudo apt install -y postgresql postgresql-contrib

# Database oluşturma
sudo -u postgres psql
CREATE DATABASE your_db_name;
CREATE USER your_db_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_db_user;
\q
```

### Adım 5: Backend Deployment

```bash
cd server
npm install --production
npm run start

# Veya PM2 ile (önerilen)
pm2 start index.js --name "vps-backend"
pm2 save
pm2 startup  # Sistem başlangıcında otomatik başlatma
```

### Adım 6: Frontend Build ve Deployment

```bash
cd client
npm install
npm run build

# Build dosyalarını Nginx'e kopyala
sudo cp -r build/* /var/www/html/
```

### Adım 7: Nginx Yapılandırması

**`/etc/nginx/sites-available/your-domain`**
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# WebSocket için
server {
    listen 80;
    server_name ws.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Nginx'i aktif et
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Adım 8: SSL Sertifikası (HTTPS)

```bash
# Let's Encrypt kurulumu
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Adım 9: Guacamole Deployment

```bash
# Docker Compose ile
docker-compose -f docker-compose.guacamole.yml up -d

# Nginx reverse proxy ekle
# /etc/nginx/sites-available/guacamole
server {
    listen 80;
    server_name guacamole.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Adım 10: Firewall Ayarları

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## ☁️ Platform-as-a-Service (PaaS)

### Railway.app

1. **Railway'a kaydol**: https://railway.app
2. **Yeni proje oluştur**
3. **GitHub repo'yu bağla**
4. **Environment variables ekle**
5. **Deploy!**

**Railway için `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Render.com

1. **Render'a kaydol**: https://render.com
2. **New Web Service**
3. **GitHub repo'yu bağla**
4. **Ayarlar:**
   - Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
   - Start Command: `cd server && npm start`
5. **Environment variables ekle**
6. **Deploy!**

### Vercel (Sadece Frontend)

1. **Vercel'e kaydol**: https://vercel.com
2. **Import Project**
3. **Root Directory**: `client`
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`
6. **Environment variables ekle**

**Backend için ayrı bir servis kullanın (Railway, Render, vb.)**

---

## 🔐 Environment Variables

### Production için Gerekli Değişkenler

**Backend:**
- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (güçlü bir secret)
- `SESSION_SECRET` (güçlü bir secret)
- `REACT_APP_API_URL` (frontend URL'i)

**Frontend:**
- `REACT_APP_API_URL` (backend API URL'i)
- `REACT_APP_GUACAMOLE_URL` (Guacamole URL'i)

---

## 📦 Build ve Deploy Adımları

### Lokal Build Test

```bash
# 1. Frontend build
cd client
npm install
npm run build

# 2. Backend test
cd ../server
npm install
npm test  # Eğer test varsa

# 3. Production modda test
NODE_ENV=production npm start
```

### Production Deployment Checklist

- [ ] Environment variables ayarlandı
- [ ] Database oluşturuldu ve migrate edildi
- [ ] Frontend build edildi
- [ ] Backend production modda çalışıyor
- [ ] Nginx yapılandırıldı
- [ ] SSL sertifikası kuruldu
- [ ] Firewall ayarları yapıldı
- [ ] Guacamole çalışıyor
- [ ] Domain DNS ayarları yapıldı
- [ ] Monitoring/logging kuruldu (opsiyonel)

---

## 🛠️ Yararlı Komutlar

### PM2 Komutları
```bash
pm2 list              # Çalışan process'leri listele
pm2 logs              # Logları göster
pm2 restart all       # Tümünü yeniden başlat
pm2 stop all          # Tümünü durdur
pm2 delete all        # Tümünü sil
```

### Docker Komutları
```bash
docker ps             # Çalışan container'ları listele
docker logs guacamole # Guacamole logları
docker-compose -f docker-compose.guacamole.yml restart
```

### Nginx Komutları
```bash
sudo nginx -t         # Yapılandırmayı test et
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## 🚨 Sorun Giderme

### Backend çalışmıyor
```bash
# Logları kontrol et
pm2 logs vps-backend
# Veya
cd server && npm start
```

### Frontend 404 hatası
- Nginx yapılandırmasında `try_files` kontrol et
- Build dosyalarının doğru yerde olduğunu kontrol et

### Database bağlantı hatası
- PostgreSQL çalışıyor mu: `sudo systemctl status postgresql`
- Connection string doğru mu kontrol et
- Firewall PostgreSQL portunu (5432) açık mı?

### Guacamole çalışmıyor
```bash
docker ps -a
docker logs guacamole
docker-compose -f docker-compose.guacamole.yml restart
```

---

## 📝 Notlar

1. **Güvenlik:**
   - JWT_SECRET ve SESSION_SECRET'leri güçlü yapın
   - HTTPS kullanın (Let's Encrypt ücretsiz)
   - Firewall kurallarını sıkı tutun
   - Database şifrelerini güçlü yapın

2. **Performans:**
   - PM2 ile process management
   - Nginx ile reverse proxy
   - CDN kullanımı (Cloudflare, vb.)
   - Database indexing

3. **Monitoring:**
   - PM2 monitoring
   - Uptime monitoring (UptimeRobot, vb.)
   - Error tracking (Sentry, vb.)

---

## 🎯 Hızlı Başlangıç (VPS)

```bash
# 1. Server'a bağlan
ssh user@your-server-ip

# 2. Projeyi klonla
git clone <repo-url>
cd <project-folder>

# 3. Backend kurulum
cd server
npm install --production
cp .env.example .env
# .env dosyasını düzenle
npm start

# 4. Frontend build
cd ../client
npm install
npm run build
sudo cp -r build/* /var/www/html/

# 5. Guacamole
docker-compose -f docker-compose.guacamole.yml up -d

# 6. Nginx yapılandır
sudo nano /etc/nginx/sites-available/your-domain
sudo systemctl restart nginx

# 7. SSL
sudo certbot --nginx -d yourdomain.com
```

---

**İyi şanslar! 🚀**

