import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataset, downloadDataset, toDirectDownloadUrl } from '../api/datasets';

const GREEN  = '#0F6E56';
const LGREEN = '#E1F5EE';

const FORMAT_COLORS = {
  shp:     { bg: '#E1F5EE', text: '#085041' },
  geojson: { bg: '#E6F1FB', text: '#0C447C' },
  tif:     { bg: '#FAEEDA', text: '#633806' },
  pdf:     { bg: '#FCEBEB', text: '#791F1F' },
  gpkg:    { bg: '#EEEDFE', text: '#3C3489' },
  zip:     { bg: '#F1EFE8', text: '#444441' },
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '0.5px solid #f0f0f0',
      fontSize: '13px',
    }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color: '#263238', fontWeight: '500',
        textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  );
}

export default function DatasetDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const { data: ds, isLoading, isError } = useQuery({
    queryKey: ['dataset', id],
    queryFn:  () => getDataset(id),
  });

  const mutation = useMutation({
    mutationFn: () => downloadDataset(id),
    onSuccess: (data) => {
      // Invalide le cache pour mettre à jour le compteur
      queryClient.invalidateQueries(['dataset', id]);
      queryClient.invalidateQueries(['datasets']);
      // Ouvre le lien de téléchargement converti
      const url = toDirectDownloadUrl(data.file_url || ds?.file_url);
      window.open(url, '_blank');
    },
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '80px',
      color: '#888', fontSize: '14px' }}>
      Chargement du dataset...
    </div>
  );

  if (isError || !ds) return (
    <div style={{
      background: '#FCEBEB', border: '0.5px solid #F09595',
      borderRadius: '8px', padding: '20px', color: '#791F1F',
      fontSize: '13px', maxWidth: '600px', margin: '40px auto',
    }}>
      Dataset introuvable. Il a peut-être été supprimé ou n'est pas encore approuvé.
      <br />
      <button
        onClick={() => navigate('/catalogue')}
        style={{ marginTop: '12px', background: 'transparent',
          border: '0.5px solid #C62828', borderRadius: '6px',
          padding: '6px 14px', cursor: 'pointer',
          color: '#C62828', fontSize: '12px' }}>
        Retour au catalogue
      </button>
    </div>
  );

  const c = FORMAT_COLORS[ds.format] || FORMAT_COLORS.zip;
  const directUrl = toDirectDownloadUrl(ds.file_url);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          border: 'none',
          color: GREEN,
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '20px',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '500',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'translateX(-4px)'}
        onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
      >
        ← Retour
      </button>

      <div style={{ display: 'grid',
        gridTemplateColumns: '1fr 320px', gap: '24px' }}>

        {/* ── Colonne gauche ── */}
        <div>

          {/* En-tête */}
          <div style={{
            background: `linear-gradient(135deg, ${LGREEN} 0%, #E6F1FB 100%)`,
            border: `2px solid ${GREEN}`,
            borderRadius: '14px',
            padding: '28px',
            marginBottom: '20px',
            borderLeft: `6px solid ${GREEN}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center',
              gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: c.bg,
                color: c.text,
                fontWeight: '600',
              }}>
                {ds.format?.toUpperCase()}
              </span>
              {ds.department?.name && (
                <span style={{ fontSize: '13px', color: GREEN, fontWeight: '600' }}>
                  📍 {ds.department.name}
                </span>
              )}
              <span style={{ fontSize: '12px', color: '#888',
                marginLeft: 'auto' }}>
                📅 {new Date(ds.created_at)
                  .toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '700',
              color: '#263238', margin: '0 0 12px', lineHeight: '1.3' }}>
              {ds.title}
            </h1>

            <p style={{ fontSize: '14px', color: '#555',
              lineHeight: '1.7', margin: 0 }}>
              {ds.description}
            </p>
          </div>

          {/* Informations techniques */}
          <div style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700',
              color: '#263238', marginBottom: '16px' }}>
              📊 Informations techniques
            </h2>

            <InfoRow label="Format"        value={ds.format?.toUpperCase()} />
            <InfoRow label="Projection"    value={ds.projection} />
            <InfoRow label="Taille"
              value={ds.file_size_mb ? `${ds.file_size_mb} MB` : null} />
            <InfoRow label="Catégorie"     value={ds.category?.name} />
            <InfoRow label="Département"   value={ds.department?.name} />
            <InfoRow label="Licence"       value={ds.licence} />
            <InfoRow label="Contributeur"  value={ds.contributor_name} />
            <InfoRow label="Téléchargements"
              value={`${ds.downloads} téléchargement${ds.downloads > 1 ? 's' : ''}`} />
            <InfoRow label="Dernière mise à jour"
              value={new Date(ds.updated_at).toLocaleDateString('fr-FR')} />
          </div>

          {/* Aperçu carte */}
          <div style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700',
              color: '#263238', marginBottom: '16px' }}>
              🗺️ Zone couverte
            </h2>
            {/* Carte OpenStreetMap centrée sur le Congo */}
            <div style={{ borderRadius: '12px', overflow: 'hidden',
              border: '1px solid #e0e0e0', marginBottom: '12px' }}>
              <iframe
                title="Aperçu carte"
                width="100%"
                height="340"
                style={{ border: 'none', display: 'block' }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=11.0%2C-5.5%2C18.7%2C3.7&layer=mapnik`}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#888',
              marginTop: '0', marginBottom: 0 }}>
              📌 Carte de référence — Congo-Brazzaville
            </p>
          </div>
        </div>

        {/* ── Colonne droite : actions ── */}
        <div style={{ alignSelf: 'start', position: 'sticky', top: '90px' }}>

          {/* Carte téléchargement */}
          <div style={{
            background: `linear-gradient(135deg, #0F6E56 0%, #0C447C 100%)`,
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '16px',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(15, 110, 86, 0.2)',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700',
              color: '#fff', marginBottom: '18px' }}>
              ⬇️ Télécharger
            </h2>

            {/* Infos rapides */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px' }}>
                <span style={{ color: '#D4E8E0' }}>Format</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {ds.format?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px' }}>
                <span style={{ color: '#D4E8E0' }}>Taille</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {ds.file_size_mb ? `${ds.file_size_mb} MB` : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#D4E8E0' }}>Licence</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {ds.licence}
                </span>
              </div>
            </div>

            {/* Bouton télécharger */}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              style={{
                width: '100%',
                background: mutation.isPending ? '#999' : '#EF9F27',
                color: '#412402',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: mutation.isPending ? 'wait' : 'pointer',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(239, 159, 39, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!mutation.isPending) {
                  e.target.style.background = '#E88A1F';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!mutation.isPending) {
                  e.target.style.background = '#EF9F27';
                  e.target.style.transform = 'translateY(0)';
                }
              }}>
              {mutation.isPending ? '⏳ Ouverture...' : '📥 Télécharger'}
            </button>

            {/* Lien direct copier */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: '#D4E8E0',
                marginBottom: '6px', fontWeight: '500' }}>
                Lien direct
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '10px',
                color: '#D4E8E0',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                maxHeight: '60px',
                overflowY: 'auto',
                backdropFilter: 'blur(10px)',
              }}>
                {directUrl}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(directUrl)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid #D4E8E0',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#D4E8E0',
                  marginTop: '8px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}>
                📋 Copier le lien
              </button>
            </div>
          </div>

          {/* Carte signalement */}
          <div style={{
            background: '#fff',
            border: '1.5px solid #F09595',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(228, 75, 74, 0.1)',
          }}>
            <div style={{ fontWeight: '700', color: '#C62828',
              marginBottom: '8px' }}>
              ⚠️ Signaler un problème
            </div>
            <p style={{ color: '#666', lineHeight: '1.5',
              marginBottom: '12px', fontSize: '12px' }}>
              Lien cassé, données incorrectes ou suspect ?
            </p>
            <button
              style={{
                width: '100%',
                background: 'transparent',
                border: '1.5px solid #E24B4A',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#C62828',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(228, 75, 74, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}>
              📢 Signaler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}