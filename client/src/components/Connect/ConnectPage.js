import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import VPSTerminal from './VPSTerminal';
import VDSDesktop from './VDSDesktop';
import { logger } from '../../utils/logger';
import './ConnectPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ConnectPage = () => {
  const { token } = useParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  const fetchConnectionData = useCallback(async () => {
    if (!token) {
      setError('Token bulunamadı');
      setLoading(false);
      return;
    }

    try {
      logger.log('Fetching connection data for token:', token);
      
      const response = await axios.get(`${API_URL}/connect/${token}`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });
      
      logger.log('Connection response status:', response.status);
      
      if (response.data && response.data.success) {
        logger.log('Connection successful, server data received');
        setServer(response.data.server);
      } else {
        const errorMsg = response.data?.message || response.data?.error || 'Bağlantı bilgileri alınamadı';
        logger.error('Connection error from response:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      logger.error('Connection fetch error:', error);
      
      let errorMsg = 'Bağlantı hatası. ';
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMsg += 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg += error.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    setMounted(true);
    fetchConnectionData();
  }, [fetchConnectionData]);

  // Component henüz mount olmadıysa basit bir loading göster
  if (!mounted) {
    return (
      <div className="connect-page connect-page-loading">
        <div className="connect-loading-text">Yükleniyor...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="connect-page">
        <div className="connect-loading">
          <div className="connect-loading-spinner"></div>
          <h2>Bağlantı hazırlanıyor...</h2>
          <p>Sunucu bilgileri alınıyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connect-page">
        <div className="connect-error">
          <h2>⚠️ Bağlantı Hatası</h2>
          <p>{error}</p>
          <div className="connect-error-checklist">
            <p className="checklist-title">Kontrol Listesi:</p>
            <ul className="checklist-items">
              <li>Backend sunucusu çalışıyor mu? (Port 5000)</li>
              <li>Docker servisleri çalışıyor mu?</li>
              <li>Token geçerli mi ve süresi dolmamış mı?</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary connect-reload-btn"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!server && !loading && !error) {
    return (
      <div className="connect-page">
        <div className="connect-error">
          <h2>Sunucu bulunamadı</h2>
          <p>Sunucu bilgileri alınamadı. Lütfen tekrar deneyin.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary connect-reload-btn"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  // Server varsa render et
  if (server) {
    try {
      return (
        <div className="connect-page">
          {/* Header sadece VPS için göster, VDS için tam ekran */}
          {server.type === 'VPS' && (
            <div className="connect-header">
              <h2>{server.name}</h2>
              <div className="connect-info">
                <span className="server-type-badge">{server.type}</span>
                <span className="server-ip">{server.ipAddress}</span>
              </div>
            </div>
          )}

          <div className={`connect-content ${server.type === 'VDS' ? 'connect-content-fullscreen' : ''}`}>
            {server.type === 'VPS' ? (
              <VPSTerminal server={server} token={token} />
            ) : (
              <VDSDesktop server={server} token={token} />
            )}
          </div>
        </div>
      );
    } catch (renderError) {
      logger.error('Render error:', renderError);
      return (
        <div className="connect-page">
          <div className="connect-error connect-render-error">
            <h2>Render Hatası</h2>
            <p>{renderError.message}</p>
          </div>
        </div>
      );
    }
  }

  // Fallback - hiçbir durum eşleşmezse
  return (
    <div className="connect-page connect-page-fallback">
      <div>Beklenmeyen durum. Lütfen sayfayı yenileyin.</div>
    </div>
  );
};

export default ConnectPage;

