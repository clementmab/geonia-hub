import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ChartPanel from '../components/ChartPanel';
import LayerControl from '../components/LayerControl';
import MapView from '../components/MapView';
import './Map.css';

const initialLayerConfig = {
  Arrondissements_Brazzaville: {
    name: 'Arrondissements Brazzaville',
    visible: false,
    color: '#FF6B6B',
    opacity: 0.7,
    data: null,
  },
  Arrondissements_Pointe_Noire: {
    name: 'Arrondissements Pointe-Noire',
    visible: false,
    color: '#4ECDC4',
    opacity: 0.7,
    data: null,
  },
  Departement_Congo: {
    name: 'Departements Congo',
    visible: false,
    color: '#45B7D1',
    opacity: 0.7,
    data: null,
  },
  Districts_Congo: {
    name: 'Districts Congo',
    visible: false,
    color: '#96CEB4',
    opacity: 0.7,
    data: null,
  },
  Quartiers_kintele: {
    name: 'Quartiers Kintele',
    visible: false,
    color: '#FFEAA7',
    opacity: 0.7,
    data: null,
  },
};

const Map = () => {
  const [layers, setLayers] = useState(initialLayerConfig);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [activeLayersData, setActiveLayersData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const mapRef = useRef(null);
  const exportTargetRef = useRef(null);

  useEffect(() => {
    const loadGeoJSONData = async () => {
      const nextLayers = JSON.parse(JSON.stringify(initialLayerConfig));

      for (const layerKey of Object.keys(nextLayers)) {
        try {
          const response = await fetch(`/data/${layerKey}.geojson`);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('json')) {
            throw new Error(`Reponse non-JSON: ${contentType}`);
          }

          nextLayers[layerKey].data = await response.json();
        } catch (error) {
          console.error(`Erreur chargement ${layerKey}:`, error);
          nextLayers[layerKey].data = null;
        }
      }

      setLayers(nextLayers);
    };

    loadGeoJSONData();
  }, []);

  const handleLayerToggle = (layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        visible: !prev[layerKey].visible,
      },
    }));
  };

  const handleLayerStyleChange = (layerKey, property, value) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        [property]: value,
      },
    }));
  };

  const handleFeatureClick = (feature, layerKey) => {
    setSelectedLayer({
      ...feature.properties,
      layerName: layers[layerKey].name,
      layerKey,
    });
  };

  const exportMap = async () => {
    if (!mapRef.current || !exportTargetRef.current || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      mapRef.current.invalidateSize();
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(exportTargetRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `geonia-map-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error('Erreur export PNG:', error);
      alert('Impossible d exporter la carte pour le moment. Verifiez que les tuiles sont chargees puis reessayez.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h1>Carte Interactive du Congo</h1>
          <p className="map-subtitle">Explorez les couches geospatiales avec une navigation plus lisible.</p>
        </div>
        <button onClick={exportMap} className="export-btn" disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter en PNG'}
        </button>
      </div>

      <div className="map-container">
        <div className="map-main" ref={exportTargetRef}>
          <MapView
            layers={layers}
            onFeatureClick={handleFeatureClick}
            updateActiveLayersData={setActiveLayersData}
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
          <p><strong>Population:</strong> {selectedLayer.pop?.toLocaleString() ?? 'N/A'}</p>
          <p><strong>Surface:</strong> {selectedLayer.area?.toFixed?.(2) ?? 'N/A'} km2</p>
          <p><strong>Couche:</strong> {selectedLayer.layerName}</p>
          <button onClick={() => setSelectedLayer(null)}>Fermer</button>
        </div>
      )}
    </div>
  );
};

export default Map;
