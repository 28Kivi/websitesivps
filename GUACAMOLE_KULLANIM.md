# Guacamole Kullanım Rehberi

## 1. Guacamole'da Manuel Bağlantı Oluşturma (Test İçin)

### Adım 1: Guacamole'a Giriş Yapın
- URL: `http://localhost:8080/guacamole`
- Kullanıcı: `guacadmin`
- Şifre: `guacadmin`

### Adım 2: Yeni Bağlantı Oluşturun
1. Sol menüden **"Connections"** (Bağlantılar) sekmesine tıklayın
2. Sağ üstteki **"New Connection"** (Yeni Bağlantı) butonuna tıklayın
3. Bağlantı bilgilerini girin:
   - **Name:** Sunucu adı (örn: "Test VDS")
   - **Protocol:** RDP veya VNC seçin
   - **Network:**
     - **Hostname:** Sunucu IP adresi
     - **Port:** RDP için 3389, VNC için 5900
   - **Authentication:**
     - **Username:** RDP/VNC kullanıcı adı
     - **Password:** Şifre
   - **Display:**
     - **Color depth:** 32-bit
     - **Resolution:** 1920x1080
4. **Save** (Kaydet) butonuna tıklayın

### Adım 3: Bağlantıyı Test Edin
1. Oluşturduğunuz bağlantıya tıklayın
2. Bağlantı penceresi açılacak
3. Masaüstü görünüyorsa başarılı!

## 2. Projede Otomatik Bağlantı (Backend Entegrasyonu)

Backend otomatik olarak Guacamole'da bağlantı oluşturur. Yapmanız gerekenler:

### Adım 1: Backend'i Yeniden Başlatın
```bash
cd server
npm run dev
```

### Adım 2: Frontend'de VDS Sunucusu Ekleyin
1. Projenizde giriş yapın
2. "Sunucu Ekle" butonuna tıklayın
3. Sunucu tipi olarak **"VDS"** seçin
4. Bilgileri girin:
   - **Sunucu Adı:** Test VDS
   - **IP Adresi:** Sunucu IP'si
   - **RDP Port:** 3389 (varsayılan)
   - **Kullanıcı Adı:** RDP kullanıcı adı
   - **Şifre:** RDP şifresi
   - **Desktop Type:** RDP veya VNC
5. **Kaydet** butonuna tıklayın

### Adım 3: Bağlan Butonuna Tıklayın
1. Dashboard'da eklediğiniz sunucuyu görün
2. **"Bağlan"** butonuna tıklayın
3. Yeni sekmede Guacamole iframe açılacak
4. Masaüstü görünmeli!

## 3. Sorun Giderme

### Bağlantı Kurulamıyor
- Sunucu IP'sinin erişilebilir olduğundan emin olun
- Firewall'da RDP (3389) veya VNC (5900) portunun açık olduğunu kontrol edin
- Kullanıcı adı ve şifrenin doğru olduğundan emin olun

### Guacamole'da Hata
- Guacamole loglarını kontrol edin: `docker logs guacamole`
- Backend loglarını kontrol edin
- Browser console'da hataları kontrol edin

### Backend Bağlanamıyor
- `.env` dosyasında Guacamole ayarlarının olduğundan emin olun
- Guacamole'ın çalıştığını kontrol edin: `docker ps | findstr guacamole`
- Backend'i yeniden başlatın

## 4. API Test

Backend'in Guacamole'a bağlanabildiğini test etmek için:

```bash
# Backend health check
curl http://localhost:5000/api/health

# Guacamole status check
curl http://localhost:5000/api/guacamole/status
```

## 5. İleri Seviye

### Guacamole'da Kullanıcı Yönetimi
- Sol menüden **"Users"** (Kullanıcılar) sekmesine gidin
- Yeni kullanıcılar oluşturabilirsiniz
- Her kullanıcıya farklı bağlantılar atayabilirsiniz

### Bağlantı Grupları
- **Connection Groups** oluşturarak bağlantıları organize edebilirsiniz
- Örneğin: "Production Servers", "Test Servers" gibi

### Kayıt ve Monitoring
- Guacamole otomatik olarak bağlantı geçmişini tutar
- **History** sekmesinden geçmiş bağlantıları görebilirsiniz

