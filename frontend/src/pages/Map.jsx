import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from '../components/MapView';
import LayerControl from '../components/LayerControl';
import ChartPanel from '../components/ChartPanel';
import './Map.css';

const Map = () => {
  const [layers, setLayers] = useState({
    'Arrondissements_Brazzaville': {
      name: 'Arrondissements Brazzaville',
      visible: false,
      color: '#FF6B6B',
      opacity: 0.7,
      data: null
    },
    'Arrondissements_Pointe_Noire': {
      name: 'Arrondissements Pointe-Noire',
      visible: false,
      color: '#4ECDC4',
      opacity: 0.7,
      data: null
    },
    'Departement_Congo': {
      name: 'Départements Congo',
      visible: false,
      color: '#45B7D1',
      opacity: 0.7,
      data: null
    },
    'Districts_Congo': {
      name: 'Districts Congo',
      visible: false,
      color: '#96CEB4',
      opacity: 0.7,
      data: null
    },
    'Quartiers_kintele': {
      name: 'Quartiers Kintélé',
      visible: false,
      color: '#FFEAA7',
      opacity: 0.7,
      data: null
    }
  });

  const [selectedLayer, setSelectedLayer] = useState(null);
  const [activeLayersData, setActiveLayersData] = useState([]);
  const mapRef = useRef(null);

  // Charger les données GeoJSON au montage (une seule fois)
  const loadGeoJSONData = useCallback(async () => {
    const initialLayers = {
      'Arrondissements_Brazzaville': {
        name: 'Arrondissements Brazzaville',
        visible: false,
        color: '#FF6B6B',
        opacity: 0.7,
        data: null
      },
      'Arrondissements_Pointe_Noire': {
        name: 'Arrondissements Pointe-Noire',
        visible: false,
        color: '#4ECDC4',
        opacity: 0.7,
        data: null
      },
      'Departement_Congo': {
        name: 'Départements Congo',
        visible: false,
        color: '#45B7D1',
        opacity: 0.7,
        data: null
      },
      'Districts_Congo': {
        name: 'Districts Congo',
        visible: false,
        color: '#96CEB4',
        opacity: 0.7,
        data: null
      },
      'Quartiers_kintele': {
        name: 'Quartiers Kintélé',
        visible: false,
        color: '#FFEAA7',
        opacity: 0.7,
        data: null
      }
    };
    
    for (const layerKey of Object.keys(initialLayers)) {
      try {
        const response = await fetch(`/data/${layerKey}.geojson`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || (!contentType.includes('json'))) {
          throw new Error(`Réponse non-JSON: ${contentType}`);
        }
        
        const data = await response.json();
        initialLayers[layerKey].data = data;
        console.log(`Succès chargement ${layerKey}:`, data.features?.length || 0, 'entités');
      } catch (error) {
        console.error(`Erreur chargement ${layerKey}:`, error);
        // Pas de bloquage si une couche échoue
        initialLayers[layerKey].data = null;
      }
    }
    
    setLayers(initialLayers);
  }, []);

  useEffect(() => {
    loadGeoJSONData();
  }, [loadGeoJSONData]);

  const handleLayerToggle = (layerKey) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        visible: !prev[layerKey].visible
      }
    }));
  };

  const handleLayerStyleChange = (layerKey, property, value) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        [property]: value
      }
    }));
  };

  const handleFeatureClick = (feature, layerKey) => {
    setSelectedLayer({
      ...feature.properties,
      layerName: layers[layerKey].name,
      layerKey
    });
  };

  const updateActiveLayersData = (data) => {
    setActiveLayersData(data);
  };

  const exportMap = () => {
    if (mapRef.current) {
      try {
        // Solution simple : utiliser l'API DOM-to-Image native ou alternative
        const mapContainer = document.querySelector('.leaflet-container');
        if (!mapContainer) {
          alert('Carte non trouvée pour l\'export');
          return;
        }

        // Obtenir les dimensions de la carte
        const rect = mapContainer.getBoundingClientRect();
        
        // Vérifier si html2canvas est disponible (import dynamique)
        import('html2canvas').then(html2canvasModule => {
          const html2canvas = html2canvasModule.default;
          html2canvas(mapContainer, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 2
          }).then(canvas => {
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `geonia-map-${new Date().toISOString().slice(0, 10)}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }, 'image/png');
          }).catch(err => {
            console.error('Erreur html2canvas:', err);
            fallbackExport();
          });
        }).catch(err => {
          console.error('html2canvas non disponible:', err);
          fallbackExport();
        });
        
        function fallbackExport() {
          // Alternative simple : utiliser window.print()
          alert('Export PNG: Utilisez Ctrl+P pour imprimer ou une capture d\'écran manuelle.\n\nConseil: Vous pouvez utiliser l\'outil de capture d\'écran de votre navigateur (Ctrl+Shift+S sur Chrome/Firefox).');
        }
        
      } catch (error) {
        console.error('Erreur export PNG:', error);
        alert('Export non disponible. Utilisez une capture d\'écran manuelle (Ctrl+Shift+S).');
      }
    }
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Carte Interactive du Congo</h1>
        <button onClick={exportMap} className="export-btn">
          📷 Exporter en PNG
        </button>
      </div>
      
      <div className="map-container">
        <div className="map-main">
          <MapView
            layers={layers}
            onFeatureClick={handleFeatureClick}
            updateActiveLayersData={updateActiveLayersData}
            mapRef={mapRef}
          />
        </div>
        
        <div className="map-sidebar">
          <LayerControl
            layers={layers}
            onToggle={handleLayerToggle}
            onStyleChange={handleLayerStyleChange}
          />
          
          {activeLayersData.length > 0 && (
            <ChartPanel
              layersData={activeLayersData}
              layers={layers}
            />
          )}
        </div>
      </div>
      
      {selectedLayer && (
        <div className="feature-popup">
          <h3>{selectedLayer.name}</h3>
          <p><strong>Population:</strong> {selectedLayer.pop?.toLocaleString()}</p>
          <p><strong>Surface:</strong> {selectedLayer.area?.toFixed(2)} km²</p>
          <p><strong>Couche:</strong> {selectedLayer.layerName}</p>
          <button onClick={() => setSelectedLayer(null)}>Fermer</button>
        </div>
      )}
    </div>
  );
};

export default Map;
