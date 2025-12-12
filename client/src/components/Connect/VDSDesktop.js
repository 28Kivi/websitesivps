import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { logger } from '../../utils/logger';
import './VDSDesktop.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const GUACAMOLE_URL = process.env.REACT_APP_GUACAMOLE_URL || 'http://localhost:8080/guacamole';

const VDSDesktop = ({ server, token }) => {
  const screenRef = useRef(null);
  const rfbRef = useRef(null);
  const [status, setStatus] = useState('Bağlanıyor...');
  const [connected, setConnected] = useState(false);
  const [guacamoleUrl, setGuacamoleUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldOpenNewTab, setShouldOpenNewTab] = useState(false);

  useEffect(() => {
    const fetchGuacamoleConnection = async () => {
      try {
        setStatus('Guacamole bağlantısı oluşturuluyor...');
        const response = await axios.get(`${API_URL}/guacamole/connection/${token}`);
        
        if (response.data.success) {
          const url = response.data.iframeUrl || response.data.url;
          logger.log('Guacamole connection URL received:', url);
          logger.log('Connection ID:', response.data.connectionId);
          logger.log('Full response:', response.data);
          
          // URL'yi kontrol et
          if (!url) {
            logger.error('No URL received from backend');
            setStatus('❌ Backend URL döndürmedi');
            setConnected(false);
            return;
          }
          
          setGuacamoleUrl(url);
          setConnected(true);
          setStatus('Bağlantı başarılı - Yükleniyor...');
        } else {
          // Fallback URL varsa göster
          if (response.data.fallbackUrl) {
            setStatus('Guacamole API hatası. Manuel bağlantı için: ' + response.data.fallbackUrl);
            setGuacamoleUrl(response.data.fallbackUrl);
            setConnected(true);
          } else {
            setStatus('Bağlantı oluşturulamadı: ' + (response.data.message || 'Bilinmeyen hata'));
          }
        }
      } catch (error) {
        logger.error('Guacamole connection error:', error);
        logger.error('Error response:', error.response?.data);
        logger.error('Error status:', error.response?.status);
        
        let errorMessage = 'Guacamole bağlantısı kurulamadı.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          errorMessage = 'Guacamole sunucusuna bağlanılamıyor. Guacamole deploy edilmiş mi kontrol edin.';
        }
        
        // Eğer response'da fallback URL varsa, onu kullan
        if (error.response?.data?.fallbackUrl) {
          setGuacamoleUrl(error.response.data.fallbackUrl);
          setConnected(true);
          setStatus('Guacamole API hatası. Manuel bağlantı sayfasına yönlendiriliyor...');
        } else {
          setStatus('❌ ' + errorMessage);
          setConnected(false);
        }
      } finally {
        setLoading(false);
      }
    };

    if (server.type === 'VDS') {
      fetchGuacamoleConnection();
    }

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
      }
    };
  }, [server, token]);

  // Yeni sekmede Guacamole'i aç
  useEffect(() => {
    if (connected && guacamoleUrl && !shouldOpenNewTab) {
      logger.log('Opening Guacamole in new tab:', guacamoleUrl);
      const newWindow = window.open(guacamoleUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        setStatus('⚠️ Popup engelleyici aktif! Lütfen popup\'lara izin verin.');
      }
      setShouldOpenNewTab(true);
    }
  }, [connected, guacamoleUrl, shouldOpenNewTab]);

  if (loading) {
    return (
      <div className="vds-desktop-container">
        <div className="desktop-status">
          <p>{status}</p>
        </div>
      </div>
    );
  }

  if (connected && guacamoleUrl) {
    return (
      <div className="vds-desktop-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        color: '#00ff41',
        fontFamily: 'JetBrains Mono, monospace',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
      }}>
        <div className="desktop-status" style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ff41',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
        }}>
          <h2 style={{ color: '#00ff41', marginBottom: '20px', fontSize: '24px' }}>
            ✅ Bağlantı Başarılı!
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '20px', lineHeight: '1.6' }}>
            <strong>{server.name}</strong> sunucusuna bağlantı kuruldu.
            <br />
            RDP masaüstü yeni sekmede açıldı.
          </p>
          
          <div style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00ff41',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>💡 İpucu:</strong>
            </p>
            <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
              Eğer yeni sekme açılmadıysa, tarayıcınızın adres çubuğundaki 
              popup engelleyici ikonuna tıklayın ve izin verin.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '12px 24px',
                background: '#00ff41',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#00dd35'}
              onMouseOut={(e) => e.target.style.background = '#00ff41'}
            >
              ← Dashboard
            </button>
            
            <button 
              onClick={() => window.open(guacamoleUrl, '_blank')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#00ff41',
                border: '2px solid #00ff41',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#00ff41';
                e.target.style.color = '#000';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#00ff41';
              }}
            >
              🔄 Tekrar Aç
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vds-desktop-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      color: '#00ff41',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <div className="desktop-status" style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #00ff41',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>⚠️ Guacamole Bağlantı Hatası</h2>
        <p style={{ color: '#ff6b6b', fontSize: '18px', marginBottom: '20px' }}>{status}</p>
        
        <div className="desktop-info" style={{ 
          textAlign: 'left', 
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0, 255, 65, 0.1)',
          borderRadius: '4px'
        }}>
          <p><strong>Sunucu:</strong> {server.name}</p>
          <p><strong>IP:</strong> {server.ipAddress}</p>
          <p><strong>Tip:</strong> {server.desktopType}</p>
          {server.desktopType === 'RDP' && (
            <>
              <p><strong>Port:</strong> {server.rdpPort}</p>
              <p><strong>Kullanıcı:</strong> {server.rdpUsername}</p>
            </>
          )}
          {server.desktopType === 'VNC' && (
            <>
              <p><strong>Port:</strong> {server.vncPort}</p>
            </>
          )}
        </div>
        
        <div className="desktop-note" style={{ 
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px',
          border: '1px solid #ff6b6b'
        }}>
          <h3 style={{ color: '#ff6b6b' }}>🔧 Guacamole Kurulumu Gerekli</h3>
          <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
            RDP/VNC bağlantıları için Apache Guacamole kurulmalıdır.
            Guacamole şu anda Render'da deploy edilmemiş.
          </p>
          <p style={{ marginTop: '15px' }}>
            <strong>Seçenekler:</strong>
          </p>
          <ul style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
            <li>Guacamole'i ayrı bir VPS'te deploy edin</li>
            <li>Veya local'de Docker ile çalıştırın (sadece test için)</li>
            <li>VPS (SSH) bağlantıları Guacamole olmadan çalışır</li>
          </ul>
          <p style={{ marginTop: '15px', color: '#00ff41' }}>
            <strong>Not:</strong> VPS (SSH) bağlantıları için Guacamole gerekmez, terminal bağlantısı çalışır.
          </p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#00ff41',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          Dashboard'a Dön
        </button>
      </div>
      <div ref={screenRef} className="desktop-screen"></div>
    </div>
  );
};

export default VDSDesktop;

