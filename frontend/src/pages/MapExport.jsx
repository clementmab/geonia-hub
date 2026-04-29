import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import ChartPanel from '../components/ChartPanel';
import MapView, { congoCenter, congoZoom, defaultTileLayer } from '../components/MapView';
import { buildLayerSymbology } from '../utils/symbology';
import './MapExport.css';

const EXPORT_LAYER_CATALOG = [
  {
    key: 'Departement_Congo',
    name: 'Departements du Congo',
    scope: 'National',
    filePath: '/data/Departement_Congo.geojson',
    color: '#0f6e56',
  },
  {
    key: 'Districts_Congo',
    name: 'Districts du Congo',
    scope: 'National',
    filePath: '/data/Districts_Congo.geojson',
    color: '#f25f5c',
  },
  {
    key: 'Arrondissements_Brazzaville',
    name: 'Arrondissements de Brazzaville',
    scope: 'Brazzaville',
    filePath: '/data/Arrondissements_Brazzaville.geojson',
    color: '#247ba0',
  },
  {
    key: 'Arrondissements_Pointe_Noire',
    name: 'Arrondissements de Pointe-Noire',
    scope: 'Pointe-Noire',
    filePath: '/data/Arrondissements_Pointe_Noire.geojson',
    color: '#70c1b3',
  },
  {
    key: 'Quartiers_kintele',
    name: 'Quartiers de Kintele',
    scope: 'Kintele',
    filePath: '/data/Quartiers_kintele.geojson',
    color: '#f7a072',
  },
];

function createInitialLayers() {
  return Object.fromEntries(
    EXPORT_LAYER_CATALOG.map((layer) => [
      layer.key,
      {
        name: layer.name,
        scope: layer.scope,
        filePath: layer.filePath,
        visible: layer.key === 'Departement_Congo',
        data: null,
        styleMode: 'categorized',
        styleField: 'name',
        color: layer.color,
        opacity: 0.72,
        labelEnabled: true,
        labelField: 'name',
      },
    ])
  );
}

function createFeatureCollection(data, features) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    features,
  };
}

function sortFeaturesByName(features) {
  return [...features].sort((a, b) => {
    const left = String(a?.properties?.name || '');
    const right = String(b?.properties?.name || '');
    return left.localeCompare(right, 'fr', { sensitivity: 'base' });
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger une ressource d'export"));
    image.src = url;
  });
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle, strokeStyle = null) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
}

function getCanvasLabelPoint(map, feature) {
  const geometry = feature?.geometry;
  if (!geometry) {
    return null;
  }

  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    return map.latLngToContainerPoint([lat, lng]);
  }

  if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates?.[0])) {
    const [lng, lat] = geometry.coordinates[0];
    return map.latLngToContainerPoint([lat, lng]);
  }

  const bounds = L.geoJSON(feature).getBounds();
  if (!bounds.isValid()) {
    return null;
  }

  return map.latLngToContainerPoint(bounds.getCenter());
}

function traceGeometryPath(context, geometry, projectPoint) {
  if (!geometry) {
    return false;
  }

  const moveAlongRing = (ring) => {
    ring.forEach((coordinate, index) => {
      const point = projectPoint(coordinate);
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();
  };

  context.beginPath();

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(moveAlongRing);
    return true;
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => polygon.forEach(moveAlongRing));
    return true;
  }

  if (geometry.type === 'LineString') {
    geometry.coordinates.forEach((coordinate, index) => {
      const point = projectPoint(coordinate);
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    return true;
  }

  if (geometry.type === 'MultiLineString') {
    geometry.coordinates.forEach((line) => {
      line.forEach((coordinate, index) => {
        const point = projectPoint(coordinate);
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
    });
    return true;
  }

  if (geometry.type === 'Point') {
    const point = projectPoint(geometry.coordinates);
    context.arc(point.x, point.y, 6, 0, Math.PI * 2);
    return true;
  }

  if (geometry.type === 'MultiPoint') {
    geometry.coordinates.forEach((coordinate) => {
      const point = projectPoint(coordinate);
      context.moveTo(point.x + 6, point.y);
      context.arc(point.x, point.y, 6, 0, Math.PI * 2);
    });
    return true;
  }

  return false;
}

function drawGeoJsonLayersOnCanvas(context, map, mapElement, width, height, layers) {
  const sourceWidth = mapElement.clientWidth || mapElement.getBoundingClientRect().width || width;
  const sourceHeight = mapElement.clientHeight || mapElement.getBoundingClientRect().height || height;
  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;
  const lineScale = (scaleX + scaleY) / 2;

  const projectPoint = ([lng, lat]) => {
    const containerPoint = map.latLngToContainerPoint([lat, lng]);
    return {
      x: containerPoint.x * scaleX,
      y: containerPoint.y * scaleY,
    };
  };

  Object.values(layers).forEach((layer) => {
    if (!layer?.data?.features?.length) {
      return;
    }

    const symbology = buildLayerSymbology(layer);

    layer.data.features.forEach((feature) => {
      const style = symbology.getFeatureStyle(feature);
      const geometryType = feature?.geometry?.type;
      const hasPath = traceGeometryPath(context, feature?.geometry, projectPoint);

      if (!hasPath) {
        return;
      }

      context.fillStyle = style.fillColor || layer.color || '#45B7D1';
      context.strokeStyle = style.color || '#ffffff';
      context.lineWidth = Math.max((style.weight || 2) * lineScale, 1);
      context.globalAlpha = typeof style.fillOpacity === 'number' ? style.fillOpacity : 0.72;

      if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
        context.fill('evenodd');
      } else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        context.fill();
      }

      context.globalAlpha = typeof style.opacity === 'number' ? style.opacity : 1;
      context.stroke();
      context.globalAlpha = 1;

      if (!layer.labelEnabled) {
        return;
      }

      const labelField = layer.labelField || 'name';
      const labelValue = feature?.properties?.[labelField];
      if (labelValue === undefined || labelValue === null || labelValue === '') {
        return;
      }

      const labelPoint = getCanvasLabelPoint(map, feature);
      if (!labelPoint) {
        return;
      }

      const x = labelPoint.x * scaleX;
      const y = labelPoint.y * scaleY;
      const text = String(labelValue);
      context.font = '600 12px Arial';
      const textWidth = context.measureText(text).width;
      const labelHeight = 22;
      const labelWidth = textWidth + 16;

      drawRoundedRect(
        context,
        x - labelWidth / 2,
        y - labelHeight / 2,
        labelWidth,
        labelHeight,
        labelHeight / 2,
        'rgba(255,255,255,0.92)',
        'rgba(15,110,86,0.18)'
      );
      context.fillStyle = '#0f1720';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, x, y + 0.5);
      context.textAlign = 'start';
    });
  });
}

async function renderLeafletMapSnapshot(map, mapElement, width, height, layers) {
  if (!mapElement || !map) {
    throw new Error('Carte introuvable');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Contexte canvas indisponible');
  }

  context.fillStyle = '#dce8ee';
  context.fillRect(0, 0, width, height);

  const mapRect = mapElement.getBoundingClientRect();
  const tileImages = Array.from(mapElement.querySelectorAll('.leaflet-tile'));

  for (const tile of tileImages) {
    if (!(tile instanceof HTMLImageElement) || !tile.complete || !tile.naturalWidth) {
      continue;
    }

    const rect = tile.getBoundingClientRect();
    const x = ((rect.left - mapRect.left) / mapRect.width) * width;
    const y = ((rect.top - mapRect.top) / mapRect.height) * height;
    const tileWidth = (rect.width / mapRect.width) * width;
    const tileHeight = (rect.height / mapRect.height) * height;

    try {
      context.drawImage(tile, x, y, tileWidth, tileHeight);
    } catch (error) {
      // Continue with the rest of the map when one tile fails.
    }
  }

  drawGeoJsonLayersOnCanvas(context, map, mapElement, width, height, layers);

  return canvas;
}

async function exportCompositionAsPng({
  fileName,
  legendLayers,
  mapInstance,
  mapElement,
  chartCanvas,
}) {
  const width = 1500;
  const height = 860;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Contexte canvas indisponible');
  }

  context.fillStyle = '#f4f8f7';
  context.fillRect(0, 0, width, height);

  drawRoundedRect(context, 24, 20, width - 48, height - 40, 24, '#ffffff');

  const mapX = 40;
  const mapY = 38;
  const mapWidth = 980;
  const mapHeight = 590;
  drawRoundedRect(context, mapX, mapY, mapWidth, mapHeight, 18, '#dce8ee', '#dbe6eb');

  const mapCanvas = await renderLeafletMapSnapshot(mapInstance, mapElement, mapWidth, mapHeight, legendLayers);
  context.drawImage(mapCanvas, mapX, mapY, mapWidth, mapHeight);

  const sideX = 1040;
  const sideWidth = 420;
  drawRoundedRect(context, sideX, mapY, sideWidth, 306, 18, '#ffffff', '#dbe6eb');
  context.fillStyle = '#16324a';
  context.font = '700 22px Arial';
  context.fillText('Legende', sideX + 20, mapY + 32);

  let legendY = mapY + 62;
  Object.values(legendLayers).forEach((layer) => {
    const symbology = buildLayerSymbology(layer);
    context.fillStyle = '#16324a';
    context.font = '700 16px Arial';
    context.fillText(layer.name, sideX + 20, legendY);
    legendY += 16;
    context.fillStyle = '#5d6c79';
    context.font = '400 12px Arial';
    context.fillText(layer.styleMode === 'single' ? 'Couleur unique' : `${layer.styleMode} - ${symbology.field || 'champ'}`, sideX + 20, legendY);
    legendY += 16;

    symbology.legendItems.slice(0, 10).forEach((item) => {
      drawRoundedRect(context, sideX + 20, legendY - 10, 14, 14, 3, item.color, 'rgba(0,0,0,0.08)');
      context.fillStyle = '#16324a';
      context.font = '400 12px Arial';
      context.fillText(String(item.label), sideX + 42, legendY + 1);
      legendY += 20;
    });

    legendY += 6;
  });

  drawRoundedRect(context, sideX, mapY + 324, sideWidth, 484, 18, '#ffffff', '#dbe6eb');
  context.fillStyle = '#16324a';
  context.font = '700 22px Arial';
  context.fillText('Diagramme', sideX + 20, mapY + 358);

  if (chartCanvas) {
    context.drawImage(chartCanvas, sideX + 18, mapY + 372, sideWidth - 36, 410);
  } else {
    context.fillStyle = '#5d6c79';
    context.font = '400 16px Arial';
    context.fillText('Aucune visualisation disponible', sideX + 20, mapY + 408);
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = fileName;
  link.click();
}

function ExportLegend({ layers }) {
  const visibleLayers = Object.entries(layers).filter(([, layer]) => layer.visible && layer.data);

  return (
    <section className="export-card">
      <div className="export-card__header">
        <h3>Legende</h3>
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
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExportSummary({ scopeName, layerName, featureCount }) {
  return (
    <section className="export-card export-summary">
      <div>
        <span className="export-summary__label">Niveau</span>
        <strong>{layerName}</strong>
      </div>
      <div>
        <span className="export-summary__label">Zone</span>
        <strong>{scopeName}</strong>
      </div>
      <div>
        <span className="export-summary__label">Entites</span>
        <strong>{featureCount}</strong>
      </div>
    </section>
  );
}

function ExportConfigurator({
  layerOptions,
  selectedLayerKey,
  selectedFeatureName,
  searchTerm,
  featureOptions,
  selectedLayer,
  onLayerChange,
  onFeatureChange,
  onSearchChange,
  onLayerStyleChange,
}) {
  return (
    <section className="export-card export-card--configurator">
      <div className="export-card__header">
        <h3>Personnalisation</h3>
      </div>

      <div className="export-configurator">
        <div className="export-field">
          <label htmlFor="export-layer-select">Selectionnez votre zone</label>
          <select
            id="export-layer-select"
            value={selectedLayerKey}
            onChange={(event) => onLayerChange(event.target.value)}
          >
            {layerOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="export-field">
          <label htmlFor="export-search-input">Recherche precise</label>
          <input
            id="export-search-input"
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ex: Brazzaville, Djiri, Lekoumou"
          />
        </div>

        <div className="export-field">
          <label htmlFor="export-feature-select">Zone precise</label>
          <select
            id="export-feature-select"
            value={selectedFeatureName}
            onChange={(event) => onFeatureChange(event.target.value)}
          >
            <option value="">Toute la zone selectionnee</option>
            {featureOptions.map((featureName) => (
              <option key={featureName} value={featureName}>
                {featureName}
              </option>
            ))}
          </select>
        </div>

        <div className="export-field export-field--inline">
          <label htmlFor="export-label-toggle" className="checkbox-line">
            <input
              id="export-label-toggle"
              type="checkbox"
              checked={selectedLayer.labelEnabled}
              onChange={(event) => onLayerStyleChange(selectedLayerKey, 'labelEnabled', event.target.checked)}
            />
            Etiquettes visibles
          </label>
          <label htmlFor="export-opacity-slider" className="slider-line">
            <span>Opacite</span>
            <input
              id="export-opacity-slider"
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={selectedLayer.opacity}
              onChange={(event) => onLayerStyleChange(selectedLayerKey, 'opacity', Number(event.target.value))}
            />
            <strong>{Math.round(selectedLayer.opacity * 100)}%</strong>
          </label>
        </div>

        <div className="export-field export-field--inline">
          <label htmlFor="export-color-input">Couleur</label>
          <input
            id="export-color-input"
            type="color"
            value={selectedLayer.color}
            onChange={(event) => onLayerStyleChange(selectedLayerKey, 'color', event.target.value)}
            className="color-input"
          />
        </div>
      </div>
    </section>
  );
}

export default function MapExport() {
  const navigate = useNavigate();
  const exportRef = useRef(null);
  const chartRef = useRef(null);
  const mapRef = useRef(null);
  const [layers, setLayers] = useState(() => createInitialLayers());
  const [selectedLayerKey, setSelectedLayerKey] = useState('Departement_Congo');
  const [selectedFeatureName, setSelectedFeatureName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [mapView, setMapView] = useState({
    center: congoCenter,
    zoom: congoZoom,
    tileLayer: defaultTileLayer,
  });
  const [activeLayersData, setActiveLayersData] = useState([]);

  useEffect(() => {
    const loadGeoData = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const responses = await Promise.all(
          EXPORT_LAYER_CATALOG.map(async (layer) => {
            const response = await fetch(layer.filePath);
            if (!response.ok) {
              throw new Error(`Chargement impossible pour ${layer.name}`);
            }

            const data = await response.json();
            return [layer.key, data];
          })
        );

        const loadedData = Object.fromEntries(responses);

        setLayers((prev) => {
          const next = { ...prev };
          Object.entries(loadedData).forEach(([layerKey, data]) => {
            next[layerKey] = {
              ...next[layerKey],
              data,
            };
          });
          return next;
        });
      } catch (error) {
        setLoadError(error.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoData();
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('map-export-printing');
      setIsPrinting(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const selectedLayer = layers[selectedLayerKey] || layers.Departement_Congo;
  const selectedLayerData = selectedLayer?.data;
  const allFeatureNames = useMemo(
    () => sortFeaturesByName(selectedLayerData?.features || []).map((feature) => feature.properties?.name).filter(Boolean),
    [selectedLayerData]
  );

  const filteredFeatureNames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return allFeatureNames;
    }

    return allFeatureNames.filter((name) => name.toLowerCase().includes(normalizedSearch));
  }, [allFeatureNames, searchTerm]);

  useEffect(() => {
    if (selectedFeatureName && !filteredFeatureNames.includes(selectedFeatureName)) {
      setSelectedFeatureName('');
    }
  }, [filteredFeatureNames, selectedFeatureName]);

  const focusedFeatures = useMemo(() => {
    const features = selectedLayerData?.features || [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let nextFeatures = features;

    if (normalizedSearch) {
      nextFeatures = nextFeatures.filter((feature) =>
        String(feature?.properties?.name || '').toLowerCase().includes(normalizedSearch)
      );
    }

    if (selectedFeatureName) {
      nextFeatures = nextFeatures.filter((feature) => feature?.properties?.name === selectedFeatureName);
    }

    return nextFeatures;
  }, [searchTerm, selectedFeatureName, selectedLayerData]);

  const visibleLayers = useMemo(() => {
    if (!selectedLayerData) {
      return {};
    }

    const data = createFeatureCollection(selectedLayerData, focusedFeatures);

    return {
      [selectedLayerKey]: {
        ...selectedLayer,
        visible: true,
        data,
      },
    };
  }, [focusedFeatures, selectedLayer, selectedLayerData, selectedLayerKey]);

  const focusGeoJson = useMemo(() => {
    const layer = visibleLayers[selectedLayerKey];
    return layer?.data || null;
  }, [selectedLayerKey, visibleLayers]);

  const scopeName = selectedFeatureName || searchTerm || selectedLayer.scope;
  const featureCount = focusedFeatures.length;

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);
    }
  }, [focusGeoJson, mapView]);

  const handleLayerChange = (layerKey) => {
    setSelectedLayerKey(layerKey);
    setSelectedFeatureName('');
    setSearchTerm('');
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

  const exportAsImage = async () => {
    if (isExportingImage || !featureCount) {
      return;
    }

    setIsExportingImage(true);

    try {
      mapRef.current?.invalidateSize();
      await new Promise((resolve) => setTimeout(resolve, 350));
      const mapElement = exportRef.current?.querySelector('.export-card--map .map-view');
      const chartCanvas = chartRef.current?.querySelector('canvas') || null;
      await exportCompositionAsPng({
        fileName: `geonia-export-${selectedLayerKey.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`,
        legendLayers: visibleLayers,
        mapInstance: mapRef.current,
        mapElement,
        chartCanvas,
      });
    } catch (error) {
      alert(error.message || "Impossible d'exporter l'image pour le moment.");
    } finally {
      setIsExportingImage(false);
    }
  };

  const exportAsPdf = async () => {
    setIsPrinting(true);
    document.body.classList.add('map-export-printing');
    mapRef.current?.invalidateSize();
    await new Promise((resolve) => setTimeout(resolve, 250));
    window.print();
  };

  if (isLoading) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Chargement des donnees cartographiques...</h2>
          <p>La page de personnalisation se prepare.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Impossible d'ouvrir l'export</h2>
          <p>{loadError}</p>
          <button className="export-action export-action--primary" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-export-page${isPrinting ? ' map-export-page--busy' : ''}`}>
      <div className="map-export-toolbar">
        <div>
          <h1>Export cartographique autonome</h1>
          <p>Choisis une zone, affine precisement, puis laisse la carte se cadrer automatiquement.</p>
        </div>
        <div className="map-export-toolbar__actions">
          <button className="export-action" onClick={() => navigate('/map')}>
            Retour carte
          </button>
          <button className="export-action" onClick={exportAsImage} disabled={!featureCount || isExportingImage || isPrinting}>
            {isExportingImage ? 'Preparation image...' : 'Exporter image'}
          </button>
          <button className="export-action export-action--primary" onClick={exportAsPdf} disabled={!featureCount || isPrinting}>
            {isPrinting ? 'Preparation...' : 'Exporter PDF'}
          </button>
        </div>
      </div>

      <div className="map-export-sheet" ref={exportRef}>
        <header className="map-export-sheet__header">
          <div>
            <h2>Composition dynamique</h2>
            <p>Le cadrage suit la zone selectionnee comme une navigation guidee.</p>
          </div>
          <div className="map-export-sheet__meta">
            <span>{new Date().toLocaleString('fr-FR')}</span>
          </div>
        </header>

        <ExportConfigurator
          layerOptions={EXPORT_LAYER_CATALOG}
          selectedLayerKey={selectedLayerKey}
          selectedFeatureName={selectedFeatureName}
          searchTerm={searchTerm}
          featureOptions={filteredFeatureNames}
          selectedLayer={selectedLayer}
          onLayerChange={handleLayerChange}
          onFeatureChange={setSelectedFeatureName}
          onSearchChange={setSearchTerm}
          onLayerStyleChange={handleLayerStyleChange}
        />

        <ExportSummary
          scopeName={scopeName}
          layerName={selectedLayer.name}
          featureCount={featureCount}
        />

        <section className="map-export-grid">
          <div className="export-card export-card--map">
            <MapView
              key={`export-map-${selectedLayerKey}`}
              layers={visibleLayers}
              onFeatureClick={() => {}}
              updateActiveLayersData={setActiveLayersData}
              mapRef={mapRef}
              initialView={mapView}
              onViewChange={setMapView}
              focusGeoJson={focusGeoJson}
              showTileLayerSelector={true}
            />
          </div>

          <div className="map-export-side">
            <ExportLegend layers={visibleLayers} />
            <section className="export-card export-card--chart" ref={chartRef}>
              <div className="export-card__header">
                <h3>Lecture rapide</h3>
              </div>
              <ChartPanel layersData={activeLayersData} />
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
