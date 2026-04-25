import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import ChartPanel from '../components/ChartPanel';
import MapView, { congoCenter, congoZoom, defaultTileLayer } from '../components/MapView';
import { buildLayerSymbology } from '../utils/symbology';
import './MapExport.css';

// État local pour la gestion des couches dans MapExport
const initializeLayers = () => {
  // Charger les données GeoJSON directement depuis les fichiers de données
  // Au lieu de dépendre de sessionStorage depuis la page Map
  return {
    congo_departements: {
      name: 'Départements du Congo',
      visible: true,
      data: null, // Sera chargé depuis l'API
      styleMode: 'classified',
      styleField: 'name',
      color: '#0F6E56',
      opacity: 0.7,
      labelEnabled: false,
      labelField: 'name'
    },
    congo_districts: {
      name: 'Districts du Congo',
      visible: false,
      data: null,
      styleMode: 'classified',
      styleField: 'name',
      color: '#FF6B35',
      opacity: 0.7,
      labelEnabled: false,
      labelField: 'name'
    },
    arrondissements_brazzaville: {
      name: 'Arrondissements de Brazzaville',
      visible: false,
      data: null,
      styleMode: 'classified',
      styleField: 'name',
      color: '#4ECDC4',
      opacity: 0.7,
      labelEnabled: false,
      labelField: 'name'
    },
    arrondissements_pointe_noire: {
      name: 'Arrondissements de Pointe-Noire',
      visible: false,
      data: null,
      styleMode: 'classified',
      styleField: 'name',
      color: '#95E1D3',
      opacity: 0.7,
      labelEnabled: false,
      labelField: 'name'
    },
    quartiers_kintele: {
      name: 'Quartiers Kintélé',
      visible: false,
      data: null,
      styleMode: 'classified',
      styleField: 'name',
      color: '#F38181',
      opacity: 0.7,
      labelEnabled: false,
      labelField: 'name'
    }
  };
};

function ExportLegend({ layers }) {
  const visibleLayers = Object.entries(layers).filter(([, layer]) => layer.visible && layer.data);

  return (
    <section className="export-card">
      <div className="export-card__header">
        <h3>Legende cartographique</h3>
      </div>
      <div className="export-legend">
        {visibleLayers.map(([layerKey, layer]) => {
          const symbology = buildLayerSymbology(layer);
          return (
            <div key={layerKey} className="export-legend__group">
              <div className="export-legend__title">
                <strong>{layer.name}</strong>
                <span>{layer.styleMode === 'single' ? 'Couleur unique' : `${layer.styleMode} - ${symbology.field || 'champ'}`}</span>
              </div>
              <div className="export-legend__items">
                {symbology.legendItems.slice(0, 12).map((item) => (
                  <div key={`${layerKey}-${item.label}`} className="export-legend__item">
                    <span className="export-legend__swatch" style={{ backgroundColor: item.color }}></span>
                    <span>{item.label}</span>
                  </div>
                ))}
                {symbology.legendItems.length > 12 && (
                  <div className="export-legend__more">+ {symbology.legendItems.length - 12} autres classes</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExportSummary({ layers }) {
  const visibleLayers = Object.values(layers).filter((layer) => layer.visible && layer.data);
  const totalFeatures = visibleLayers.reduce((sum, layer) => sum + (layer.data?.features?.length || 0), 0);

  return (
    <section className="export-card export-summary">
      <div>
        <span className="export-summary__label">Couches visibles</span>
        <strong>{visibleLayers.length}</strong>
      </div>
      <div>
        <span className="export-summary__label">Entites</span>
        <strong>{totalFeatures}</strong>
      </div>
      <div>
        <span className="export-summary__label">Cree le</span>
        <strong>{new Date().toLocaleDateString('fr-FR')}</strong>
      </div>
    </section>
  );
}

function StyleControls({ layers, onUpdateLayer }) {
  return (
    <section className="export-card">
      <div className="export-card__header">
        <h3>Contrôles de style</h3>
      </div>
      <div className="style-controls">
        {Object.entries(layers).map(([layerKey, layer]) => (
          <div key={layerKey} className="style-control__group">
            <h4>{layer.name}</h4>
            
            <div className="style-control__row">
              <label>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(e) => onUpdateLayer(layerKey, { visible: e.target.checked })}
                />
                Visible
              </label>
            </div>
            
            <div className="style-control__row">
              <label>
                <input
                  type="checkbox"
                  checked={layer.labelEnabled}
                  onChange={(e) => onUpdateLayer(layerKey, { labelEnabled: e.target.checked })}
                />
                Afficher les étiquettes
              </label>
            </div>
            
            <div className="style-control__row">
              <label>Couleur:</label>
              <input
                type="color"
                value={layer.color}
                onChange={(e) => onUpdateLayer(layerKey, { color: e.target.value })}
                className="color-input"
              />
            </div>
            
            <div className="style-control__row">
              <label>Opacité:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layer.opacity}
                onChange={(e) => onUpdateLayer(layerKey, { opacity: parseFloat(e.target.value) })}
                className="opacity-slider"
              />
              <span>{Math.round(layer.opacity * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MapExport() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);
  const mapRef = useRef(null);
  
  // État autonome pour les couches (indépendant de la page Map)
  const [layers, setLayers] = useState(initializeLayers());
  const [mapView, setMapView] = useState({
    center: congoCenter,
    zoom: congoZoom,
    tileLayer: defaultTileLayer
  });
  const [activeLayersData, setActiveLayersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
    
  // Charger les données GeoJSON directement
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Configuration des fichiers à charger
        const layerFiles = {
          congo_departements: '/data/Departement_Congo.geojson',
          congo_districts: '/data/Districts_Congo.geojson',
          arrondissements_brazzaville: '/data/Arrondissements_Brazzaville.geojson',
          arrondissements_pointe_noire: '/data/Arrondissements_Pointe_Noire.geojson',
          quartiers_kintele: '/data/Quartiers_kintele.geojson'
        };
        
        const loadedLayers = {};
        const allActiveData = [];
        
        // Charger chaque fichier GeoJSON
        for (const [layerKey, filePath] of Object.entries(layerFiles)) {
          try {
            const response = await fetch(filePath);
            
            if (!response.ok) {
              console.warn(`Impossible de charger ${filePath}: ${response.status}`);
              continue;
            }
            
            const geoData = await response.json();
            
            if (!geoData || !geoData.features) {
              console.warn(`Fichier GeoJSON invalide: ${filePath}`);
              continue;
            }
            
            loadedLayers[layerKey] = geoData;
            
            // Ajouter aux données actives pour les diagrammes
            const layerData = geoData.features.map(feature => ({
              name: feature.properties.name || 'Sans nom',
              pop: feature.properties.pop || 0,
              area: feature.properties.area || 0,
              layerName: layers[layerKey]?.name || layerKey,
              layerKey
            }));
            allActiveData.push(...layerData);
            
          } catch (error) {
            console.warn(`Erreur de chargement de ${filePath}:`, error);
          }
        }
        
        // Mettre à jour toutes les couches
        setLayers(prev => {
          const updated = { ...prev };
          Object.keys(loadedLayers).forEach(layerKey => {
            updated[layerKey] = {
              ...prev[layerKey],
              data: loadedLayers[layerKey]
            };
          });
          return updated;
        });
        
        setActiveLayersData(allActiveData);
        
      } catch (error) {
        console.error('Erreur de chargement des données:', error);
        setLoadError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGeoData();
  }, [layers]);

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('map-export-printing');
      setIsExporting(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Gestionnaire pour mettre à jour les couches
  const updateLayer = (layerKey, updates) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        ...updates
      }
    }));
  };
  
  // Gestionnaire pour mettre à jour la vue de la carte
  const updateMapView = (newView) => {
    setMapView(prev => ({ ...prev, ...newView }));
  };
  
  // Couches visibles
  const visibleLayers = useMemo(() => {
    return Object.fromEntries(
      Object.entries(layers).filter(([, layer]) => layer.visible && layer.data)
    );
  }, [layers]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        mapRef.current?.setView(
          mapView.center || congoCenter,
          typeof mapView.zoom === 'number' ? mapView.zoom : congoZoom,
          { animate: false }
        );
      }, 200);
    }
  }, [visibleLayers, mapView]);

  const exportAsPng = async () => {
    if (!exportRef.current || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      mapRef.current?.invalidateSize();
      mapRef.current?.setView(
        mapView.center || congoCenter,
        typeof mapView.zoom === 'number' ? mapView.zoom : congoZoom,
        { animate: false }
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `geonia-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error('Erreur export PNG:', error);
      alert("Impossible d'exporter en PNG pour le moment.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPdf = async () => {
    setIsExporting(true);
    mapRef.current?.invalidateSize();
    mapRef.current?.setView(
      mapView.center || congoCenter,
      typeof mapView.zoom === 'number' ? mapView.zoom : congoZoom,
      { animate: false }
    );
    document.body.classList.add('map-export-printing');
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.print();
  };

  if (isLoading) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Chargement des données...</h2>
          <p>Veuillez patienter pendant le chargement des couches géographiques.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Erreur de chargement</h2>
          <p>Impossible de charger les données géographiques : {loadError}</p>
          <button className="export-action export-action--primary" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!Object.keys(visibleLayers).length) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Aucune donnée disponible</h2>
          <p>Les couches géographiques ne contiennent aucune donnée à afficher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-export-page${isExporting ? ' map-export-page--busy' : ''}`}>
      <div className="map-export-toolbar">
        <div>
          <h1>Export cartographique</h1>
          <p>Page dediee pour produire un rendu complet avec carte, legende et diagrammes.</p>
        </div>
        <div className="map-export-toolbar__actions">
          <button className="export-action" onClick={() => navigate('/map')}>
            Retour
          </button>
          <button className="export-action" onClick={exportAsPng} disabled={isExporting}>
            {isExporting ? 'Traitement...' : 'Exporter PNG'}
          </button>
          <button className="export-action export-action--primary" onClick={exportAsPdf} disabled={isExporting}>
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="map-export-sheet" ref={exportRef}>
        <header className="map-export-sheet__header">
          <div>
            <h2>Carte thematique du Congo</h2>
            <p>Composition generee depuis GeoNia Data Hub - Mode autonome</p>
          </div>
          <div className="map-export-sheet__meta">
            <span>{new Date().toLocaleString('fr-FR')}</span>
          </div>
        </header>

        <ExportSummary layers={visibleLayers} />

        <section className="map-export-grid">
          <div className="export-card export-card--map">
            <MapView
              layers={visibleLayers}
              onFeatureClick={() => {}}
              updateActiveLayersData={setActiveLayersData}
              mapRef={mapRef}
              initialView={mapView}
              showTileLayerSelector={true}
              onMapViewChange={updateMapView}
              onLayerUpdate={updateLayer}
            />
          </div>

          <div className="map-export-side">
            <StyleControls layers={layers} onUpdateLayer={updateLayer} />
            <ExportLegend layers={visibleLayers} />
            <section className="export-card">
              <div className="export-card__header">
                <h3>Diagrammes</h3>
              </div>
              <ChartPanel layersData={activeLayersData} />
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
