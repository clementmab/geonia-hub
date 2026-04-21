import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../images/GeoNiaa.jpg';

const NAV_GREEN = '#0F6E56';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Vérifier l'utilisateur au chargement
    loadUser();

    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      loadUser();
    };

    // Écouter les événements personnalisés de connexion/déconnexion
    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const loadUser = () => {
    const token = localStorage.getItem('access_token');
    let userData = localStorage.getItem('user');

    if (token && userData && userData !== 'undefined') {
      try {
        setUser(JSON.parse(userData));
        return;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Nettoyer les données invalides si nécessaire
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    // Notifier les autres composants du changement d'authentification
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const linkStyle = (path) => ({
    color: pathname === path ? '#fff' : '#9FE1CB',
    background: pathname === path ? 'rgba(255,255,255,0.15)' : 'transparent',
    padding: '6px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent'
  });

  return (
    <nav style={{
      background: NAV_GREEN,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '52px',
      position: 'relative',
      zIndex: 1000,
    }}>
      <button 
        onClick={() => handleNavigation('/')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <img 
          src={logoImage} 
          alt="GéoNia Data Hub" 
          style={{ 
            height: '40px', 
            marginRight: '8px' 
          }} 
        />
        <span style={{ 
          color: '#fff', 
          fontSize: '16px', 
          fontWeight: '500' 
        }}>
          Data Hub
        </span>
      </button>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button onClick={() => handleNavigation('/')} style={linkStyle('/')}>Accueil</button>
        <button onClick={() => handleNavigation('/catalogue')} style={linkStyle('/catalogue')}>Catalogue</button>
        <button onClick={() => handleNavigation('/map')} style={linkStyle('/map')}>Carte</button>
        {user ? (
          <>
            <button onClick={() => handleNavigation('/contribuer')} style={linkStyle('/contribuer')}>Contribuer</button>
            <span style={{ color: '#9FE1CB', fontSize: '14px', margin: '0 10px' }}>
              Bienvenue, {user.first_name || user.username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                color: '#9FE1CB',
                background: 'transparent',
                border: '1px solid #9FE1CB',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleNavigation('/register')} style={linkStyle('/register')}>S'inscrire</button>
            <button onClick={() => handleNavigation('/login')} style={linkStyle('/login')}>Se connecter</button>
          </>
        )}
      </div>
    </nav>
  );
}