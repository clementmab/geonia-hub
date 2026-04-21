import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

const MapView = ({ layers, onFeatureClick, updateActiveLayersData, mapRef }) => {
  const [geoJsonLayers, setGeoJsonLayers] = useState({});
  const [selectedTileLayer, setSelectedTileLayer] = useState('osm');
  const leafletMapRef = useRef(null);

  // Centrer la carte sur le Congo
  const congoCenter = [-1.9, 15.5];
  const congoZoom = 6;

  // Options de fonds de carte
  const tileLayers = {
    osm: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, swisstopo'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a> contributors'
    },
    dark: {
      name: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  };

  useEffect(() => {
    if (mapRef && leafletMapRef.current) {
      mapRef.current = leafletMapRef.current;
    }
  }, [mapRef]);

  useEffect(() => {
    const newGeoJsonLayers = {};
    const activeData = [];

    Object.keys(layers).forEach(layerKey => {
      const layer = layers[layerKey];
      if (layer.visible && layer.data) {
        newGeoJsonLayers[layerKey] = {
          data: layer.data,
          style: {
            fillColor: layer.color,
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: layer.opacity
          }
        };

        // Extraire les données pour les graphiques
        if (layer.data.features) {
          layer.data.features.forEach(feature => {
            if (feature.properties) {
              activeData.push({
                name: feature.properties.name,
                pop: feature.properties.pop || 0,
                area: feature.properties.area || 0,
                layerName: layer.name,
                layerKey: layerKey
              });
            }
          });
        }
      }
    });

    setGeoJsonLayers(newGeoJsonLayers);
    updateActiveLayersData(activeData);
  }, [layers, updateActiveLayersData]);

  const onEachFeature = (feature, layer) => {
    // Lier le popup directement à la couche
    const popupContent = `
      <div class="leaflet-popup">
        <h4>${feature.properties.name || 'Sans nom'}</h4>
        <p><strong>Nom de la forme:</strong> ${feature.properties.name || 'N/A'}</p>
        <p><strong>Population:</strong> ${feature.properties.pop?.toLocaleString() || 'N/A'}</p>
        <p><strong>Surface:</strong> ${feature.properties.area?.toFixed(2) || 'N/A'} ha</p>
        ${feature.properties.density ? `<p><strong>Densité:</strong> ${feature.properties.density.toFixed(2)} hab/ha</p>` : ''}
      </div>
    `;
    layer.bindPopup(popupContent);

    // Style au hover
    layer.on({
      mouseover: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle({
          weight: 3,
          color: '#666',
          fillOpacity: 0.9
        });
        targetLayer.bringToFront();
      },
      mouseout: (e) => {
        const targetLayer = e.target;
        // Trouver la clé de la couche visible
        const layerKey = Object.keys(layers).find(key => 
          layers[key].visible && layers[key].data && 
          layers[key].data.features && 
          layers[key].data.features.includes(feature)
        );
        if (layerKey) {
          targetLayer.setStyle({
            weight: 2,
            color: 'white',
            fillOpacity: layers[layerKey].opacity
          });
        }
      },
      click: (e) => {
        // Ouvrir le popup au clic
        e.target.openPopup();
        
        // Aussi déclencher le callback pour les données
        const layerKey = Object.keys(layers).find(key => 
          layers[key].visible && layers[key].data && 
          layers[key].data.features && 
          layers[key].data.features.includes(feature)
        );
        if (layerKey) {
          onFeatureClick(feature, layerKey);
        }
      }
    });
  };

  return (
    <div className="map-view">
      {/* Sélecteur de fond de carte */}
      <div className="tile-layer-selector">
        <label>Fond de carte:</label>
        <select 
          value={selectedTileLayer} 
          onChange={(e) => setSelectedTileLayer(e.target.value)}
          className="tile-select"
        >
          {Object.keys(tileLayers).map(key => (
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
        />
        
        {Object.keys(geoJsonLayers).map(layerKey => (
          <GeoJSON
            key={layerKey}
            data={geoJsonLayers[layerKey].data}
            style={geoJsonLayers[layerKey].style}
            onEachFeature={onEachFeature}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
