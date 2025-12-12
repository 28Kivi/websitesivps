const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const ConnectionToken = require('../models/ConnectionToken');
const Server = require('../models/Server');

const router = express.Router();

const GUACAMOLE_URL = process.env.GUACAMOLE_URL || 'http://localhost:8080/guacamole';
// Public URL for frontend (if not set, use CLIENT_URL + /guacamole path)
const GUACAMOLE_PUBLIC_URL = process.env.GUACAMOLE_PUBLIC_URL || 
  (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/guacamole` : GUACAMOLE_URL);
const GUACAMOLE_USER = process.env.GUACAMOLE_USER || 'guacadmin';
const GUACAMOLE_PASS = process.env.GUACAMOLE_PASS || 'guacadmin';

// Debug: Log environment variables on startup
console.log('=== Guacamole Configuration ===');
console.log('GUACAMOLE_URL:', GUACAMOLE_URL);
console.log('GUACAMOLE_PUBLIC_URL:', GUACAMOLE_PUBLIC_URL);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('GUACAMOLE_PUBLIC_URL (env):', process.env.GUACAMOLE_PUBLIC_URL);
console.log('==============================');

let authToken = null;
let tokenExpiry = null;
let dataSource = null; // Provider adını cache'le

// Guacamole auth token al
async function getAuthToken() {
  // Token hala geçerliyse kullan
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }

  try {
    console.log('Getting Guacamole auth token...');
    const response = await axios.post(
      `${GUACAMOLE_URL}/api/tokens`,
      `username=${encodeURIComponent(GUACAMOLE_USER)}&password=${encodeURIComponent(GUACAMOLE_PASS)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    authToken = response.data.authToken;
    // Token'ı 1 saat sonra expire olacak şekilde ayarla
    tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    
    // DataSource (provider) adını al
    // Guacamole token response'unda dataSource genellikle gelir
    if (!dataSource) {
      if (response.data && response.data.dataSource) {
        dataSource = response.data.dataSource;
        console.log('Guacamole dataSource from token response:', dataSource);
      } else {
        // Fallback: API'den al
        try {
          const dataSourcesResponse = await axios.get(
            `${GUACAMOLE_URL}/api/session/data?token=${authToken}`
          );
          const dataSources = Object.keys(dataSourcesResponse.data || {});
          if (dataSources.length > 0) {
            dataSource = dataSources[0]; // İlk provider'ı kullan
            console.log('Guacamole dataSource from API:', dataSource);
          } else {
            // PostgreSQL kullanılıyor (docker-compose'dan)
            dataSource = 'postgresql';
            console.log('No dataSource found in API response, using default: postgresql');
          }
        } catch (dsError) {
          console.log('Could not get dataSource from API, using default: postgresql');
          console.log('DataSource API error:', dsError.message);
          dataSource = 'postgresql'; // Fallback - docker-compose'da PostgreSQL var
        }
      }
    }
    
    // Eğer hala dataSource yoksa, postgresql kullan (docker-compose'da PostgreSQL var)
    if (!dataSource) {
      dataSource = 'postgresql';
      console.log('dataSource was still undefined, forcing to postgresql');
    }
    
    console.log('Guacamole auth token obtained, dataSource:', dataSource || 'postgresql');
    return authToken;
  } catch (error) {
    console.error('Guacamole auth error:', error.response?.data || error.message);
    console.error('Error code:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const connectionError = new Error('Guacamole sunucusuna bağlanılamıyor. Docker container çalışıyor mu kontrol edin: docker-compose -f docker-compose.guacamole.yml up -d');
      connectionError.code = 'ECONNREFUSED'; // Code'u koru
      throw connectionError;
    }
    throw new Error('Guacamole authentication failed: ' + (error.message || 'Bilinmeyen hata'));
  }
}

// DataSource (provider) adını al
async function getDataSource() {
  if (dataSource) {
    return dataSource;
  }
  
  const token = await getAuthToken();
  
  try {
    const response = await axios.get(
      `${GUACAMOLE_URL}/api/session/data?token=${token}`
    );
    const dataSources = Object.keys(response.data);
    if (dataSources.length > 0) {
      dataSource = dataSources[0];
      console.log('DataSource detected:', dataSource);
      return dataSource;
    }
  } catch (error) {
    console.log('Could not detect dataSource, using default: postgresql');
  }
  
  // Fallback
  dataSource = 'postgresql';
  return dataSource;
}

// Guacamole'da bağlantı oluştur
async function createGuacamoleConnection(serverData) {
  const token = await getAuthToken();
  let currentDataSource = await getDataSource();
  
  // dataSource undefined ise postgresql kullan
  if (!currentDataSource) {
    console.warn('dataSource is undefined, using postgresql as fallback');
    currentDataSource = 'postgresql';
    dataSource = 'postgresql'; // global değişkeni de güncelle
  }
  
  console.log('Creating connection with dataSource:', currentDataSource);

  // Guacamole API formatına göre connection config
  // Attributes field'ı null değerler içeren bir object olmalı
  // Guacamole connection config - attributes kısmını basitleştir
  const connectionConfig = {
    parentIdentifier: 'ROOT',
    name: `${serverData.name}_${Date.now()}`,
    protocol: serverData.desktopType === 'RDP' ? 'rdp' : 'vnc',
    attributes: {},
    parameters: {}
  };

  // RDP parametreleri
  if (serverData.desktopType === 'RDP') {
    // Boş alanları kontrol et
    if (!serverData.ipAddress || !serverData.rdpUsername || !serverData.rdpPassword) {
      console.error('RDP bilgileri eksik:', {
        ipAddress: serverData.ipAddress ? 'var' : 'YOK',
        username: serverData.rdpUsername ? 'var' : 'YOK',
        password: serverData.rdpPassword ? 'var' : 'YOK'
      });
      throw new Error('RDP bilgileri eksik: IP adresi, kullanıcı adı ve şifre gereklidir');
    }
    
    // RDP için gerekli parametreler - Guacamole RDP protokol formatı
    // Minimum ve uyumlu parametreler
    connectionConfig.parameters = {
      hostname: serverData.ipAddress,
      port: (serverData.rdpPort || 3389).toString(),
      username: serverData.rdpUsername,
      password: serverData.rdpPassword,
      'domain': '',
      'security': 'any',
      'ignore-cert': 'true',
      'ignore-ssl': 'true',
      'enable-wallpaper': 'false',
      'enable-font-smoothing': 'false',
      'enable-full-window-drag': 'false',
      'enable-desktop-composition': 'false',
      'enable-menu-animations': 'false',
      'disable-bitmap-caching': 'true',
      'disable-offscreen-caching': 'true',
      'color-depth': '16',
      'width': '1024',
      'height': '768',
      'dpi': '96'
    };
    
    console.log('RDP connection parameters:', {
      hostname: serverData.ipAddress,
      port: connectionConfig.parameters.port,
      username: serverData.rdpUsername,
      password: '***'
    });
  } else {
    // VNC parametreleri
    connectionConfig.parameters = {
      hostname: serverData.ipAddress,
      port: (serverData.vncPort || 5900).toString(),
      password: serverData.vncPassword || '',
      'color-depth': '32',
      'width': '1920',
      'height': '1080',
      'dpi': '96'
    };
  }

  try {
    console.log('Creating Guacamole connection with config:', JSON.stringify(connectionConfig, null, 2));
    console.log('Using dataSource:', currentDataSource);
    console.log('Guacamole URL:', `${GUACAMOLE_URL}/api/session/data/${currentDataSource}/connections?token=${token}`);
    
    // Önce kullanıcının yetkilerini kontrol et
    try {
      const permissionsResponse = await axios.get(
        `${GUACAMOLE_URL}/api/session/data/${currentDataSource}/self/effectivePermissions?token=${token}`
      );
      console.log('User permissions:', JSON.stringify(permissionsResponse.data, null, 2));
    } catch (permError) {
      console.warn('Could not check permissions:', permError.message);
      console.warn('Permissions error response:', permError.response?.data);
    }
    
    const response = await axios.post(
      `${GUACAMOLE_URL}/api/session/data/${currentDataSource}/connections?token=${token}`,
      connectionConfig,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('Guacamole connection response status:', response.status);
    console.log('Guacamole connection response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('=== Guacamole Connection Error ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response status:', error.response?.status);
    console.error('Error response statusText:', error.response?.statusText);
    console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
    
    // Permission Denied hatası için özel mesaj
    if (error.response?.data?.message === 'Permission Denied.' || 
        error.response?.status === 403 ||
        (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('Permission'))) {
      throw new Error('Guacamole\'da bağlantı oluşturma yetkisi yok. guacadmin kullanıcısının yetkilerini kontrol edin. Guacamole web arayüzüne giriş yapıp Settings > Users > guacadmin bölümünden yetkileri kontrol edin.');
    }
    
    console.error('Full error:', error);
    throw error;
  }
}

// Token ile Guacamole connection URL'i oluştur
router.get('/connection/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Connection token'ı doğrula
    const connectionToken = await ConnectionToken.findOne({
      where: { token },
      include: [
        { model: Server, as: 'server' },
      ],
    });

    if (!connectionToken) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş bağlantı',
      });
    }

    if (new Date(connectionToken.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Bağlantı süresi dolmuş',
      });
    }

    const server = await Server.findByPk(connectionToken.serverId);

    if (!server || server.type !== 'VDS') {
      return res.status(400).json({
        success: false,
        message: 'Bu sunucu VDS değil veya Guacamole ile bağlanamaz',
      });
    }

    // Sunucu bilgilerini hazırla
    const serverData = {
      name: server.name,
      ipAddress: server.ipAddress,
      desktopType: server.desktopType,
      rdpPort: server.rdpPort,
      rdpUsername: server.rdpUsername,
      rdpPassword: server.rdpPassword ? server.decrypt(server.rdpPassword) : null,
      vncPort: server.vncPort,
      vncPassword: server.vncPassword ? server.decrypt(server.vncPassword) : null,
    };

    // Önce mevcut çalışan connection'ı kontrol et
    console.log('=== Checking for existing Guacamole Connection ===');
    console.log('Server data:', JSON.stringify(serverData, null, 2));
    
    try {
      const authToken = await getAuthToken();
      const currentDataSource = await getDataSource() || 'postgresql';
      
      // Mevcut connection'ları listele
      try {
        const connectionsResponse = await axios.get(
          `${GUACAMOLE_URL}/api/session/data/${currentDataSource}/connections?token=${authToken}`
        );
        
        const connections = connectionsResponse.data;
        let existingConnectionId = null;
        
        if (connections && typeof connections === 'object') {
          console.log('Total connections found:', Object.keys(connections).length);
          console.log('Looking for connection with IP:', serverData.ipAddress);
          
          // ÖNCELİK 1: "test" connection'ını bul (çalışan connection)
          for (const [id, conn] of Object.entries(connections)) {
            if (conn && (conn.name === 'test' || conn.name === 'Test' || conn.name === 'TEST')) {
              existingConnectionId = id;
              console.log('✓ Found "test" connection (PRIORITY):', { id, name: conn.name });
              break;
            }
          }
          
          // ÖNCELİK 2: IP + port + username tam eşleşmesi
          if (!existingConnectionId) {
            for (const [id, conn] of Object.entries(connections)) {
              if (conn && conn.parameters && conn.parameters.hostname === serverData.ipAddress) {
                if (conn.parameters.port === (serverData.rdpPort || 3389).toString() &&
                    conn.parameters.username === serverData.rdpUsername) {
                  existingConnectionId = id;
                  console.log('✓ Found exact match connection:', { id, name: conn.name });
                  break;
                }
              }
            }
          }
          
          // ÖNCELİK 3: Sadece IP'ye göre ilk connection
          if (!existingConnectionId) {
            for (const [id, conn] of Object.entries(connections)) {
              if (conn && conn.parameters && conn.parameters.hostname === serverData.ipAddress) {
                existingConnectionId = id;
                console.log('✓ Found connection by IP only:', { id, name: conn.name });
                break;
              }
            }
          }
        }
        
        if (existingConnectionId) {
          console.log('✓ Using existing connection ID:', existingConnectionId);
          
          // Guacamole client URL formatı - token ile authentication
          // Use public URL for frontend
          const clientUrl = `${GUACAMOLE_PUBLIC_URL}/#/client/${existingConnectionId}?token=${authToken}`;
          
          console.log('Connection URL:', clientUrl.replace(authToken, 'TOKEN_HIDDEN'));
          
          return res.json({
            success: true,
            connectionId: existingConnectionId,
            url: clientUrl,
            iframeUrl: clientUrl,
            message: 'Mevcut bağlantı kullanılıyor'
          });
        } else {
          console.log('⚠ No existing connection found, will create new one');
        }
      } catch (listError) {
        console.log('Could not list connections, will create new one:', listError.message);
      }
    } catch (checkError) {
      console.log('Error checking existing connections, will create new one:', checkError.message);
    }

    // Mevcut connection yoksa yeni oluştur
    console.log('=== Creating New Guacamole Connection ===');
    console.log('Server data:', JSON.stringify(serverData, null, 2));
    
    try {
      const guacamoleConnection = await createGuacamoleConnection(serverData);
      console.log('Guacamole connection created:', JSON.stringify(guacamoleConnection, null, 2));
      
      // Connection ID'yi al (Guacamole API response formatı)
      // Response: {"name":"...","identifier":"2",...}
      let connectionId;
      if (guacamoleConnection && guacamoleConnection.identifier) {
        connectionId = guacamoleConnection.identifier;
        console.log('Connection ID from identifier:', connectionId);
      } else if (typeof guacamoleConnection === 'string') {
        connectionId = guacamoleConnection;
        console.log('Connection ID from string:', connectionId);
      } else if (guacamoleConnection && typeof guacamoleConnection === 'object') {
        // Response bir object ise, identifier'ı bul
        const keys = Object.keys(guacamoleConnection);
        console.log('Connection response keys:', keys);
        if (keys.length > 0) {
          const firstKey = keys[0];
          if (guacamoleConnection[firstKey] && guacamoleConnection[firstKey].identifier) {
            connectionId = guacamoleConnection[firstKey].identifier;
            console.log('Connection ID from nested object:', connectionId);
          } else {
            connectionId = firstKey; // Key'in kendisi ID olabilir
            console.log('Connection ID from key:', connectionId);
          }
        }
      }

      if (!connectionId) {
        console.error('Connection ID bulunamadı, response:', JSON.stringify(guacamoleConnection, null, 2));
        throw new Error('Guacamole connection ID alınamadı');
      }

      console.log('Final Guacamole connection ID:', connectionId);

      // Her connection için fresh bir Guacamole auth token al/kullan
      const guacamoleAuthToken = await getAuthToken();

      // DataSource'u al (Guacamole WebSocket tunnel için gerekli)
      const dataSource = await getDataSource() || 'postgresql';

      // Guacamole client URL formatı: 
      // Option 1: /#/client/CONNECTION_ID (token cookie/session'da olmalı - çalışmaz iframe'de)
      // Option 2: /#/client/CONNECTION_ID?token=AUTH_TOKEN (token URL'de - bu çalışır)
      // Option 3: Direkt connection parametreleri ile (daha iyi - her seferinde yeni connection gerekmez)
      
      // En iyi yöntem: Token'ı URL'e ekle ve dataSource parametresini de ekle
      // Guacamole WebSocket tunnel için dataSource gerekli (query parameter olarak)
      // Use public URL for frontend
      const clientUrl = `${GUACAMOLE_PUBLIC_URL}/#/client/${connectionId}?token=${guacamoleAuthToken}&dataSource=${dataSource}`;

      console.log('Generated Guacamole client URL with auth token');
      console.log('Connection ID:', connectionId);
      console.log('DataSource:', dataSource);
      console.log('DEBUG - GUACAMOLE_PUBLIC_URL value:', GUACAMOLE_PUBLIC_URL);
      console.log('DEBUG - process.env.GUACAMOLE_PUBLIC_URL:', process.env.GUACAMOLE_PUBLIC_URL);
      console.log('DEBUG - process.env.CLIENT_URL:', process.env.CLIENT_URL);
      console.log('Client URL (token hidden):', clientUrl.replace(guacamoleAuthToken, 'TOKEN_HIDDEN'));

      res.json({
        success: true,
        connectionId: connectionId,
        url: clientUrl,
        iframeUrl: clientUrl, // iframeUrl ve url aynı - token ile otomatik giriş
      });
    } catch (createError) {
      console.error('Guacamole connection creation failed:', createError.message);
      console.error('Full error:', createError);
      console.error('Error code:', createError.code);
      console.error('Error response:', createError.response?.data);
      
      // Guacamole sunucusuna bağlanılamıyorsa, kullanıcıya açıklayıcı hata döndür
      const isConnectionRefused = createError.code === 'ECONNREFUSED' || 
                                   createError.message?.includes('ECONNREFUSED') ||
                                   createError.message?.includes('Guacamole sunucusuna bağlanılamıyor');
      
      if (isConnectionRefused) {
        return res.status(503).json({
          success: false,
          message: 'Guacamole sunucusuna bağlanılamıyor. Guacamole deploy edilmiş mi kontrol edin.',
          error: 'Guacamole service unavailable',
          details: 'Guacamole servisi çalışmıyor veya erişilemiyor. VDS (RDP/VNC) bağlantıları için Guacamole gereklidir.',
          serverInfo: {
            name: serverData.name,
            ipAddress: serverData.ipAddress,
            type: 'VDS',
            desktopType: serverData.desktopType
          }
        });
      }
      
      // Alternatif: Mevcut çalışan connection'ı kullan
      // Guacamole'da manuel oluşturulan connection'ı bul
      try {
        console.log('Trying to find existing connection for IP:', serverData.ipAddress);
        const authToken = await getAuthToken();
        const currentDataSource = await getDataSource() || 'postgresql';
        const connectionsResponse = await axios.get(
          `${GUACAMOLE_URL}/api/session/data/${currentDataSource}/connections?token=${authToken}`
        );
        
        // Sunucu IP'sine göre mevcut bağlantıyı bul
        const connections = connectionsResponse.data;
        let existingConnectionId = null;
        let existingConnection = null;
        
        if (connections && typeof connections === 'object') {
          for (const [id, conn] of Object.entries(connections)) {
            if (conn && conn.parameters && conn.parameters.hostname === serverData.ipAddress) {
              existingConnectionId = id;
              existingConnection = conn;
              console.log('Found existing connection:', { id, name: conn.name, hostname: conn.parameters.hostname });
              break;
            }
          }
        }
        
        if (existingConnectionId) {
          console.log('Using existing connection ID:', existingConnectionId);
          const clientUrl = `${GUACAMOLE_PUBLIC_URL}/#/client/${existingConnectionId}?token=${authToken}`;
          return res.json({
            success: true,
            connectionId: existingConnectionId,
            url: clientUrl,
            iframeUrl: clientUrl,
            message: 'Mevcut bağlantı kullanılıyor'
          });
        } else {
          console.log('No existing connection found for IP:', serverData.ipAddress);
        }
      } catch (listError) {
        console.error('Failed to list existing connections:', listError.message);
        // listError da ECONNREFUSED olabilir, kontrol et
        const isListErrorConnectionRefused = listError.code === 'ECONNREFUSED' || 
                                             listError.message?.includes('ECONNREFUSED') ||
                                             listError.message?.includes('Guacamole sunucusuna bağlanılamıyor');
        
        if (isListErrorConnectionRefused) {
          return res.status(503).json({
            success: false,
            message: 'Guacamole sunucusuna bağlanılamıyor. Guacamole deploy edilmiş mi kontrol edin.',
            error: 'Guacamole service unavailable',
            details: 'Guacamole servisi çalışmıyor veya erişilemiyor. VDS (RDP/VNC) bağlantıları için Guacamole gereklidir.',
            serverInfo: {
              name: serverData.name,
              ipAddress: serverData.ipAddress,
              type: 'VDS',
              desktopType: serverData.desktopType
            }
          });
        }
      }
      
      // Fallback: Eğer API başarısız olursa, direkt Guacamole web arayüzüne yönlendir
      const fallbackUrl = `${GUACAMOLE_URL}/#/settings/connections`;
      
      // Hiçbir şey işe yaramazsa, hata döndür ama detaylı bilgi ver
      res.status(503).json({
        success: false,
        error: 'Guacamole bağlantısı oluşturulamadı',
        message: createError.response?.data?.message || createError.message || 'Guacamole sunucusuna bağlanılamıyor',
        details: 'Guacamole servisi çalışmıyor veya erişilemiyor. VDS (RDP/VNC) bağlantıları için Guacamole gereklidir.',
        serverInfo: {
          name: serverData.name,
          ipAddress: serverData.ipAddress,
          type: 'VDS',
          desktopType: serverData.desktopType
        },
        fallbackUrl: fallbackUrl
      });
    }
  } catch (error) {
    console.error('Guacamole connection error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error response:', error.response?.data);
    res.status(500).json({
      success: false,
      message: 'Guacamole bağlantısı oluşturulamadı',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
    });
  }
});

// Guacamole durumunu kontrol et
router.get('/status', async (req, res) => {
  try {
    const token = await getAuthToken();
    res.json({
      success: true,
      status: 'connected',
      guacamoleUrl: GUACAMOLE_URL,
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'disconnected',
      error: error.message,
    });
  }
});

module.exports = router;

