import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getProfile } from '../api/datasets';
import './LoginForm.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = await login(formData.username, formData.password);
      const profile = await getProfile();
      localStorage.setItem('user', JSON.stringify(profile.user));
      alert('Connexion réussie !');
      navigate('/catalogue');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Se connecter à Geonia Hub</h2>
        <p>Accédez à votre compte contributeur</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {errors.detail && <div className="error general">{errors.detail}</div>}
          {errors.general && <div className="error general">{errors.general}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="register-link">
          Pas encore de compte ? <a href="/register">S'inscrire</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;