import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getProfile } from '../api/datasets';

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

    // Vérifier périodiquement l'état d'authentification (fallback)
    const checkAuthInterval = setInterval(() => {
      const currentToken = localStorage.getItem('access_token');
      const currentUserData = localStorage.getItem('user');

      // Si on a un token mais pas d'utilisateur, essayer de récupérer le profil
      if (currentToken && !currentUserData) {
        fetchUserProfile();
      } else if (currentToken && currentUserData) {
        // Vérifier si l'utilisateur a changé
        try {
          const parsedUser = JSON.parse(currentUserData);
          if (!user || user.id !== parsedUser.id) {
            setUser(parsedUser);
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      } else if (!currentToken && user) {
        // Utilisateur déconnecté
        setUser(null);
      }
    }, 1000); // Vérifier chaque seconde

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      clearInterval(checkAuthInterval);
    };
  }, [user]);

  const loadUser = () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile && profile.user) {
        localStorage.setItem('user', JSON.stringify(profile.user));
        setUser(profile.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
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
  });

  return (
    <nav style={{
      background: NAV_GREEN,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '52px',
    }}>
      <Link to="/" style={{ color: '#fff', fontSize: '18px',
        fontWeight: '500', textDecoration: 'none' }}>
        Geo<span style={{ color: '#9FE1CB', fontWeight: '400' }}>Nia</span>
        {' '}
        <span style={{ fontSize: '13px', fontWeight: '400',
          color: '#9FE1CB' }}>Data Hub</span>
      </Link>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <Link to="/"           style={linkStyle('/')}>Accueil</Link>
        <Link to="/catalogue"  style={linkStyle('/catalogue')}>Catalogue</Link>
        {user ? (
          <>
            <Link to="/contribuer" style={linkStyle('/contribuer')}>Contribuer</Link>
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
            <Link to="/register" style={linkStyle('/register')}>S'inscrire</Link>
            <Link to="/login" style={linkStyle('/login')}>Se connecter</Link>
          </>
        )}
      </div>
    </nav>
  );
}