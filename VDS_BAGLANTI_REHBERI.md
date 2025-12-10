# VDS Bağlantı Rehberi

## Sunucu Bilgileri
- **IP:** 94.154.46.114
- **Kullanıcı:** Administrator
- **Şifre:** 8zg3IkN6XWlveo_
- **OS:** Windows 10

## Port Bilgisi

VDS panelinde port gösterilmiyorsa, genellikle **varsayılan RDP portu 3389** kullanılır.

### Port Kontrolü

Eğer 3389 çalışmazsa, şu portları deneyin:
- 3389 (varsayılan RDP)
- 3390
- 3388
- 13389

## Guacamole'da Bağlantı Ayarları

### 1. Yeni Bağlantı Oluşturun veya "test" Bağlantısını Düzenleyin

**Network Bölümü:**
- **Hostname:** `94.154.46.114`
- **Port:** `3389` (veya panelde belirtilen port)

**Authentication Bölümü:**
- **Username:** `Administrator`
- **Password:** `8zg3IkN6XWlveo_`
- **Domain:** BOŞ bırakın
- **Security mode:** `RDP` veya `Negotiate` seçin
- **Ignore server certificate:** ✅ İşaretleyin

**Display Bölümü:**
- **Width:** 1920
- **Height:** 1080
- **Color depth:** 32-bit
- **DPI:** 96

### 2. Önemli Ayarlar

**Security Mode:** Mutlaka seçin! Boş bırakmayın:
- `RDP` (en yaygın)
- `Negotiate` (alternatif)
- `TLS` (güvenli bağlantı)

**Domain:** Eğer domain yoksa BOŞ bırakın.

## Windows RDP Ayarları (Sunucuda)

Sunucuya başka bir yöntemle bağlanabiliyorsanız (örneğin VNC, KVM), şunları kontrol edin:

### 1. RDP Servisinin Çalıştığını Kontrol Edin
```powershell
Get-Service TermService
# Status: Running olmalı
```

### 2. RDP'yi Etkinleştirin
```powershell
# RDP'yi etkinleştir:
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -Value 0

# Firewall'da RDP'ye izin ver:
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
```

### 3. NLA'yı Kapatın (Eğer bağlantı sorunu varsa)
1. `Win + R` → `sysdm.cpl`
2. "Remote" sekmesi
3. "Allow connections only from computers running Remote Desktop with Network Level Authentication" seçeneğini **KAPATIN**

### 4. Firewall Kuralları
```powershell
# RDP portunu aç:
netsh advfirewall firewall add rule name="RDP" dir=in action=allow protocol=TCP localport=3389
```

## Projede Kullanım

Frontend'den VDS sunucusu eklerken:

1. **Tip:** VDS
2. **IP:** 94.154.46.114
3. **RDP Port:** 3389 (veya panelde belirtilen port)
4. **Kullanıcı:** Administrator
5. **Şifre:** 8zg3IkN6XWlveo_
6. **Desktop Type:** RDP

Backend otomatik olarak Guacamole'da bağlantı oluşturur.

## Sorun Giderme

### "Connection refused" Hatası
- Port 3389'u kontrol edin
- Firewall kurallarını kontrol edin
- RDP servisinin çalıştığını kontrol edin

### "Authentication failed" Hatası
- Kullanıcı adı ve şifreyi kontrol edin
- Domain alanını boş bırakın
- Security mode'u RDP veya Negotiate yapın

### "Security mode" Hatası
- Security mode dropdown'ından mutlaka bir seçenek seçin
- Boş bırakmayın!

