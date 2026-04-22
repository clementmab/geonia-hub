import React, { useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { buildLayerSymbology } from '../utils/symbology';
import './MapView.css';

const tileLayers = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> - Source: Esri, i-cubed, USDA, USGS',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a> contributors',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

const congoCenter = [-1.9, 15.5];
const congoZoom = 6;

const MapView = ({ layers, onFeatureClick, updateActiveLayersData, mapRef }) => {
  const [geoJsonLayers, setGeoJsonLayers] = useState({});
  const [selectedTileLayer, setSelectedTileLayer] = useState('osm');
  const leafletMapRef = useRef(null);

  useEffect(() => {
    if (mapRef && leafletMapRef.current) {
      mapRef.current = leafletMapRef.current;
    }
  }, [mapRef]);

  useEffect(() => {
    const nextLayers = {};
    const activeData = [];

    Object.keys(layers).forEach((layerKey) => {
      const layer = layers[layerKey];
      if (!layer.visible || !layer.data) {
        return;
      }

      const symbology = buildLayerSymbology(layer);
      nextLayers[layerKey] = {
        data: layer.data,
        getFeatureStyle: symbology.getFeatureStyle,
      };

      (layer.data.features ?? []).forEach((feature) => {
        if (!feature?.properties) {
          return;
        }

        activeData.push({
          name: feature.properties.name,
          pop: feature.properties.pop || 0,
          area: feature.properties.area || 0,
          layerName: layer.name,
          layerKey,
        });
      });
    });

    setGeoJsonLayers(nextLayers);
    updateActiveLayersData(activeData);
  }, [layers, updateActiveLayersData]);

  const getPopupContent = (feature) => {
    const properties = feature?.properties ?? {};
    return `
      <div class="leaflet-popup">
        <h4>${properties.name || 'Sans nom'}</h4>
        <p><strong>Nom de la forme:</strong> ${properties.name || 'N/A'}</p>
        <p><strong>Population:</strong> ${properties.pop?.toLocaleString?.() || 'N/A'}</p>
        <p><strong>Surface:</strong> ${properties.area?.toFixed?.(2) || 'N/A'} ha</p>
        ${properties.density ? `<p><strong>Densite:</strong> ${properties.density.toFixed(2)} hab/ha</p>` : ''}
      </div>
    `;
  };

  const onEachFeature = (layerKey) => (feature, leafletLayer) => {
    const layerConfig = layers[layerKey];
    const symbology = buildLayerSymbology(layerConfig);

    leafletLayer.bindPopup(getPopupContent(feature));

    leafletLayer.on({
      mouseover: (event) => {
        const targetLayer = event.target;
        targetLayer.setStyle({
          weight: 3,
          color: '#4f5d75',
          fillOpacity: Math.min((layerConfig.opacity ?? 0.7) + 0.15, 1),
        });
        targetLayer.bringToFront();
      },
      mouseout: (event) => {
        event.target.setStyle(symbology.getFeatureStyle(feature));
      },
      click: (event) => {
        event.target.openPopup();
        onFeatureClick(feature, layerKey);
      },
    });
  };

  return (
    <div className="map-view">
      <div className="tile-layer-selector">
        <label>Fond de carte</label>
        <select
          value={selectedTileLayer}
          onChange={(event) => setSelectedTileLayer(event.target.value)}
          className="tile-select"
        >
          {Object.keys(tileLayers).map((key) => (
            <option key={key} value={key}>
              {tileLayers[key].name}
            </option>
          ))}
        </select>
      </div>

      <MapContainer
        center={congoCenter}
        zoom={congoZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        ref={leafletMapRef}
      >
        <TileLayer
          attribution={tileLayers[selectedTileLayer].attribution}
          url={tileLayers[selectedTileLayer].url}
          crossOrigin="anonymous"
        />

        {Object.keys(geoJsonLayers).map((layerKey) => (
          <GeoJSON
            key={layerKey}
            data={geoJsonLayers[layerKey].data}
            style={geoJsonLayers[layerKey].getFeatureStyle}
            onEachFeature={onEachFeature(layerKey)}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
