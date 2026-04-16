import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_GREEN = '#0F6E56';

export default function Navbar() {
  const { pathname } = useLocation();

  const linkStyle = (path) => ({
    color: pathname === path ? '#fff' : '#D4E8E0',
    background: pathname === path ? '#00A876' : 'transparent',
    padding: '8px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    borderBottom: pathname === path ? '2px solid #EF9F27' : 'none',
  });

  return (
    <nav style={{
      background: `linear-gradient(90deg, ${NAV_GREEN} 0%, #0C447C 100%)`,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <Link to="/" style={{ 
        color: '#fff', 
        fontSize: '22px',
        fontWeight: '700', 
        textDecoration: 'none',
        letterSpacing: '0.5px',
      }}>
        🌍 Geo<span style={{ color: '#EF9F27' }}>Nia</span>
        <span style={{ fontSize: '11px', fontWeight: '400',
          color: '#D4E8E0', marginLeft: '8px' }}>DATA HUB</span>
      </Link>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Link to="/"           style={linkStyle('/')}>🏠 Accueil</Link>
        <Link to="/catalogue"  style={linkStyle('/catalogue')}>📚 Catalogue</Link>
        <Link to="/contribuer" style={linkStyle('/contribuer')}>➕ Contribuer</Link>
      </div>
    </nav>
  );
}