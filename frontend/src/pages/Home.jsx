import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDatasets, getCategories } from '../api/datasets';

export default function Home() {
  const navigate = useNavigate();

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets', { ordering: '-downloads' }],
    queryFn:  () => getDatasets({ ordering: '-downloads', page_size: 4 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const datasets    = datasetsData?.results ?? [];
  const categories  = categoriesData ?? [];

  return (
    <div>
      {/* === HERO SECTION === */}
      <div style={{
        background: `linear-gradient(135deg, #0F6E56 0%, #0C447C 50%, #1a3a52 100%)`,
        borderRadius: '16px',
        padding: '60px 48px',
        marginBottom: '48px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15, 110, 86, 0.2)',
      }}>
        {/* Décoration background */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(239, 159, 39, 0.1) 0%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>🌍</span>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, letterSpacing: '1px' }}>
              Données Géospatiales du Congo
            </h1>
          </div>
          <p style={{ color: '#D4E8E0', marginBottom: '28px', lineHeight: '1.8', fontSize: '16px', maxWidth: '600px' }}>
            Plateforme collaborative de partage de données cartographiques, satellitaires et spatiales. 
            Accès libre, qualité garantie, communauté active.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              placeholder="🔍 Rechercher un dataset..."
              onKeyDown={(e) => e.key === 'Enter' &&
                navigate(`/catalogue?search=${e.target.value}`)}
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '12px 18px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <button
              onClick={() => navigate('/catalogue')}
              style={{
                background: '#EF9F27',
                color: '#412402',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(239, 159, 39, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#E88A1F';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(239, 159, 39, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#EF9F27';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 159, 39, 0.3)';
              }}>
              Explorer →
            </button>
          </div>
        </div>
      </div>

      {/* === STATISTIQUES === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '48px',
      }}>
        {[
          { icon: '📊', label: 'Datasets', value: datasetsData?.count || 0 },
          { icon: '🏷️', label: 'Catégories', value: categories.length },
          { icon: '⬇️', label: 'Téléchargements', value: datasets.reduce((sum, d) => sum + d.downloads, 0) },
          { icon: '🌱', label: 'Format', value: '6+' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 110, 86, 0.1)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0F6E56', marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: '#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* === CATÉGORIES === */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#263238' }}>
        📁 Parcourir par catégorie
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '14px',
        marginBottom: '48px',
      }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/catalogue?category=${cat.id}`)}
            style={{
              background: `linear-gradient(135deg, ${['#E1F5EE', '#E6F1FB', '#FAEEDA', '#FCEBEB', '#EEEDFE', '#F1EFE8'][cat.id % 6]} 0%, rgba(15, 110, 86, 0.05) 100%)`,
              border: '1.5px solid rgba(15, 110, 86, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0F6E56';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 110, 86, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15, 110, 86, 0.2)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#263238', marginBottom: '6px' }}>
              {cat.name}
            </div>
            <div style={{ fontSize: '12px', color: '#0F6E56', fontWeight: '500' }}>
              {cat.dataset_count} dataset{cat.dataset_count !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* === DATASETS LES PLUS TÉLÉCHARGÉS === */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#263238' }}>
        ⭐ Les plus téléchargés
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '18px',
        marginBottom: '20px',
      }}>
        {datasets.length > 0 ? datasets.map((ds) => (
          <div
            key={ds.id}
            onClick={() => navigate(`/dataset/${ds.id}`)}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderLeft: `4px solid #0F6E56`,
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 110, 86, 0.15)';
              e.currentTarget.style.transform = 'translateY(-4px) translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0) translateX(0)';
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#263238', margin: 0, flex: 1 }}>
                {ds.title}
              </h3>
              <span style={{
                fontSize: '10px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#E1F5EE',
                color: '#085041',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                marginLeft: '8px',
              }}>
                {ds.format?.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#0F6E56', marginBottom: '8px', fontWeight: '500' }}>
              📍 {ds.department_name}
            </div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5', marginBottom: '12px' }}>
              {ds.description?.slice(0, 80)}...
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
              <span>💾 {ds.file_size_mb} MB</span>
              <span>⬇️ {ds.downloads}</span>
            </div>
          </div>
        )) : (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: '#aaa',
            fontSize: '14px',
            background: '#f9f9f9',
            borderRadius: '10px',
          }}>
            📭 Aucun dataset approuvé pour l'instant
          </div>
        )}
      </div>

      {/* === CTA CONTRIBUER === */}
      {datasets.length === 0 && (
        <div style={{
          background: `linear-gradient(135deg, #0C447C 0%, #0F6E56 100%)`,
          borderRadius: '14px',
          padding: '36px',
          textAlign: 'center',
          color: '#fff',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            Vous avez des données à partager ? 🚀
          </h3>
          <p style={{ marginBottom: '20px', color: '#D4E8E0' }}>
            Devenez contributeur et enrichissez notre base de données géospatiales
          </p>
          <button
            onClick={() => navigate('/contribuer')}
            style={{
              background: '#EF9F27',
              color: '#412402',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#E88A1F';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#EF9F27';
              e.target.style.transform = 'scale(1)';
            }}>
            Contribuer maintenant →
          </button>
        </div>
      )}

      
    </div>
  );
}