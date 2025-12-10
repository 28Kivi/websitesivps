import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import LanguageSelector from '../LanguageSelector';
import { logger } from '../../utils/logger';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchServers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/servers/list`);
      if (response.data.success) {
        setServers(response.data.servers);
      }
    } catch (error) {
      logger.error('Error fetching servers:', error);
      toast.error(t('serversLoadFailed') || 'Sunucular yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [API_URL, t]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Memoized filtered servers
  const filteredServers = useMemo(() => {
    let filtered = servers;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(server => server.type === filterType);
    }

    // Search by name or IP
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.ipAddress.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [servers, searchQuery, filterType]);

  const handleConnect = useCallback(async (serverId) => {
    try {
      logger.log('Connecting to server:', serverId);
      const response = await axios.post(`${API_URL}/connect/generate`, {
        serverId,
      });

      logger.log('Connect response:', response.data);

      if (response.data.success) {
        const token = response.data.token;
        window.open(`/connect/${token}`, '_blank');
        toast.success(t('connectionCreated') || 'Bağlantı oluşturuldu');
      }
    } catch (error) {
      logger.error('Connect error:', error);
      const message = error.response?.data?.message || error.message || (t('connectionFailed') || 'Bağlantı oluşturulamadı');
      toast.error(message);
    }
  }, [API_URL, t]);

  const handleDelete = useCallback(async (serverId) => {
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      logger.log('Deleting server:', serverId);
      const response = await axios.delete(`${API_URL}/servers/${serverId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      logger.log('Delete response:', response.data);
      
      if (response.data.success) {
        toast.success(t('serverDeleted'));
        fetchServers();
      } else {
        toast.error(response.data.message || t('serverDeleteFailed'));
      }
    } catch (error) {
      logger.error('Delete error:', error);
      const message = error.response?.data?.message || error.message || (t('serverDeleteFailed') || 'Sunucu silinemedi');
      toast.error(message);
    }
  }, [API_URL, t, fetchServers]);

  const handleEdit = useCallback((serverId) => {
    navigate(`/edit-server/${serverId}`);
  }, [navigate]);

  // Memoized stats calculation
  const stats = useMemo(() => ({
    total: servers.length,
    vps: servers.filter(s => s.type === 'VPS').length,
    vds: servers.filter(s => s.type === 'VDS').length,
  }), [servers]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          color: 'white',
          fontSize: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard')}</h1>
          <p>{t('welcome')}, <strong>{user?.username}</strong></p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <LanguageSelector />
          <button
            className="btn btn-primary"
            onClick={() => navigate('/add-server')}
          >
            + {t('addServer')}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={logout}
          >
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {servers.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{t('totalServers')}</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <h3>{t('vpsServers')}</h3>
            <div className="stat-value">{stats.vps}</div>
          </div>
          <div className="stat-card">
            <h3>{t('vdsServers')}</h3>
            <div className="stat-value">{stats.vds}</div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      {servers.length > 0 && (
        <div className="search-filter-section">
          <input
            type="text"
            className="search-input"
            placeholder={`> ${t('search')}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">{t('all')}</option>
            <option value="VPS">VPS</option>
            <option value="VDS">VDS</option>
          </select>
        </div>
      )}

      <div className="servers-list">
        {filteredServers.length === 0 && !loading && servers.length === 0 ? (
          <div className="empty-state">
            <h2>{t('noServers')}</h2>
            <p>{t('addFirstServerDescription')}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/add-server')}
            >
              {t('addFirstServer')}
            </button>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="empty-state">
            <h2>{t('noResults')}</h2>
            <p>{t('noResultsDescription')}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
            >
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          filteredServers.map((server) => (
            <div key={server.id || server._id} className="server-card">
              <div className="server-info">
                <h3>{server.name}</h3>
                <div className="server-details">
                  <span className={`server-type ${server.type.toLowerCase()}`}>
                    {server.type}
                  </span>
                  <span className="server-ip">{server.ipAddress}</span>
                  <span className="server-date">
                    {new Date(server.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="server-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleConnect(server.id || server._id)}
                  style={{ flex: 1 }}
                >
                  {t('connect')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEdit(server.id || server._id)}
                  style={{ flex: 1 }}
                >
                  {t('editServer')}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(server.id || server._id)}
                  style={{ flex: 1 }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;

