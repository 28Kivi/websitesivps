# OAuth Kurulum Rehberi

## Google OAuth Kurulumu

1. **Google Cloud Console'a gidin**
   - https://console.cloud.google.com/

2. **Yeni proje oluşturun** (veya mevcut projeyi seçin)

3. **OAuth consent screen'i yapılandırın**
   - APIs & Services > OAuth consent screen
   - User Type: External seçin
   - Uygulama bilgilerini doldurun

4. **Credentials oluşturun**
   - APIs & Services > Credentials
   - "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback` (development)
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback` (production)

5. **Client ID ve Secret'ı kopyalayın**

6. **`.env` dosyasına ekleyin:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

## GitHub OAuth Kurulumu

1. **GitHub'a gidin ve Settings'e gidin**
   - https://github.com/settings/developers

2. **New OAuth App oluşturun**
   - Developer settings > OAuth Apps > New OAuth App

3. **Bilgileri doldurun:**
   - Application name: Your App Name
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`

4. **Client ID ve Client Secret'ı kopyalayın**

5. **`.env` dosyasına ekleyin:**
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

## Production için

Production'da callback URL'leri güncelleyin:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback
CLIENT_URL=https://yourdomain.com
```

## Test

1. Backend'i başlatın
2. Frontend'i başlatın
3. Login sayfasında "Login with Google" veya "Login with GitHub" butonlarına tıklayın
4. OAuth provider'dan giriş yapın
5. Başarılı giriş sonrası dashboard'a yönlendirilmelisiniz

