# Guacamole Hızlı Başlangıç

## Bağlantıya Nasıl Bağlanılır?

### Yöntem 1: Bağlantı Listesinden (En Kolay)
1. Guacamole ana sayfasında "test" bağlantısını bulun
2. Bağlantının **sağında bir play/başlat ikonu** olmalı (▶️)
3. Bu ikona tıklayın → Direkt bağlanır!

### Yöntem 2: Ayarlar Sayfasından
1. "test" bağlantısına tıklayın → Ayarlar sayfası açılır
2. Ayarları kontrol edin (gerekirse değiştirin)
3. **"Save"** (Kaydet) butonuna tıklayın
4. Sayfanın **üst kısmında** veya **sağ üstte** **"Connect"** (Bağlan) butonunu bulun
5. "Connect" butonuna tıklayın → Bağlantı açılır

### Yöntem 3: Sağ Tık Menüsü
1. "test" bağlantısına **sağ tıklayın**
2. Açılan menüden **"Connect"** seçeneğini tıklayın

## Bağlantı Açıldığında

- Yeni bir pencere/sekme açılır
- RDP masaüstü görünür
- Fare ve klavye ile kontrol edebilirsiniz
- Bağlantıyı kapatmak için pencereyi kapatın veya "Disconnect" butonuna tıklayın

## Sorun Giderme

### Bağlantı Açılmıyor
- **Hostname/IP kontrolü:** 94.154.46.114 erişilebilir mi?
- **Port kontrolü:** 3389 portu açık mı?
- **Firewall:** Windows Firewall RDP'ye izin veriyor mu?
- **Kullanıcı adı/şifre:** Administrator şifresi doğru mu?

### "Connection Failed" Hatası
- Sunucu çalışıyor mu?
- RDP servisi aktif mi? (Windows'ta: `services.msc` → Remote Desktop Services)
- Network bağlantısı var mı?

### Bağlantı Yavaş
- **Color depth:** 16-bit'e düşürün (ayarlardan)
- **Resolution:** 1280x720 gibi daha düşük çözünürlük deneyin
- **Disable wallpaper:** Ayarlardan "Enable wallpaper" kapatın

## Projede Otomatik Kullanım

Manuel bağlantı oluşturmanıza gerek yok! Projede:

1. Frontend'den VDS sunucusu ekleyin
2. "Bağlan" butonuna tıklayın
3. Backend otomatik olarak Guacamole'da bağlantı oluşturur
4. Iframe içinde masaüstü görünür

Bu şekilde her kullanıcı kendi sunucularını yönetebilir!

