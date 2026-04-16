import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '80px',
      background: `linear-gradient(135deg, rgba(15, 110, 86, 0.95) 0%, rgba(12, 68, 124, 0.95) 100%), url("/assets/Geonia.jpg")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#fff',
      padding: '60px 32px 40px',
      borderTop: '3px solid #EF9F27',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Contenu principal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
          marginBottom: '40px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          
          {/* À propos */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              À propos de GeoniA
            </h3>
            <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#D4E8E0' }}>
              GeoniA Data Hub est une plateforme collaborative de partage de données 
              géographiques et spatiales du Congo-Brazzaville. Accès libre, donnees 
              de qualité, communauté active.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Navigation
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/" style={{ color: '#D4E8E0', textDecoration: 'none', fontSize: '13px' }}>
                  Accueil
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/catalogue" style={{ color: '#D4E8E0', textDecoration: 'none', fontSize: '13px' }}>
                  Catalogue
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/contribuer" style={{ color: '#D4E8E0', textDecoration: 'none', fontSize: '13px' }}>
                  Contribuer
                </Link>
              </li>
            </ul>
          </div>

          {/* Infos */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Information
            </h3>
            <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#D4E8E0', margin: 0 }}>
              📍 Congo-Brazzaville<br />
              🌍 Données géospatiales<br />
              📊 Libre accès
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#9FE1CB',
        }}>
          © {new Date().getFullYear()} GeoniA Data Hub. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
