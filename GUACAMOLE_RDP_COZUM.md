# Guacamole RDP Bağlantı Sorunu Çözümü

## Sorun: "RDP server closed/refused connection"

Log'da görünen hata: `RDP server closed/refused connection: Disconnected`

## Çözüm Adımları

### 1. Guacamole'da Bağlantı Ayarlarını Düzeltin

"test" bağlantısının ayarlar sayfasında şunları kontrol edin:

#### Authentication Bölümü:
- **Security mode:** `RDP` veya `Negotiate` seçin (boş bırakmayın!)
- **Domain:** Eğer domain yoksa BOŞ bırakın
- **Ignore server certificate:** ✅ İşaretleyin
- **Disable authentication:** ❌ İşaretsiz (kapalı)

#### Display Bölümü:
- **Width:** 1920
- **Height:** 1080
- **Color depth:** 32-bit veya 24-bit
- **DPI:** 96

#### Performance Bölümü:
- **Enable wallpaper:** ✅ İşaretleyin
- **Enable font smoothing:** ✅ İşaretleyin
- **Enable full window drag:** ✅ İşaretleyin
- **Enable desktop composition:** ✅ İşaretleyin
- **Enable menu animations:** ✅ İşaretleyin

### 2. Windows RDP Ayarlarını Kontrol Edin

Sunucuda (94.154.46.114) şunları kontrol edin:

#### RDP Servisinin Çalıştığını Kontrol Edin:
```powershell
# Windows'ta PowerShell'de:
Get-Service TermService
# Status: Running olmalı
```

#### NLA (Network Level Authentication) Ayarları:
1. `Win + R` → `sysdm.cpl` → Enter
2. "Remote" sekmesi
3. "Allow remote connections to this computer" seçili olmalı
4. **"Allow connections only from computers running Remote Desktop with Network Level Authentication"** seçeneğini **KAPATIN** (işaretsiz bırakın)

#### Firewall Kuralları:
```powershell
# RDP portunu açın:
netsh advfirewall firewall add rule name="RDP" dir=in action=allow protocol=TCP localport=3389
```

#### Kullanıcı İzinleri:
1. `Win + R` → `sysdm.cpl` → Enter
2. "Remote" sekmesi → "Select Users"
3. Administrator kullanıcısının listede olduğundan emin olun

### 3. Guacamole Bağlantı Ayarlarını Güncelleyin

"test" bağlantısında:

1. **Security mode:** Dropdown'dan `RDP` seçin (EN ÖNEMLİSİ!)
2. **Domain:** Boş bırakın (eğer domain yoksa)
3. **Ignore server certificate:** ✅ İşaretleyin
4. **Save** butonuna tıklayın
5. Tekrar **Connect** deneyin

### 4. Alternatif: Security Mode'u Değiştirin

Eğer `RDP` çalışmazsa:
- `Negotiate` deneyin
- `TLS` deneyin
- `NLA` deneyin (eğer Windows'ta NLA açıksa)

### 5. Test Komutları

Sunucuda RDP'nin çalıştığını test edin:

```powershell
# RDP portunu kontrol et:
Test-NetConnection -ComputerName localhost -Port 3389

# RDP servisini başlat (eğer durmuşsa):
Start-Service TermService
```

### 6. Guacamole Loglarını İzleyin

Bağlantı denemesi sırasında logları izleyin:

```bash
docker logs -f guacd
```

Hangi hatayı verdiğini görün.

## Hızlı Çözüm (En Yaygın Sorun)

1. Guacamole'da "test" bağlantısını açın
2. **Security mode** dropdown'ından **"RDP"** seçin (boş bırakmayın!)
3. **Domain** alanını boş bırakın
4. **Ignore server certificate** ✅ işaretleyin
5. **Save** → **Connect**

Bu genellikle sorunu çözer!

