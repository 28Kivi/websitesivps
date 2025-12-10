import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Auth.css';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!formData.username || formData.username.length < 3) {
      setErrors({ username: t('usernameMinLength') || 'Kullanıcı adı en az 3 karakter olmalıdır' });
      setLoading(false);
      return;
    }

    if (!formData.email) {
      setErrors({ email: t('emailRequired') || 'E-posta gereklidir' });
      setLoading(false);
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrors({ password: t('passwordMinLength') || 'Şifre en az 6 karakter olmalıdır' });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: t('passwordsNotMatch') || 'Şifreler eşleşmiyor' });
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.username, formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  }, [formData, register, navigate, t]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('register')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('usernamePlaceholder') || 'kullaniciadi'}
            />
            {errors.username && <div className="error-message">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('emailPlaceholder') || 'ornek@email.com'}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label>{t('confirmPassword')}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? t('registering') || 'Kaydediliyor...' : t('register')}
          </button>
        </form>

        <p className="auth-link">
          {t('hasAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

