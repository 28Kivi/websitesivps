# Siteye VDS Sunucusu Ekleme Rehberi

## PowerShell Komutları (Hızlı Başlangıç)

```powershell
# 1. Proje dizinine git
cd "C:\Users\myvps\Desktop\Silme amq"

# 2. Docker Desktop'ın çalıştığını kontrol et
docker ps
# Eğer hata alırsanız, Docker Desktop'ı başlatın:
# Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 3. Docker servislerini başlat (önce bunu çalıştırın)
docker-compose -f docker-compose.guacamole.yml up -d

# 4. Docker servislerinin çalıştığını kontrol et
docker ps
docker-compose -f docker-compose.guacamole.yml ps

# 5. Frontend'i başlat (client klasöründe, yeni PowerShell penceresinde)
cd client
npm start

# 6. Backend'i başlat (server klasöründe, başka bir PowerShell penceresinde)
cd ..\server
npm start

# 7. Tarayıcıyı otomatik aç
Start-Process "http://localhost:3000"
```

## Adım Adım: VDS Sunucusunu Projeye Ekleme

### 1. Frontend'e Giriş Yapın
1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Giriş yapın (veya kayıt olun)

### 2. Sunucu Ekleme Sayfasına Gidin
1. Dashboard'da **"+ Sunucu Ekle"** butonuna tıklayın
2. Veya direkt `/add-server` adresine gidin

### 3. VDS Sunucusu Bilgilerini Girin

**Temel Bilgiler:**
- **Sunucu Adı:** `Test VDS` (veya istediğiniz isim)
- **Sunucu Tipi:** `VDS` seçin
- **IP Adresi:** `94.154.46.114`

**RDP Bilgileri:**
- **RDP Port:** `3389` (varsayılan)
- **Kullanıcı Adı:** `Administrator`
- **Şifre:** `8zg3IkN6XWlveo_`
- **Desktop Type:** `RDP` seçin

**Not:** VNC kullanmıyorsanız VNC alanlarını boş bırakabilirsiniz.

### 4. Kaydet ve Bağlan
1. **"Kaydet"** butonuna tıklayın
2. Dashboard'a yönlendirileceksiniz
3. Eklediğiniz sunucuyu görün
4. **"Bağlan"** butonuna tıklayın
5. Yeni sekmede Guacamole iframe açılır
6. Masaüstü görünür! 🎉

## Nasıl Çalışır?

1. **"Bağlan" butonuna tıklayınca:**
   - Backend bir connection token oluşturur
   - Bu token ile Guacamole API'ye istek atılır
   - Guacamole'da otomatik olarak yeni bir bağlantı oluşturulur
   - Frontend iframe içinde Guacamole client'ı gösterir

2. **Backend Otomatik Olarak:**
   - Guacamole'da bağlantı oluşturur
   - Security mode: "Any" kullanır (en uyumlu)
   - Bağlantı ayarlarını optimize eder
   - URL'i frontend'e döndürür

## Önemli Notlar

### Security Mode
Backend otomatik olarak **"Any"** security mode kullanır. Bu:
- En uyumlu seçenektir
- Windows 10 VDS'lerde çalışır
- Otomatik olarak en iyi security type'ı seçer

### Port Bilgisi
VDS panelinde port gösterilmiyorsa:
- RDP için varsayılan: **3389**
- VNC için varsayılan: **5900**

### Şifre Güvenliği
- Şifreler veritabanında şifrelenmiş saklanır
- Her bağlantı için geçici token kullanılır
- Token 24 saat sonra expire olur

## Sorun Giderme

### Docker Desktop Çalışmıyor Hatası
```powershell
# Docker Desktop'ı başlat
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Veya Docker Desktop zaten çalışıyorsa yeniden başlat
docker ps
```

### Docker Compose Version Uyarısı
- `docker-compose.guacamole.yml` dosyasındaki `version` satırı kaldırıldı (artık gerekli değil)
- Modern Docker Compose versiyonları bunu otomatik algılar

### "Bağlantı oluşturulamadı" Hatası
- Backend'in çalıştığını kontrol edin
- Guacamole'ın çalıştığını kontrol edin: `docker ps | findstr guacamole`
- Backend loglarını kontrol edin
- Docker servislerini kontrol edin: `docker-compose -f docker-compose.guacamole.yml ps`

### Iframe Açılmıyor
- Browser console'da hataları kontrol edin
- CORS ayarlarını kontrol edin
- Guacamole URL'inin doğru olduğundan emin olun

### Masaüstü Görünmüyor
- Guacamole'da manuel bağlantı oluşturup test edin
- Security mode'u kontrol edin
- Sunucu bilgilerinin doğru olduğundan emin olun

## Test Etmek İçin

1. Frontend'de VDS sunucusu ekleyin
2. "Bağlan" butonuna tıklayın
3. Yeni sekmede masaüstü görünmeli
4. Fare ve klavye ile kontrol edebilmelisiniz

Başarılar! 🚀

