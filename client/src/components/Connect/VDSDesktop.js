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

  useEffect(() => {
    const fetchGuacamoleConnection = async () => {
      try {
        setStatus('Guacamole bağlantısı oluşturuluyor...');
        const response = await axios.get(`${API_URL}/guacamole/connection/${token}`);
        
        if (response.data.success) {
          const url = response.data.iframeUrl || response.data.url;
          logger.log('Guacamole connection URL received:', url);
          logger.log('Connection ID:', response.data.connectionId);
          setGuacamoleUrl(url);
          setConnected(true);
          setStatus('Bağlantı başarılı');
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
        
        let errorMessage = 'Bilinmeyen hata';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.';
        }
        
        // Eğer response'da fallback URL varsa, onu kullan
        if (error.response?.data?.fallbackUrl) {
          setGuacamoleUrl(error.response.data.fallbackUrl);
          setConnected(true);
          setStatus('Guacamole API hatası. Manuel bağlantı sayfasına yönlendiriliyor...');
        } else {
          setStatus('Bağlantı hatası: ' + errorMessage);
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
    logger.log('Rendering Guacamole iframe with URL:', guacamoleUrl);
    return (
      <div className="vds-desktop-container">
        <iframe
          src={guacamoleUrl}
          className="vds-desktop-iframe"
          title={`${server.name} - ${server.desktopType} Desktop`}
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          onError={(e) => {
            logger.error('Iframe error:', e);
            setStatus('Iframe yüklenirken hata oluştu');
            setConnected(false);
          }}
          onLoad={() => {
            logger.log('Iframe loaded successfully');
          }}
        />
      </div>
    );
  }

  return (
    <div className="vds-desktop-container">
      <div className="desktop-status">
        <p style={{ color: 'red' }}>{status}</p>
        <div className="desktop-info">
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
        <div className="desktop-note">
          <h3>Guacamole Kurulumu Gerekli</h3>
          <p>
            RDP/VNC bağlantıları için Apache Guacamole kurulmalıdır.
            Detaylı kurulum için <code>GUACAMOLE_SETUP.md</code> dosyasına bakın.
          </p>
          <p>
            <strong>Hızlı Kurulum:</strong><br/>
            <code>docker-compose -f docker-compose.guacamole.yml up -d</code>
          </p>
          <p style={{ color: '#ff6b6b', marginTop: '10px' }}>
            <strong>⚠ ÖNEMLİ:</strong> Docker Desktop'ın çalıştığından emin olun!
          </p>
        </div>
      </div>
      <div ref={screenRef} className="desktop-screen"></div>
    </div>
  );
};

export default VDSDesktop;

