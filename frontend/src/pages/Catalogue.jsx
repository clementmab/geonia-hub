import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDatasets, getCategories, getDepartments, downloadDataset } from '../api/datasets';
import { toDirectDownloadUrl } from '../api/datasets';

const FORMAT_COLORS = {
  shp:     { bg: '#E1F5EE', text: '#085041' },
  geojson: { bg: '#E6F1FB', text: '#0C447C' },
  tif:     { bg: '#FAEEDA', text: '#633806' },
  pdf:     { bg: '#FCEBEB', text: '#791F1F' },
  gpkg:    { bg: '#EEEDFE', text: '#3C3489' },
  zip:     { bg: '#F1EFE8', text: '#444441' },
};

function Badge({ format }) {
  const c = FORMAT_COLORS[format] || FORMAT_COLORS.zip;
  return (
    <span style={{
      fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
      background: c.bg, color: c.text, fontWeight: '500',
      whiteSpace: 'nowrap',
    }}>
      {format?.toUpperCase()}
    </span>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '11px', fontWeight: '500', color: '#888',
        textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function CheckItem({ label, value, checked, onChange, count }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '13px', cursor: 'pointer', marginBottom: '6px',
      color: '#263238',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(value)}
        style={{ accentColor: '#0F6E56' }}
      />
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: '11px', color: '#aaa' }}>{count}</span>
      )}
    </label>
  );
}

function DatasetCard({ ds, onDownload }) {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: '#fff',
        border: `2px solid ${hovering ? '#0F6E56' : '#e0e0e0'}`,
        borderLeft: `5px solid #0F6E56`,
        borderRadius: '12px',
        padding: '18px',
        marginBottom: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
        transition: 'all 0.3s ease',
        boxShadow: hovering ? '0 8px 20px rgba(15, 110, 86, 0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
        cursor: 'pointer',
      }}>
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/dataset/${ds.id}`)}>
        <div style={{ display: 'flex', alignItems: 'center',
          gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <Badge format={ds.format} />
          <span style={{ fontSize: '12px', color: '#0F6E56', fontWeight: '500' }}>
            📍 {ds.department_name}
          </span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            {new Date(ds.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div style={{ fontWeight: '600', fontSize: '15px',
          color: '#263238', marginBottom: '6px' }}>
          {ds.title}
        </div>
        <div style={{ fontSize: '13px', color: '#555',
          lineHeight: '1.5', marginBottom: '10px' }}>
          {ds.description?.slice(0, 120)}
          {ds.description?.length > 120 ? '...' : ''}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[ds.category_name, ds.projection,
            ds.file_size_mb ? `💾 ${ds.file_size_mb} MB` : null,
            `⬇️ ${ds.downloads}`,
          ].filter(Boolean).map((tag) => (
            <span key={tag} style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#f0f9f8',
              color: '#0F6E56',
              fontWeight: '500',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', flexDirection: 'column',
        gap: '8px', minWidth: '130px' }}>
        <button
          style={{
            background: 'transparent',
            color: '#0F6E56',
            border: '1.5px solid #0F6E56',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: '500',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#E1F5EE';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
          onClick={() => navigate(`/dataset/${ds.id}`)}>
          📖 Détails
        </button>
        <button
          style={{
            background: '#0F6E56',
            color: '#E1F5EE',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#00A876';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#0F6E56';
            e.target.style.transform = 'translateY(0)';
          }}
          onClick={() => onDownload(ds.id, ds.file_url)}>
          ⬇️ Télécharger
        </button>
      </div>
    </div>
  );
}

export default function Catalogue() {
  const [searchParams] = useSearchParams();

  const [search,   setSearch]   = useState(searchParams.get('search') || '');
  const [formats,  setFormats]  = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [cats,     setCats]     = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  );
  const [ordering, setOrdering] = useState('-created_at');
  const [page,     setPage]     = useState(1);

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const { data: departmentsData = [] } = useQuery({
    queryKey: ['departments'],
    queryFn:  getDepartments,
  });

  // ✅ Construit les params proprement — pas de valeurs vides
  const params = {
    ...(search   && { search }),
    ...(formats.length  && { format:     formats.join(',') }),
    ...(depts.length    && { department: depts.join(',') }),
    ...(cats.length     && { category:   cats.join(',') }),
    ordering,
    page,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['datasets', params],
    queryFn:  () => getDatasets(params),
    keepPreviousData: true,
  });

  // ✅ data = { count, results, next, previous }
  const results = data?.results ?? [];
  const count   = data?.count   ?? 0;

  const toggle = (setter, val) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

const handleDownload = async (id, fileUrl) => {
  const data = await downloadDataset(id);
  const url = toDirectDownloadUrl(data?.file_url || fileUrl);
  window.open(url, '_blank');
};
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearch(e.target.value);
    }
  };

  return (
    <div style={{ display: 'grid',
      gridTemplateColumns: '220px 1fr', gap: '24px' }}>

      {/* ── Filtres ── */}
      <aside style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '20px',
        alignSelf: 'start',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: '80px',
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#0F6E56', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🔍 Filtres
        </h3>
        <input
          placeholder="🔎 Rechercher..."
          defaultValue={search}
          onKeyDown={handleSearch}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '13px',
            marginBottom: '16px',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = '#0F6E56'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />

        <FilterBlock title="Format">
          {['shp', 'geojson', 'tif', 'pdf', 'gpkg', 'zip'].map((f) => (
            <CheckItem
              key={f} label={f.toUpperCase()} value={f}
              checked={formats.includes(f)}
              onChange={(v) => { toggle(setFormats, v); setPage(1); }}
            />
          ))}
        </FilterBlock>

        <FilterBlock title="Département">
          {departmentsData.map((d) => (
            <CheckItem
              key={d.id} label={d.name} value={String(d.id)}
              checked={depts.includes(String(d.id))}
              onChange={(v) => { toggle(setDepts, v); setPage(1); }}
            />
          ))}
        </FilterBlock>

        <FilterBlock title="Catégorie">
          {categoriesData.map((c) => (
            <CheckItem
              key={c.id} label={c.name} value={String(c.id)}
              checked={cats.includes(String(c.id))}
              onChange={(v) => { toggle(setCats, v); setPage(1); }}
              count={c.dataset_count}
            />
          ))}
        </FilterBlock>

        <button
          onClick={() => {
            setFormats([]); setDepts([]); setCats([]);
            setSearch(''); setPage(1);
          }}
          style={{
            width: '100%', background: 'transparent',
            border: '0.5px solid #ccc', borderRadius: '8px',
            padding: '8px', fontSize: '12px', cursor: 'pointer',
            color: '#555', marginTop: '4px',
          }}>
          Réinitialiser les filtres
        </button>
      </aside>

      {/* ── Résultats ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>
            {isLoading
              ? 'Chargement...'
              : `${count} dataset${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
            }
          </span>
          <select
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
            style={{
              padding: '6px 10px', borderRadius: '6px',
              border: '0.5px solid #ccc', fontSize: '12px',
              background: '#fff', color: '#263238',
            }}>
            <option value="-created_at">Plus récent</option>
            <option value="-downloads">Plus téléchargé</option>
            <option value="file_size_mb">Taille croissante</option>
            <option value="-file_size_mb">Taille décroissante</option>
          </select>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px',
            color: '#888', fontSize: '14px' }}>
            Chargement des données...
          </div>
        )}

        {isError && (
          <div style={{
            background: '#FCEBEB', border: '0.5px solid #F09595',
            borderRadius: '8px', padding: '14px',
            color: '#791F1F', fontSize: '13px',
          }}>
            Impossible de charger les données. Vérifiez que le serveur
            Django est démarré sur le port 8000.
          </div>
        )}

        {!isLoading && !isError && results.length === 0 && (
          <div style={{
            background: '#F5F5F5', borderRadius: '10px',
            padding: '40px', textAlign: 'center',
            color: '#888', fontSize: '14px',
          }}>
            Aucun dataset ne correspond à vos filtres.
            {count === 0 && ' Pensez à approuver vos datasets dans l\'admin Django.'}
          </div>
        )}

        {results.map((ds) => (
          <DatasetCard
            key={ds.id}
            ds={ds}
            onDownload={handleDownload}
          />
        ))}

        {/* Pagination */}
        {(data?.previous || data?.next) && (
          <div style={{ display: 'flex', justifyContent: 'center',
            gap: '8px', marginTop: '20px' }}>
            <button
              disabled={!data.previous}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                border: '0.5px solid #ccc', background: '#fff',
                cursor: data.previous ? 'pointer' : 'not-allowed',
                color: data.previous ? '#263238' : '#aaa', fontSize: '13px',
              }}>
              ← Précédent
            </button>
            <span style={{ padding: '8px 16px',
              fontSize: '13px', color: '#888' }}>
              Page {page}
            </span>
            <button
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                border: '0.5px solid #ccc', background: '#fff',
                cursor: data.next ? 'pointer' : 'not-allowed',
                color: data.next ? '#263238' : '#aaa', fontSize: '13px',
              }}>
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}