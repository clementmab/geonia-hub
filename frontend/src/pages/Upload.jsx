import React from 'react';
import DatasetForm from '../components/DatasetForm';

export default function Upload() {
  return <DatasetForm />;
}
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