# 🚂 Railway Deployment Rehberi

Bu rehber, projenizi Railway.app'e nasıl deploy edeceğinizi adım adım açıklar.

## 📋 İçindekiler
1. [Hazırlık](#hazırlık)
2. [Railway'a Kayıt ve Proje Oluşturma](#railwaya-kayıt-ve-proje-oluşturma)
3. [GitHub Repo'yu Bağlama](#github-repoyu-bağlama)
4. [PostgreSQL Database Ekleme](#postgresql-database-ekleme)
5. [Backend Servisi Oluşturma](#backend-servisi-oluşturma)
6. [Frontend Servisi Oluşturma](#frontend-servisi-oluşturma)
7. [Environment Variables](#environment-variables)
8. [Deploy ve Test](#deploy-ve-test)
9. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Hazırlık

### 1. GitHub'a Push
Önce kodunuzu GitHub'a push ettiğinizden emin olun:

```bash
git add .
git commit -m "Railway deployment için hazır"
git push origin main
```

### 2. Gerekli Dosyalar
- ✅ `railway.json` (root dizinde)
- ✅ `server/package.json` (start script'i var)
- ✅ `client/package.json` (build script'i var)

---

## 🚂 Railway'a Kayıt ve Proje Oluşturma

1. **Railway'a kaydol**: https://railway.app
   - GitHub hesabınızla giriş yapın (önerilir)

2. **Yeni Proje Oluştur**
   - Dashboard'da "New Project" butonuna tıklayın
   - "Deploy from GitHub repo" seçeneğini seçin
   - GitHub repo'nuzu seçin ve authorize edin

---

## 🗄️ PostgreSQL Database Ekleme

1. Railway projenizde **"New"** butonuna tıklayın
2. **"Database"** → **"Add PostgreSQL"** seçin
3. Railway otomatik olarak bir PostgreSQL instance oluşturur
4. Database'in **"Variables"** sekmesine gidin
5. `DATABASE_URL` değişkenini kopyalayın (daha sonra kullanacağız)

---

## 🔙 Backend Servisi Oluşturma

### Adım 1: Yeni Servis Ekle
1. Projenizde **"New"** → **"GitHub Repo"** seçin
2. Aynı repo'yu seçin
3. Railway otomatik olarak servisi oluşturur

### Adım 2: Servis Ayarları
1. Servise tıklayın
2. **"Settings"** sekmesine gidin
3. **Root Directory**: `server` olarak ayarlayın
4. **Start Command**: `npm start` (otomatik algılanır)

### Adım 3: Environment Variables
**"Variables"** sekmesine gidin ve şunları ekleyin:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this-in-production
CLIENT_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

**Not:** 
- `${{Postgres.DATABASE_URL}}` → PostgreSQL servisinizin adını kullanın
- `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` → Frontend servisinizin adını kullanın
- Railway otomatik olarak servisler arası referansları çözer

### Adım 4: Custom Domain (Opsiyonel)
1. **"Settings"** → **"Networking"**
2. **"Generate Domain"** ile otomatik domain alın
3. Veya kendi domain'inizi ekleyin

---

## 🎨 Frontend Servisi Oluşturma

### Seçenek 1: Static Site (Önerilen)

1. **"New"** → **"GitHub Repo"** → Aynı repo'yu seçin
2. **Settings** → **Root Directory**: `client`
3. **Settings** → **Build Command**: `npm install && npm run build`
4. **Settings** → **Start Command**: `npx serve -s build -l 3000`

**Veya Railway'ın otomatik algılaması için:**

1. **"New"** → **"Static Site"** seçin
2. **Root Directory**: `client`
3. **Build Command**: `npm install && npm run build`
4. **Output Directory**: `build`

### Seçenek 2: Node.js Servisi

1. **"New"** → **"GitHub Repo"** → Aynı repo'yu seçin
2. **Settings** → **Root Directory**: `client`
3. **Settings** → **Build Command**: `npm install && npm run build`
4. **Settings** → **Start Command**: `npx serve -s build -l $PORT`

**Not:** `serve` paketini `client/package.json`'a eklemeniz gerekebilir:

```bash
cd client
npm install --save serve
```

### Environment Variables (Frontend)
**"Variables"** sekmesine gidin:

```env
REACT_APP_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
REACT_APP_GUACAMOLE_URL=https://guacamole.yourdomain.com/guacamole
```

**Not:** 
- `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` → Backend servisinizin adını kullanın
- Guacamole için ayrı bir servis kurmanız gerekebilir (Docker ile)

---

## 🔐 Environment Variables Özeti

### Backend Variables
```
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
CLIENT_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Frontend Variables
```
REACT_APP_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
REACT_APP_GUACAMOLE_URL=https://guacamole.yourdomain.com/guacamole
```

**Önemli:** Railway'de servisler arası referanslar için `${{ServiceName.VARIABLE_NAME}}` formatını kullanın.

---

## 🚀 Deploy ve Test

1. **Deploy Otomatik Başlar**
   - GitHub'a push yaptığınızda Railway otomatik deploy eder
   - Veya manuel olarak **"Deploy"** butonuna tıklayın

2. **Logları İzle**
   - Her servisin **"Deployments"** sekmesinde logları görebilirsiniz
   - Hataları buradan kontrol edin

3. **Test Et**
   - Frontend URL'ini açın
   - Backend API'yi test edin: `https://your-backend.railway.app/api/auth/login`

---

## 🐳 Guacamole Deployment (Opsiyonel)

Guacamole için Railway'de Docker kullanabilirsiniz:

1. **"New"** → **"GitHub Repo"**
2. **Settings** → **Root Directory**: `.` (root)
3. **Settings** → **Dockerfile Path**: `Dockerfile.guacamole` (oluşturmanız gerekir)

Veya ayrı bir VPS'te Guacamole çalıştırın ve URL'ini environment variable olarak ekleyin.

---

## 🚨 Sorun Giderme

### Backend çalışmıyor
- **Logları kontrol et**: Servis → Deployments → Logs
- **Database bağlantısını kontrol et**: `DATABASE_URL` doğru mu?
- **Port kontrolü**: Railway otomatik port atar, `process.env.PORT` kullanın

### Frontend build hatası
- **Node version**: Railway genelde otomatik algılar
- **Build loglarını kontrol et**: Hangi adımda hata veriyor?
- **Environment variables**: `REACT_APP_*` değişkenleri doğru mu?

### CORS hatası
- Backend'de `CLIENT_URL` doğru ayarlanmış mı?
- Frontend URL'i backend'in CORS ayarlarına eklenmiş mi?

### Database migration hatası
- Railway'de migration script'i çalıştırmanız gerekebilir
- **Backend servisinde** → **"Deployments"** → **"Run Command"**:
  ```bash
  cd server && node scripts/createTables.js
  ```

### Environment Variables çalışmıyor
- Railway'de servis referansları için `${{ServiceName.VARIABLE}}` formatını kullanın
- Değişkenlerin doğru servise eklendiğinden emin olun
- Deploy sonrası değişkenler aktif olur

---

## 📝 Önemli Notlar

1. **JWT_SECRET ve SESSION_SECRET**
   - Production'da mutlaka güçlü secret'lar kullanın
   - Railway'de **"Generate"** butonu ile otomatik oluşturabilirsiniz

2. **Database Migrations**
   - İlk deploy'da database tabloları oluşturulmalı
   - `server/scripts/createTables.js` script'ini çalıştırın

3. **Custom Domains**
   - Railway ücretsiz domain verir: `your-app.railway.app`
   - Kendi domain'inizi de ekleyebilirsiniz (DNS ayarları gerekir)

4. **Cost Management**
   - Railway ücretsiz tier'da sınırlı kaynak verir
   - Kullanımınızı **"Usage"** sekmesinden takip edin

5. **Auto-Deploy**
   - GitHub'a push yaptığınızda otomatik deploy olur
   - Belirli branch'ler için deploy ayarlayabilirsiniz

---

## 🎯 Hızlı Checklist

- [ ] GitHub repo'ya push edildi
- [ ] Railway'a kayıt olundu ve proje oluşturuldu
- [ ] PostgreSQL database eklendi
- [ ] Backend servisi oluşturuldu ve ayarlandı
- [ ] Frontend servisi oluşturuldu ve ayarlandı
- [ ] Environment variables eklendi
- [ ] Database migration çalıştırıldı
- [ ] Deploy başarılı
- [ ] Frontend ve backend test edildi
- [ ] Custom domain eklendi (opsiyonel)

---

## 🔗 Yararlı Linkler

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

---

**İyi şanslar! 🚀**

