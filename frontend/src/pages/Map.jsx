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
        // Utiliser l'API native du navigateur pour capturer l'écran
        // Note: Cette fonctionnalité est expérimentale et peut ne pas fonctionner sur tous les navigateurs
        
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia({
            video: {
              mediaSource: 'screen'
            }
          }).then(stream => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.onloadedmetadata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              
              // Télécharger l'image
              canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `geonia-map-${new Date().toISOString().slice(0, 10)}.png`;
                link.click();
                URL.revokeObjectURL(url);
                stream.getTracks().forEach(track => track.stop());
              }, 'image/png');
            };
          }).catch(err => {
            console.error('Erreur capture écran:', err);
            alert('Export non disponible sur ce navigateur. Veuillez utiliser une capture d\'écran manuelle.');
          });
        } else {
          // Alternative: simple alert pour les navigateurs non compatibles
          alert('Export PNG: Utilisez Ctrl+P pour imprimer ou une capture d\'écran manuelle.');
        }
      } catch (error) {
        console.error('Erreur export PNG:', error);
        alert('Export non disponible. Utilisez une capture d\'écran manuelle.');
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
