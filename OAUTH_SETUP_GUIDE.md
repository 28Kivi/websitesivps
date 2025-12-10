# 🔐 OAuth (Google & GitHub) Kurulum Rehberi

Bu rehber, Google ve GitHub OAuth entegrasyonunu nasıl ekleyeceğinizi açıklar.

---

## 📋 İçindekiler
1. [Google OAuth Kurulumu](#google-oauth-kurulumu)
2. [GitHub OAuth Kurulumu](#github-oauth-kurulumu)
3. [Environment Variables Ayarlama](#environment-variables-ayarlama)
4. [Test Etme](#test-etme)

---

## 🔵 Google OAuth Kurulumu

### Adım 1: Google Cloud Console'a Giriş
1. **Google Cloud Console**'a gidin: https://console.cloud.google.com/
2. Google hesabınızla giriş yapın

### Adım 2: Yeni Proje Oluşturma
1. Üst menüden **"Proje Seç"** veya **"New Project"** tıklayın
2. Proje adı girin (örn: "ServerHub OAuth")
3. **"Oluştur"** butonuna tıklayın

### Adım 3: OAuth Consent Screen Yapılandırması
1. Sol menüden **"APIs & Services"** > **"OAuth consent screen"** seçin
2. **User Type** seçin:
   - **External** (genel kullanım için)
   - **Internal** (sadece Google Workspace için)
3. **"Create"** tıklayın
4. Formu doldurun:
   - **App name**: ServerHub (veya istediğiniz isim)
   - **User support email**: E-posta adresiniz
   - **Developer contact information**: E-posta adresiniz
5. **"Save and Continue"** tıklayın
6. **Scopes** sayfasında **"Save and Continue"** tıklayın (varsayılan scopes yeterli)
7. **Test users** sayfasında (External seçtiyseniz) test kullanıcıları ekleyin
8. **"Save and Continue"** tıklayın
9. **Summary** sayfasında **"Back to Dashboard"** tıklayın

### Adım 4: OAuth 2.0 Credentials Oluşturma
1. Sol menüden **"APIs & Services"** > **"Credentials"** seçin
2. Üstte **"+ CREATE CREDENTIALS"** tıklayın
3. **"OAuth client ID"** seçin
4. **Application type** seçin:
   - **Web application** (backend için)
5. **Name** girin (örn: "ServerHub Web Client")
6. **Authorized JavaScript origins** ekleyin:
   ```
   http://localhost:5000
   https://yourdomain.com
   ```
7. **Authorized redirect URIs** ekleyin:
   ```
   http://localhost:5000/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
8. **"Create"** tıklayın
9. **Client ID** ve **Client Secret** değerlerini kopyalayın (bir daha gösterilmeyecek!)

---

## 🐙 GitHub OAuth Kurulumu

### Adım 1: GitHub Developer Settings
1. GitHub hesabınıza giriş yapın
2. Sağ üst köşeden profil fotoğrafınıza tıklayın
3. **"Settings"** seçin
4. Sol menüden **"Developer settings"** seçin
5. **"OAuth Apps"** > **"New OAuth App"** tıklayın

### Adım 2: OAuth App Bilgilerini Doldurma
1. **Application name**: ServerHub (veya istediğiniz isim)
2. **Homepage URL**:
   ```
   http://localhost:3000
   ```
   veya production için:
   ```
   https://yourdomain.com
   ```
3. **Authorization callback URL**:
   ```
   http://localhost:5000/api/auth/github/callback
   ```
   veya production için:
   ```
   https://yourdomain.com/api/auth/github/callback
   ```
4. **"Register application"** tıklayın

### Adım 3: Client ID ve Secret Alma
1. Sayfada **Client ID** görünecek (kopyalayın)
2. **"Generate a new client secret"** butonuna tıklayın
3. **Client secret** değerini kopyalayın (bir daha gösterilmeyecek!)

---

## ⚙️ Environment Variables Ayarlama

### Adım 1: .env Dosyasını Düzenleme

`server/.env` dosyasını açın (yoksa oluşturun) ve şu değişkenleri ekleyin:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Frontend URL (OAuth callback için)
CLIENT_URL=http://localhost:3000
```

### Adım 2: Production için .env Ayarları

Production ortamında:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback

# Frontend URL
CLIENT_URL=https://yourdomain.com
```

### Adım 3: .env Dosyasını Güvenli Tutma

⚠️ **ÖNEMLİ:**
- `.env` dosyasını **ASLA** Git'e commit etmeyin
- `.gitignore` dosyasında `.env` olduğundan emin olun
- Production'da environment variables'ları güvenli bir şekilde saklayın

---

## 🧪 Test Etme

### Adım 1: Backend'i Yeniden Başlatma
```bash
cd server
npm start
# veya
npm run dev
```

### Adım 2: Frontend'de OAuth Butonlarını Kontrol Etme
1. Frontend'i başlatın: `cd client && npm start`
2. Login sayfasına gidin: `http://localhost:3000/login`
3. Google ve GitHub butonlarının göründüğünü kontrol edin

### Adım 3: OAuth Akışını Test Etme

#### Google OAuth Test:
1. Login sayfasında **"Google ile Giriş"** butonuna tıklayın
2. Google hesabınızı seçin
3. İzinleri onaylayın
4. Dashboard'a yönlendirilmelisiniz

#### GitHub OAuth Test:
1. Login sayfasında **"GitHub ile Giriş"** butonuna tıklayın
2. GitHub hesabınızla giriş yapın
3. İzinleri onaylayın
4. Dashboard'a yönlendirilmelisiniz

---

## 🔧 Sorun Giderme

### Hata: "Unknown authentication strategy"
- **Çözüm**: Backend'i yeniden başlatın ve `.env` dosyasının doğru olduğundan emin olun

### Hata: "redirect_uri_mismatch"
- **Çözüm**: Google/GitHub console'da redirect URI'ların tam olarak eşleştiğinden emin olun
- Örnek: `http://localhost:5000/api/auth/google/callback` (sonunda `/` olmamalı)

### Hata: "invalid_client"
- **Çözüm**: Client ID ve Secret'ların doğru kopyalandığından emin olun
- Boşluk veya yeni satır karakterleri olmamalı

### OAuth butonları görünmüyor
- **Çözüm**: Frontend'de OAuth butonlarının render edildiğinden emin olun
- Login component'ini kontrol edin

### Callback URL çalışmıyor
- **Çözüm**: 
  - Backend'in çalıştığından emin olun
  - Port 5000'in açık olduğundan emin olun
  - CORS ayarlarını kontrol edin

---

## 📝 Örnek .env Dosyası

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Session
SESSION_SECRET=your-session-secret-here

# Server
PORT=5000
NODE_ENV=development

# Frontend
CLIENT_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=abcdefghijklmnop1234
GITHUB_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz1234567890abcdef
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

---

## 🚀 Production Deployment

### Google OAuth Production Ayarları:
1. Google Cloud Console'da yeni bir OAuth client oluşturun (production için)
2. **Authorized redirect URIs**'a production URL'inizi ekleyin:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```
3. Production `.env` dosyasına production credentials'ları ekleyin

### GitHub OAuth Production Ayarları:
1. GitHub'da mevcut OAuth App'i düzenleyin
2. **Authorization callback URL**'i güncelleyin:
   ```
   https://yourdomain.com/api/auth/github/callback
   ```
3. Production `.env` dosyasına production credentials'ları ekleyin

---

## ✅ Checklist

- [ ] Google Cloud Console'da proje oluşturuldu
- [ ] Google OAuth consent screen yapılandırıldı
- [ ] Google OAuth client ID ve secret alındı
- [ ] GitHub OAuth app oluşturuldu
- [ ] GitHub client ID ve secret alındı
- [ ] `.env` dosyasına tüm değişkenler eklendi
- [ ] Backend yeniden başlatıldı
- [ ] OAuth butonları frontend'de görünüyor
- [ ] Google OAuth test edildi
- [ ] GitHub OAuth test edildi
- [ ] Production URL'leri yapılandırıldı (production için)

---

**İyi şanslar! 🎉**

