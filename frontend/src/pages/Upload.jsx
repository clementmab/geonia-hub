import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCategories, getDepartments, submitDataset } from '../api/datasets';

const GREEN  = '#0F6E56';
const LGREEN = '#E1F5EE';

function FormGroup({ label, required, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block', fontSize: '12px', color: '#555',
        marginBottom: '6px', fontWeight: '500',
      }}>
        {label} {required && (
          <span style={{ color: '#C62828' }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '0.5px solid #ccc', fontSize: '13px',
  color: '#263238', background: '#fff', boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle };

export default function Upload() {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    department:  '',
    format:      'shp',
    projection:  'EPSG:4326',
    licence:     'open',
    file_url:    '',
    file_size_mb: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors,    setErrors]    = useState({});

  const { data: categories } = useQuery({
    queryKey: ['categories'], queryFn: getCategories,
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'], queryFn: getDepartments,
  });

  const mutation = useMutation({
    mutationFn: submitDataset,
    onSuccess:  () => setSubmitted(true),
    onError:    (err) => {
      if (err.response?.data) setErrors(err.response.data);
    },
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Le titre est obligatoire';
    if (!form.description.trim()) e.description = 'La description est obligatoire';
    if (!form.category)           e.category    = 'Choisissez une catégorie';
    if (!form.department)         e.department  = 'Choisissez un département';
    if (!form.file_url.trim())    e.file_url    = "L'URL du fichier est obligatoire";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate({
      ...form,
      file_size_mb: parseFloat(form.file_size_mb) || 0,
    });
  };

  // ── Page de succès ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: LGREEN, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke={GREEN} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '500',
          color: '#263238', marginBottom: '10px' }}>
          Dataset soumis avec succès !
        </h2>
        <p style={{ color: '#666', fontSize: '14px',
          lineHeight: '1.6', marginBottom: '24px' }}>
          Votre dataset a été reçu et sera examiné par notre équipe
          avant d'être publié dans le catalogue. Merci pour votre
          contribution à la communauté GIS du Congo.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => { setSubmitted(false); setForm({
              title: '', description: '', category: '', department: '',
              format: 'shp', projection: 'EPSG:4326', licence: 'open',
              file_url: '', file_size_mb: '',
            }); }}
            style={{
              background: GREEN, color: LGREEN, border: 'none',
              padding: '10px 20px', borderRadius: '8px',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            }}>
            Soumettre un autre dataset
          </button>
          <a href="/catalogue" style={{
            background: '#fff', color: '#263238',
            border: '0.5px solid #ccc', padding: '10px 20px',
            borderRadius: '8px', fontSize: '13px',
            textDecoration: 'none', display: 'inline-block',
          }}>
            Voir le catalogue
          </a>
        </div>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Bandeau info */}
      <div style={{
        background: LGREEN, borderLeft: `3px solid ${GREEN}`,
        borderRadius: '0', padding: '12px 16px',
        fontSize: '13px', color: '#085041',
        lineHeight: '1.6', marginBottom: '20px',
      }}>
        Vous souhaitez partager une donnée géographique avec la communauté ?
        Remplissez ce formulaire. Chaque soumission est vérifiée par notre
        équipe avant publication dans le catalogue.
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Carte 1 : Informations principales ── */}
        <div style={{
          background: '#fff', border: '0.5px solid #e0e0e0',
          borderRadius: '12px', padding: '24px', marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '500',
            color: '#263238', marginBottom: '18px' }}>
            Informations sur la donnée
          </h3>

          <FormGroup label="Titre du dataset" required>
            <input
              style={{
                ...inputStyle,
                borderColor: errors.title ? '#E24B4A' : '#ccc',
              }}
              placeholder="ex: Limites communales de Pointe-Noire 2024"
              value={form.title}
              onChange={set('title')}
            />
            {errors.title && (
              <span style={{ fontSize: '11px', color: '#C62828' }}>
                {errors.title}
              </span>
            )}
          </FormGroup>

          <FormGroup label="Description" required>
            <textarea
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                borderColor: errors.description ? '#E24B4A' : '#ccc',
              }}
              placeholder="Décrivez la donnée : source, méthode de collecte, date, précision..."
              value={form.description}
              onChange={set('description')}
            />
            {errors.description && (
              <span style={{ fontSize: '11px', color: '#C62828' }}>
                {errors.description}
              </span>
            )}
          </FormGroup>

          {/* Catégorie + Département côte à côte */}
          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormGroup label="Catégorie" required>
              <select
                style={{
                  ...selectStyle,
                  borderColor: errors.category ? '#E24B4A' : '#ccc',
                }}
                value={form.category}
                onChange={set('category')}
              >
                <option value="">-- Choisir --</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && (
                <span style={{ fontSize: '11px', color: '#C62828' }}>
                  {errors.category}
                </span>
              )}
            </FormGroup>

            <FormGroup label="Département" required>
              <select
                style={{
                  ...selectStyle,
                  borderColor: errors.department ? '#E24B4A' : '#ccc',
                }}
                value={form.department}
                onChange={set('department')}
              >
                <option value="">-- Choisir --</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.department && (
                <span style={{ fontSize: '11px', color: '#C62828' }}>
                  {errors.department}
                </span>
              )}
            </FormGroup>
          </div>
        </div>

        {/* ── Carte 2 : Informations techniques ── */}
        <div style={{
          background: '#fff', border: '0.5px solid #e0e0e0',
          borderRadius: '12px', padding: '24px', marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '500',
            color: '#263238', marginBottom: '18px' }}>
            Informations techniques
          </h3>

          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <FormGroup label="Format">
              <select style={selectStyle}
                value={form.format} onChange={set('format')}>
                <option value="shp">Shapefile (.shp)</option>
                <option value="geojson">GeoJSON</option>
                <option value="gpkg">GeoPackage (.gpkg)</option>
                <option value="tif">Raster (.tif)</option>
                <option value="pdf">Carte PDF</option>
                <option value="zip">Archive ZIP</option>
              </select>
            </FormGroup>

            <FormGroup label="Projection">
              <select style={selectStyle}
                value={form.projection} onChange={set('projection')}>
                <option value="EPSG:4326">WGS84 (EPSG:4326)</option>
                <option value="EPSG:32633">UTM Zone 33S</option>
                <option value="EPSG:32634">UTM Zone 34S</option>
                <option value="Autre">Autre</option>
              </select>
            </FormGroup>

            <FormGroup label="Licence">
              <select style={selectStyle}
                value={form.licence} onChange={set('licence')}>
                <option value="open">Open Data</option>
                <option value="cc-by">CC BY 4.0</option>
                <option value="cc-by-sa">CC BY-SA 4.0</option>
                <option value="mit">MIT</option>
              </select>
            </FormGroup>
          </div>

          <FormGroup label="URL du fichier" required>
            <input
              style={{
                ...inputStyle,
                borderColor: errors.file_url ? '#E24B4A' : '#ccc',
              }}
              placeholder="https://exemple.com/mon_fichier.shp"
              value={form.file_url}
              onChange={set('file_url')}
              type="url"
            />
            {errors.file_url && (
              <span style={{ fontSize: '11px', color: '#C62828' }}>
                {errors.file_url}
              </span>
            )}
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
              Hébergez votre fichier sur Google Drive, Dropbox ou un serveur
              et collez le lien de téléchargement direct ici.
            </div>
          </FormGroup>

          <FormGroup label="Taille du fichier (MB)">
            <input
              style={inputStyle}
              placeholder="ex: 12.5"
              value={form.file_size_mb}
              onChange={set('file_size_mb')}
              type="number"
              min="0"
              step="0.1"
            />
          </FormGroup>
        </div>

        {/* ── Formats acceptés ── */}
        <div style={{
          background: '#F9FBE7', border: '0.5px solid #C0DD97',
          borderRadius: '10px', padding: '14px 16px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500',
            color: '#27500A', marginBottom: '8px' }}>
            Formats acceptés
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['.shp + .dbf + .prj', '.geojson', '.gpkg',
              '.tif / .tiff', '.pdf', '.zip'].map((f) => (
              <span key={f} style={{
                fontSize: '11px', padding: '3px 10px',
                borderRadius: '20px', background: LGREEN, color: '#085041',
              }}>
                {f}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#3B6D11', marginTop: '8px' }}>
            Pour un Shapefile, compressez tous les fichiers (.shp, .dbf,
            .shx, .prj) dans un ZIP avant de l'héberger.
          </div>
        </div>

        {/* ── Bouton soumettre ── */}
        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            width: '100%', background: mutation.isPending ? '#aaa' : GREEN,
            color: LGREEN, border: 'none', padding: '14px',
            borderRadius: '8px', fontSize: '15px', fontWeight: '500',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
          }}>
          {mutation.isPending
            ? 'Envoi en cours...'
            : 'Soumettre pour validation'}
        </button>

        {/* Erreur globale API */}
        {mutation.isError && !Object.keys(errors).length && (
          <div style={{
            marginTop: '12px', background: '#FCEBEB',
            border: '0.5px solid #F09595', borderRadius: '8px',
            padding: '12px', fontSize: '13px', color: '#791F1F',
          }}>
            Une erreur s'est produite. Vérifiez que vous êtes connecté
            ou réessayez dans quelques instants.
          </div>
        )}
      </form>
    </div>
  );
}