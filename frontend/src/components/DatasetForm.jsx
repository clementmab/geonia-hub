import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getDepartments, submitDataset } from '../api/datasets';
import './DatasetForm.css';

const DatasetForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    dataset_type: 'new',
    description: '',
    category: '',
    department: '',
    format: 'geojson',
    projection: 'EPSG:4326',
    licence: 'open',
    file_url: '',
    file_size_mb: 0
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Erreur chargement départements:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'file_size_mb' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Vous devez être connecté pour soumettre un dataset.');
      navigate('/login');
      return;
    }

    try {
      await submitDataset(formData);
      setSuccessMessage('✓ Dataset soumis avec succès ! Il sera examiné par un administrateur.');
      setTimeout(() => navigate('/catalogue'), 2000);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Erreur lors de la soumission. Veuillez réessayer.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dataset-form-container">
      <div className="dataset-form">
        <h2>Contribuer un dataset</h2>
        <p>Partagez vos données géographiques avec la communauté</p>

        {successMessage && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            border: '1px solid #c3e6cb',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Informations générales</h3>

            <div className="form-group">
              <label htmlFor="title">Titre du dataset *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ex: Routes de Brazzaville 2024"
              />
              {errors.title && <span className="error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dataset_type">Type de dataset</label>
              <select
                id="dataset_type"
                name="dataset_type"
                value={formData.dataset_type}
                onChange={handleChange}
              >
                <option value="new">Nouveau dataset</option>
                <option value="pre_produced">Carte pré-produite</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Décrivez votre dataset : zone couverte, source, qualité..."
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Classification</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Catégorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <span className="error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="department">Département</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">National / Tous départements</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
                {errors.department && <span className="error">{errors.department}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Informations techniques</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="format">Format *</label>
                <select
                  id="format"
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  required
                >
                  <option value="geojson">GeoJSON</option>
                  <option value="shp">Shapefile</option>
                  <option value="gpkg">GeoPackage</option>
                  <option value="tif">GeoTIFF (Raster)</option>
                  <option value="pdf">Carte PDF</option>
                  <option value="zip">Archive ZIP</option>
                </select>
                {errors.format && <span className="error">{errors.format}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="projection">Projection</label>
                <input
                  type="text"
                  id="projection"
                  name="projection"
                  value={formData.projection}
                  onChange={handleChange}
                  placeholder="EPSG:4326"
                />
                {errors.projection && <span className="error">{errors.projection}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="licence">Licence</label>
                <select
                  id="licence"
                  name="licence"
                  value={formData.licence}
                  onChange={handleChange}
                >
                  <option value="open">Open Data</option>
                  <option value="cc-by">CC BY 4.0</option>
                  <option value="cc-by-sa">CC BY-SA 4.0</option>
                  <option value="mit">MIT</option>
                </select>
                {errors.licence && <span className="error">{errors.licence}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="file_size_mb">Taille (MB)</label>
                <input
                  type="number"
                  id="file_size_mb"
                  name="file_size_mb"
                  value={formData.file_size_mb}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
                {errors.file_size_mb && <span className="error">{errors.file_size_mb}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="file_url">URL du fichier *</label>
              <input
                type="url"
                id="file_url"
                name="file_url"
                value={formData.file_url}
                onChange={handleChange}
                required
                placeholder="https://exemple.com/mon-dataset.geojson"
              />
              {errors.file_url && <span className="error">{errors.file_url}</span>}
            </div>
          </div>

          {errors.general && <div className="error general">{errors.general}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Soumission en cours...' : 'Soumettre le dataset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DatasetForm;