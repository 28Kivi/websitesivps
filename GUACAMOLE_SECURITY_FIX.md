# Guacamole Security Type Hatası Çözümü

## Hata: "Server refused connection (wrong security type?)"

Bu hata, Windows RDP sunucusunun istediği security type ile Guacamole'un gönderdiği security type'ın uyuşmadığını gösterir.

## Çözüm Adımları

### 1. Security Mode'u Değiştirin

Guacamole'da "test" bağlantısının ayarlarında:

**Authentication Bölümü:**
- **Security mode:** `RDP` yerine **`Negotiate`** deneyin
- Eğer çalışmazsa **`NLA`** deneyin
- Eğer o da çalışmazsa **`TLS`** deneyin

### 2. NLA (Network Level Authentication) Ayarları

Windows 10 genellikle NLA gerektirir. Guacamole'da:

**Authentication Bölümü:**
- **Security mode:** `NLA` veya `Negotiate` seçin
- **Domain:** BOŞ bırakın
- **Username:** `Administrator`
- **Password:** `8zg3IkN6XWlveo_`

### 3. Windows Sunucusunda NLA Kontrolü

Eğer sunucuya başka bir yöntemle erişebiliyorsanız:

1. `Win + R` → `sysdm.cpl`
2. "Remote" sekmesi
3. "Allow connections only from computers running Remote Desktop with Network Level Authentication" seçeneğini **KAPATIN** (işaretsiz bırakın)
4. "OK" → Sunucuyu yeniden başlatın

### 4. Alternatif: RDP Security Type'ı Değiştirin

Windows Registry'de:

```powershell
# NLA'yı kapat (daha az güvenli ama bağlantı için gerekli olabilir):
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name "SecurityLayer" -Value 0

# RDP security layer'ı ayarla:
# 0 = RDP Security Layer
# 1 = Negotiate
# 2 = TLS
```

## Hızlı Test Sırası

1. **Security mode: Negotiate** → Test edin
2. Çalışmazsa **Security mode: NLA** → Test edin
3. Çalışmazsa **Security mode: TLS** → Test edin
4. Çalışmazsa **Security mode: RDP** (NLA kapalıyken) → Test edin

## En Yaygın Çözüm

Windows 10 VDS'lerde genellikle:
- **Security mode:** `Negotiate` veya `NLA`
- **Domain:** BOŞ
- **Ignore server certificate:** ✅ İşaretli

Bu kombinasyon çoğu durumda çalışır.

