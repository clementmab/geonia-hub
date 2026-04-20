import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

const MapView = ({ layers, onFeatureClick, updateActiveLayersData, mapRef }) => {
  const [geoJsonLayers, setGeoJsonLayers] = useState({});
  const leafletMapRef = useRef(null);

  // Centrer la carte sur le Congo
  const congoCenter = [-1.9, 15.5];
  const congoZoom = 6;

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
    // Style au hover
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          fillOpacity: 0.9
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        const layerKey = Object.keys(layers).find(key => 
          layers[key].visible && layers[key].data === e.target.feature
        );
        if (layerKey) {
          layer.setStyle({
            weight: 2,
            color: 'white',
            fillOpacity: layers[layerKey].opacity
          });
        }
      },
      click: (e) => {
        onFeatureClick(e.target.feature, Object.keys(layers).find(key => 
          layers[key].visible && layers[key].data === e.target.feature
        ));
      }
    });
  };

  const bindPopup = (feature, layer) => {
    const popupContent = `
      <div class="leaflet-popup">
        <h4>${feature.properties.name || 'Sans nom'}</h4>
        <p><strong>Population:</strong> ${feature.properties.pop?.toLocaleString() || 'N/A'}</p>
        <p><strong>Surface:</strong> ${feature.properties.area?.toFixed(2) || 'N/A'} km²</p>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  return (
    <div className="map-view">
      <MapContainer
        center={congoCenter}
        zoom={congoZoom}
        style={{ height: '100%', width: '100%' }}
        ref={leafletMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {Object.keys(geoJsonLayers).map(layerKey => (
          <GeoJSON
            key={layerKey}
            data={geoJsonLayers[layerKey].data}
            style={geoJsonLayers[layerKey].style}
            onEachFeature={onEachFeature}
            bindPopup={bindPopup}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
