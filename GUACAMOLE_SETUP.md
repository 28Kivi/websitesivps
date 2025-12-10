# Apache Guacamole Kurulum Rehberi

Apache Guacamole, RDP, VNC ve SSH bağlantıları için web tabanlı bir gateway'dir. Bu rehber Docker ile kurulumu anlatmaktadır.

## 1. Docker ile Kurulum (Önerilen)

### Gereksinimler
- Docker ve Docker Compose yüklü olmalı
- En az 2GB RAM
- Port 8080 boş olmalı (veya değiştirilebilir)

### Adım 1: Docker Compose Dosyası Oluştur

Proje root dizininde `docker-compose.guacamole.yml` dosyası oluşturun:

```yaml
version: '3.8'

services:
  guacd:
    image: guacamole/guacd:latest
    container_name: guacd
    restart: unless-stopped
    volumes:
      - guacd-drive:/drive
      - guacd-record:/record
    networks:
      - guacamole

  guacamole:
    image: guacamole/guacamole:latest
    container_name: guacamole
    restart: unless-stopped
    depends_on:
      - guacd
      - postgres
    environment:
      GUACD_HOSTNAME: guacd
      GUACD_PORT: 4822
      POSTGRES_HOSTNAME: postgres
      POSTGRES_DATABASE: guacamole_db
      POSTGRES_USERNAME: guacamole_user
      POSTGRES_PASSWORD: guacamole_password
    ports:
      - "8080:8080"
    networks:
      - guacamole

  postgres:
    image: postgres:15-alpine
    container_name: guacamole-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: guacamole_db
      POSTGRES_USER: guacamole_user
      POSTGRES_PASSWORD: guacamole_password
    volumes:
      - guacamole-db:/var/lib/postgresql/data
    networks:
      - guacamole

volumes:
  guacd-drive:
  guacd-record:
  guacamole-db:

networks:
  guacamole:
    driver: bridge
```

### Adım 2: Guacamole'u Başlat

```bash
docker-compose -f docker-compose.guacamole.yml up -d
```

### Adım 3: İlk Kurulum

1. Tarayıcıda `http://localhost:8080/guacamole` adresine gidin
2. Varsayılan giriş bilgileri:
   - **Kullanıcı adı:** `guacadmin`
   - **Şifre:** `guacadmin`
3. İlk girişte şifreyi değiştirmeniz istenecek

### Adım 4: Veritabanı İlk Kurulumu (Opsiyonel)

Eğer veritabanı şemasını manuel oluşturmak isterseniz:

```bash
docker exec -i guacamole-postgres psql -U guacamole_user -d guacamole_db < /path/to/initdb.sql
```

Veya Guacamole container'ı içinden:

```bash
docker exec -it guacamole /opt/guacamole/bin/initdb.sh --postgres
```

## 2. Manuel Kurulum (Docker Olmadan)

### Ubuntu/Debian için:

```bash
# Guacamole Server (guacd) kurulumu
sudo apt-get update
sudo apt-get install -y guacd libguac-client-rdp libguac-client-vnc libguac-client-ssh

# Guacamole Web App kurulumu
wget https://downloads.apache.org/guacamole/1.5.3/binary/guacamole-1.5.3.war
sudo mkdir -p /etc/guacamole
sudo mv guacamole-1.5.3.war /var/lib/tomcat9/webapps/guacamole.war

# Tomcat kurulumu
sudo apt-get install -y tomcat9 tomcat9-admin
sudo systemctl start tomcat9
sudo systemctl enable tomcat9

# PostgreSQL kurulumu
sudo apt-get install -y postgresql postgresql-contrib

# Veritabanı oluştur
sudo -u postgres createdb guacamole_db
sudo -u postgres createuser guacamole_user
sudo -u postgres psql -d guacamole_db -c "ALTER USER guacamole_user WITH PASSWORD 'guacamole_password';"
```

## 3. Backend Entegrasyonu

### Guacamole REST API Kullanımı

Guacamole REST API'sini kullanarak bağlantıları programatik olarak yönetebilirsiniz.

### API Token Alma

```javascript
// server/routes/guacamole.js
const axios = require('axios');

const GUACAMOLE_URL = process.env.GUACAMOLE_URL || 'http://localhost:8080/guacamole';
const GUACAMOLE_USER = process.env.GUACAMOLE_USER || 'guacadmin';
const GUACAMOLE_PASS = process.env.GUACAMOLE_PASS || 'guacadmin';

let authToken = null;

async function getAuthToken() {
  if (authToken) return authToken;
  
  try {
    const response = await axios.post(`${GUACAMOLE_URL}/api/tokens`, {
      username: GUACAMOLE_USER,
      password: GUACAMOLE_PASS
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    authToken = response.data.authToken;
    return authToken;
  } catch (error) {
    console.error('Guacamole auth error:', error);
    throw error;
  }
}
```

### Bağlantı Oluşturma

```javascript
async function createConnection(serverData) {
  const token = await getAuthToken();
  
  const connectionConfig = {
    parentIdentifier: 'ROOT',
    name: serverData.name,
    protocol: serverData.desktopType === 'RDP' ? 'rdp' : 'vnc',
    parameters: {
      hostname: serverData.ipAddress,
      port: serverData.desktopType === 'RDP' ? serverData.rdpPort : serverData.vncPort,
      username: serverData.rdpUsername || '',
      password: serverData.rdpPassword || serverData.vncPassword || '',
      'ignore-cert': 'true',
      'enable-wallpaper': 'true',
      'enable-font-smoothing': 'true',
      'enable-full-window-drag': 'true',
      'enable-desktop-composition': 'true',
      'enable-menu-animations': 'true',
      'disable-bitmap-caching': 'false',
      'disable-offscreen-caching': 'false',
      'color-depth': '32',
      'width': '1920',
      'height': '1080'
    }
  };

  try {
    const response = await axios.post(
      `${GUACAMOLE_URL}/api/session/data/postgresql/connections?token=${token}`,
      connectionConfig,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Connection creation error:', error.response?.data || error.message);
    throw error;
  }
}
```

## 4. Frontend Entegrasyonu

### Guacamole Client iframe ile Kullanım

```javascript
// client/src/components/Connect/VDSDesktop.js
const VDSDesktop = ({ server, token }) => {
  const [guacamoleUrl, setGuacamoleUrl] = useState(null);

  useEffect(() => {
    // Backend'den Guacamole connection URL'i al
    const fetchGuacamoleUrl = async () => {
      try {
        const response = await axios.get(`${API_URL}/guacamole/connection/${token}`);
        if (response.data.success) {
          // Guacamole connection URL'i
          const url = `${GUACAMOLE_URL}/#/client/${response.data.connectionId}`;
          setGuacamoleUrl(url);
        }
      } catch (error) {
        console.error('Guacamole URL fetch error:', error);
      }
    };

    if (server.type === 'VDS') {
      fetchGuacamoleUrl();
    }
  }, [server, token]);

  if (server.type === 'VDS' && guacamoleUrl) {
    return (
      <div className="vds-desktop-container">
        <iframe
          src={guacamoleUrl}
          style={{
            width: '100%',
            height: '100vh',
            border: 'none'
          }}
          title="Guacamole Desktop"
        />
      </div>
    );
  }

  return <div>Yükleniyor...</div>;
};
```

## 5. Environment Variables

`.env` dosyasına ekleyin:

```env
GUACAMOLE_URL=http://localhost:8080/guacamole
GUACAMOLE_USER=guacadmin
GUACAMOLE_PASS=your_secure_password
```

## 6. Güvenlik Notları

1. **Şifreleri Güvenli Tutun**: Guacamole admin şifresini güçlü yapın
2. **HTTPS Kullanın**: Production'da HTTPS kullanın
3. **Firewall**: Sadece gerekli portları açın
4. **Rate Limiting**: API çağrılarına rate limiting ekleyin
5. **Token Expiry**: Guacamole auth token'larını düzenli yenileyin

## 7. Troubleshooting

### Guacamole başlamıyor
```bash
docker logs guacamole
docker logs guacd
```

### Bağlantı kurulamıyor
- Firewall kurallarını kontrol edin
- Port 8080'in açık olduğundan emin olun
- Guacd servisinin çalıştığını kontrol edin: `docker ps`

### Veritabanı bağlantı hatası
- PostgreSQL container'ının çalıştığını kontrol edin
- Veritabanı şifresinin doğru olduğundan emin olun

## 8. Production Deployment

Production için:
1. Reverse proxy (Nginx) kullanın
2. SSL sertifikası ekleyin
3. Guacamole'u domain altında çalıştırın
4. Monitoring ve logging ekleyin
5. Backup stratejisi oluşturun

## Kaynaklar

- [Apache Guacamole Resmi Dokümantasyon](https://guacamole.apache.org/doc/gug/)
- [Docker Hub - Guacamole](https://hub.docker.com/r/guacamole/guacamole)
- [REST API Dokümantasyonu](https://guacamole.apache.org/doc/gug/rest-api.html)


