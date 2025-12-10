# 🎨 Render.com Deployment Rehberi

Bu rehber, projenizi Render.com'a nasıl deploy edeceğinizi adım adım açıklar.

## 📋 İçindekiler
1. [Hazırlık](#hazırlık)
2. [Render'a Kayıt ve Proje Oluşturma](#rendera-kayıt-ve-proje-oluşturma)
3. [PostgreSQL Database Ekleme](#postgresql-database-ekleme)
4. [Backend Servisi Oluşturma](#backend-servisi-oluşturma)
5. [Frontend Servisi Oluşturma](#frontend-servisi-oluşturma)
6. [Environment Variables](#environment-variables)
7. [Deploy ve Test](#deploy-ve-test)
8. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Hazırlık

### 1. GitHub'a Push
Kodunuzun GitHub'da olduğundan emin olun:
- ✅ Repository: `28Kivi/websitesivps`
- ✅ Tüm dosyalar commit edilmiş

---

## 🎨 Render'a Kayıt ve Proje Oluşturma

1. **Render'a kaydol**: https://render.com
   - GitHub hesabınızla giriş yapın (önerilir)
   - Ücretsiz hesap oluşturun

2. **Dashboard'a git**
   - Giriş yaptıktan sonra dashboard'a yönlendirilirsiniz

---

## 🗄️ PostgreSQL Database Ekleme

1. Render dashboard'da **"New +"** butonuna tıklayın
2. **"PostgreSQL"** seçin
3. Ayarlar:
   - **Name**: `vps-database` (veya istediğiniz isim)
   - **Database**: `vpsdb` (veya istediğiniz isim)
   - **User**: `vpsuser` (veya istediğiniz isim)
   - **Region**: `Frankfurt` (veya size yakın bir bölge)
   - **PostgreSQL Version**: `16` (veya en son sürüm)
   - **Plan**: `Free` (test için) veya `Starter` (production için)
4. **"Create Database"** butonuna tıklayın
5. Database oluşturulduktan sonra:
   - **"Info"** sekmesine gidin
   - **"Internal Database URL"** değerini kopyalayın (daha sonra kullanacağız)

---

## 🔙 Backend Servisi Oluşturma

### Adım 1: Yeni Web Service Oluştur
1. Render dashboard'da **"New +"** → **"Web Service"** seçin
2. GitHub repo'nuzu bağlayın:
   - **"Connect account"** ile GitHub hesabınızı bağlayın (eğer bağlı değilse)
   - **"Connect"** butonuna tıklayın
   - `28Kivi/websitesivps` repository'sini seçin

### Adım 2: Servis Ayarları
1. **Basic Settings:**
   - **Name**: `vps-backend` (veya istediğiniz isim)
   - **Region**: `Frankfurt` (veya size yakın bir bölge)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

2. **Plan:**
   - **Free**: Test için (uyku moduna girer, ilk istekte yavaş başlar)
   - **Starter ($7/ay)**: Production için (her zaman çalışır)

### Adım 3: Environment Variables
**"Environment"** sekmesine gidin ve şunları ekleyin:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=<PostgreSQL Internal Database URL>
JWT_SECRET=<rastgele-güçlü-bir-secret>
SESSION_SECRET=<rastgele-güçlü-bir-secret>
CLIENT_URL=https://vps-frontend.onrender.com
```

**Notlar:**
- `DATABASE_URL`: PostgreSQL servisinin "Info" sekmesinden "Internal Database URL" değerini kopyalayın
- `JWT_SECRET` ve `SESSION_SECRET`: Güçlü rastgele string'ler oluşturun (ör: `openssl rand -hex 32`)
- `CLIENT_URL`: Frontend servisinin URL'i (önceden oluşturmanız gerekir veya sonra güncelleyin)
- `PORT`: Render otomatik port atar, genelde `10000` kullanılır

### Adım 4: Advanced Settings (Opsiyonel)
- **Auto-Deploy**: `Yes` (GitHub'a push yaptığınızda otomatik deploy)
- **Health Check Path**: `/api/health` (eğer health check endpoint'iniz varsa)

### Adım 5: Create Web Service
**"Create Web Service"** butonuna tıklayın.

---

## 🎨 Frontend Servisi Oluşturma

### Adım 1: Yeni Static Site Oluştur
1. Render dashboard'da **"New +"** → **"Static Site"** seçin
2. GitHub repo'nuzu bağlayın:
   - `28Kivi/websitesivps` repository'sini seçin

### Adım 2: Servis Ayarları
1. **Basic Settings:**
   - **Name**: `vps-frontend` (veya istediğiniz isim)
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `build`

**Not:** `client/public/_redirects` dosyası tüm route'ları `index.html`'e yönlendirir (React Router için gerekli).

### Adım 3: Environment Variables
**"Environment"** sekmesine gidin ve şunları ekleyin:

```env
REACT_APP_API_URL=https://vps-backend.onrender.com/api
REACT_APP_GUACAMOLE_URL=https://guacamole.yourdomain.com/guacamole
```

**Not:** `vps-backend` yerine backend servisinizin gerçek adını yazın.

### Adım 4: Create Static Site
**"Create Static Site"** butonuna tıklayın.

---

## 🔐 Environment Variables Özeti

### Backend Variables
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<PostgreSQL Internal Database URL>
JWT_SECRET=<güçlü-secret>
SESSION_SECRET=<güçlü-secret>
CLIENT_URL=https://vps-frontend.onrender.com
```

### Frontend Variables
```
REACT_APP_API_URL=https://vps-backend.onrender.com/api
REACT_APP_GUACAMOLE_URL=https://guacamole.yourdomain.com/guacamole
```

---

## 🚀 Deploy ve Test

### 1. İlk Deploy
- Render otomatik olarak deploy başlatır
- Her servisin **"Logs"** sekmesinden deploy sürecini izleyebilirsiniz
- İlk deploy 5-10 dakika sürebilir

### 2. Database Migration
Backend deploy olduktan sonra:
1. Backend servisinin **"Shell"** sekmesine gidin
2. Şu komutu çalıştırın:
   ```bash
   node scripts/createTables.js
   ```

Veya backend kodunda otomatik migration ekleyebilirsiniz.

### 3. Test Et
- Frontend URL'ini açın: `https://vps-frontend.onrender.com`
- Backend API'yi test edin: `https://vps-backend.onrender.com/api/auth/login`
- Login/Register test edin

---

## 🔄 Custom Domain (Opsiyonel)

### Backend için:
1. Backend servisinde **"Settings"** → **"Custom Domains"**
2. Domain'inizi ekleyin
3. DNS ayarlarını yapın (Render size talimat verir)

### Frontend için:
1. Frontend servisinde **"Settings"** → **"Custom Domains"**
2. Domain'inizi ekleyin
3. DNS ayarlarını yapın

---

## 🚨 Sorun Giderme

### Backend çalışmıyor
- **Logları kontrol et**: Servis → "Logs" sekmesi
- **Database bağlantısını kontrol et**: `DATABASE_URL` doğru mu?
- **Port kontrolü**: Render otomatik port atar, `process.env.PORT` kullanın
- **Environment variables**: Tüm değişkenler doğru mu?

### Frontend build hatası
- **Build loglarını kontrol et**: Hangi adımda hata veriyor?
- **Node version**: Render genelde otomatik algılar
- **Environment variables**: `REACT_APP_*` değişkenleri doğru mu?

### CORS hatası
- Backend'de `CLIENT_URL` doğru ayarlanmış mı?
- Frontend URL'i backend'in CORS ayarlarına eklenmiş mi?

### Database migration hatası
- Backend servisinde "Shell" sekmesinden migration çalıştırın:
  ```bash
  node scripts/createTables.js
  ```

### Free tier uyku modu
- Render'ın free tier'ı 15 dakika kullanılmazsa uyku moduna girer
- İlk istekte 30-60 saniye sürebilir (cold start)
- Production için Starter plan ($7/ay) önerilir

**Uyku modunu önlemek için:**
1. **UptimeRobot (Ücretsiz):**
   - https://uptimerobot.com adresine kaydol
   - "Add New Monitor" → "HTTP(s)" seç
   - URL: `https://vps-backend-r1rf.onrender.com/api/health`
   - Monitoring Interval: 5 dakika (ücretsiz plan)
   - Her 5 dakikada bir ping atar, uyku moduna girmesini önler

2. **Cron-job.org (Ücretsiz):**
   - https://cron-job.org adresine kaydol
   - Yeni cron job oluştur
   - URL: `https://vps-backend-r1rf.onrender.com/api/health`
   - Schedule: Her 10 dakikada bir

3. **Starter Plan ($7/ay):**
   - Render'da backend servisini Starter plan'a yükselt
   - Her zaman çalışır, uyku moduna girmez

### Environment Variables güncellenmedi
- Değişkenleri ekledikten sonra servisi **"Manual Deploy"** → **"Clear build cache & deploy"** ile yeniden deploy edin

---

## 📝 Önemli Notlar

1. **JWT_SECRET ve SESSION_SECRET**
   - Production'da mutlaka güçlü secret'lar kullanın
   - Render'da "Generate" butonu ile otomatik oluşturabilirsiniz

2. **Database Migrations**
   - İlk deploy'da database tabloları oluşturulmalı
   - `server/scripts/createTables.js` script'ini çalıştırın

3. **Custom Domains**
   - Render ücretsiz SSL sertifikası verir
   - DNS ayarlarını yapmanız gerekir

4. **Cost Management**
   - Free tier: Backend uyku moduna girer (ilk istekte yavaş)
   - Starter plan ($7/ay): Her zaman çalışır
   - Static Site: Her zaman ücretsiz

5. **Auto-Deploy**
   - GitHub'a push yaptığınızda otomatik deploy olur
   - Belirli branch'ler için deploy ayarlayabilirsiniz

6. **Build Cache**
   - Render build cache kullanır (daha hızlı build)
   - Sorun olursa "Clear build cache & deploy" yapın

---

## 🎯 Hızlı Checklist

- [ ] Render'a kayıt olundu ve GitHub bağlandı
- [ ] PostgreSQL database oluşturuldu
- [ ] Backend servisi oluşturuldu ve ayarlandı
- [ ] Frontend servisi oluşturuldu ve ayarlandı
- [ ] Environment variables eklendi
- [ ] Database migration çalıştırıldı
- [ ] Deploy başarılı
- [ ] Frontend ve backend test edildi
- [ ] Custom domain eklendi (opsiyonel)

---

## 🔗 Yararlı Linkler

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

---

## 💡 İpuçları

1. **Free Tier için:**
   - Backend uyku moduna girer, ilk istekte yavaş başlar
   - Production için Starter plan önerilir

2. **Build Hızlandırma:**
   - `.dockerignore` veya `.renderignore` dosyası oluşturun
   - Gereksiz dosyaları build'e dahil etmeyin

3. **Log Monitoring:**
   - Render'da loglar 7 gün saklanır
   - Daha uzun süre için external logging servisi kullanın

4. **Health Checks:**
   - Backend'de health check endpoint'i ekleyin
   - Render otomatik olarak servisi kontrol eder

---

**İyi şanslar! 🚀**

