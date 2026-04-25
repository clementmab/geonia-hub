import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartPanel from '../components/ChartPanel';
import LayerControl from '../components/LayerControl';
import MapView, { congoCenter, congoZoom, defaultTileLayer } from '../components/MapView';
import { createInitialLayerConfig } from '../constants/mapLayers';
import './Map.css';

const Map = () => {
  const navigate = useNavigate();
  const [layers, setLayers] = useState(() => createInitialLayerConfig());
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [activeLayersData, setActiveLayersData] = useState([]);
  const [mapView, setMapView] = useState({
    center: congoCenter,
    zoom: congoZoom,
    tileLayer: defaultTileLayer,
  });
  const mapRef = useRef(null);

  useEffect(() => {
    const loadGeoJSONData = async () => {
      const nextLayers = createInitialLayerConfig();

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

  const exportMap = () => {
    const visibleLayers = Object.fromEntries(
      Object.entries(layers).filter(([, layer]) => layer.visible && layer.data)
    );

    if (!Object.keys(visibleLayers).length) {
      alert("Active au moins une couche avant de preparer l'export.");
      return;
    }

    const exportId = `map-export-${Date.now()}`;
    const exportPayload = {
      createdAt: new Date().toISOString(),
      layers,
      activeLayersData,
      mapView,
    };

    sessionStorage.setItem(exportId, JSON.stringify(exportPayload));
    navigate(`/map/export?id=${encodeURIComponent(exportId)}`);
  };

  return (
    <div className="map-page">
      <div className="map-export-layout">
      <div className="map-header">
        <div>
          <h1>Carte Interactive du Congo</h1>
          <p className="map-subtitle">Explorez les couches geospatiales avec une navigation plus lisible.</p>
        </div>
        <button onClick={exportMap} className="export-btn">
          Exporter la mise en page
        </button>
      </div>

      <div className="map-container">
        <div className="map-main">
          <MapView
            layers={layers}
            onFeatureClick={handleFeatureClick}
            updateActiveLayersData={setActiveLayersData}
            mapRef={mapRef}
            initialView={mapView}
            onViewChange={(nextView) => setMapView((prev) => ({ ...prev, ...nextView }))}
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
