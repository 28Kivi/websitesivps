import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AddServer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EditServer = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    type: 'VPS',
    ipAddress: '',
    sshPort: 22,
    sshUsername: 'root',
    sshPassword: '',
    sshKey: '',
    rdpPort: 3389,
    rdpUsername: '',
    rdpPassword: '',
    vncPort: 5900,
    vncPassword: '',
    desktopType: 'RDP',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServer();
  }, [id]);

  const fetchServer = async () => {
    try {
      const response = await axios.get(`${API_URL}/servers/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data.success) {
        const server = response.data.server;
        setFormData({
          name: server.name || '',
          type: server.type || 'VPS',
          ipAddress: server.ipAddress || '',
          sshPort: server.sshPort || 22,
          sshUsername: server.sshUsername || 'root',
          sshPassword: server.sshPassword || '',
          sshKey: server.sshKey || '',
          rdpPort: server.rdpPort || 3389,
          rdpUsername: server.rdpUsername || '',
          rdpPassword: server.rdpPassword || '',
          vncPort: server.vncPort || 5900,
          vncPassword: server.vncPassword || '',
          desktopType: server.desktopType || 'RDP',
        });
      }
    } catch (error) {
      toast.error('Sunucu bilgileri yüklenemedi');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    // Validasyon
    if (!formData.name) {
      setErrors({ name: 'Sunucu adı gereklidir' });
      setSaving(false);
      return;
    }

    if (!formData.ipAddress) {
      setErrors({ ipAddress: 'IP adresi gereklidir' });
      setSaving(false);
      return;
    }

    if (formData.type === 'VPS') {
      if (!formData.sshPassword && !formData.sshKey) {
        setErrors({ sshPassword: 'SSH şifresi veya SSH key gereklidir' });
        setSaving(false);
        return;
      }
    }

    if (formData.type === 'VDS') {
      if (!formData.rdpUsername || !formData.rdpPassword) {
        if (formData.desktopType === 'RDP') {
          setErrors({ rdpUsername: 'RDP kullanıcı adı ve şifre gereklidir' });
          setSaving(false);
          return;
        }
      }
      if (!formData.vncPassword && formData.desktopType === 'VNC') {
        setErrors({ vncPassword: 'VNC şifresi gereklidir' });
        setSaving(false);
        return;
      }
    }

    try {
      const response = await axios.put(`${API_URL}/servers/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data.success) {
        toast.success('Sunucu başarıyla güncellendi!');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Sunucu güncellenemedi';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="add-server-container">
        <div style={{ textAlign: 'center', color: 'white', fontSize: '20px' }}>
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="add-server-container">
      <div className="add-server-card">
        <div className="add-server-header">
          <h1>✏️ Sunucu Düzenle</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Geri Dön
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sunucu Adı *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Örn: Production Server"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label>Sunucu Tipi *</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="VPS">VPS (SSH Terminal)</option>
              <option value="VDS">VDS (Uzak Masaüstü)</option>
            </select>
          </div>

          <div className="form-group">
            <label>IP Adresi *</label>
            <input
              type="text"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              placeholder="192.168.1.1"
            />
            {errors.ipAddress && <div className="error-message">{errors.ipAddress}</div>}
          </div>

          {formData.type === 'VPS' && (
            <>
              <h3 className="section-title">SSH Bağlantı Bilgileri</h3>
              <div className="form-group">
                <label>SSH Port</label>
                <input
                  type="number"
                  name="sshPort"
                  value={formData.sshPort}
                  onChange={handleChange}
                  placeholder="22"
                />
              </div>

              <div className="form-group">
                <label>SSH Kullanıcı Adı</label>
                <input
                  type="text"
                  name="sshUsername"
                  value={formData.sshUsername}
                  onChange={handleChange}
                  placeholder="root"
                />
              </div>

              <div className="form-group">
                <label>SSH Şifre</label>
                <input
                  type="password"
                  name="sshPassword"
                  value={formData.sshPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>veya SSH Private Key</label>
                <textarea
                  name="sshKey"
                  value={formData.sshKey}
                  onChange={handleChange}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..."
                  rows="6"
                />
                <small>SSH şifresi veya SSH key'den birini giriniz</small>
              </div>
            </>
          )}

          {formData.type === 'VDS' && (
            <>
              <h3 className="section-title">Uzak Masaüstü Bağlantı Bilgileri</h3>
              <div className="form-group">
                <label>Masaüstü Tipi</label>
                <select
                  name="desktopType"
                  value={formData.desktopType}
                  onChange={handleChange}
                >
                  <option value="RDP">RDP (Remote Desktop Protocol)</option>
                  <option value="VNC">VNC (Virtual Network Computing)</option>
                </select>
              </div>

              {formData.desktopType === 'RDP' && (
                <>
                  <div className="form-group">
                    <label>RDP Port</label>
                    <input
                      type="number"
                      name="rdpPort"
                      value={formData.rdpPort}
                      onChange={handleChange}
                      placeholder="3389"
                    />
                  </div>

                  <div className="form-group">
                    <label>RDP Kullanıcı Adı *</label>
                    <input
                      type="text"
                      name="rdpUsername"
                      value={formData.rdpUsername}
                      onChange={handleChange}
                      placeholder="administrator"
                    />
                    {errors.rdpUsername && (
                      <div className="error-message">{errors.rdpUsername}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>RDP Şifre *</label>
                    <input
                      type="password"
                      name="rdpPassword"
                      value={formData.rdpPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {formData.desktopType === 'VNC' && (
                <>
                  <div className="form-group">
                    <label>VNC Port</label>
                    <input
                      type="number"
                      name="vncPort"
                      value={formData.vncPort}
                      onChange={handleChange}
                      placeholder="5900"
                    />
                  </div>

                  <div className="form-group">
                    <label>VNC Şifre *</label>
                    <input
                      type="password"
                      name="vncPassword"
                      value={formData.vncPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    {errors.vncPassword && (
                      <div className="error-message">{errors.vncPassword}</div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              İptal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServer;

