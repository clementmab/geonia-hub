import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ChartPanel from '../components/ChartPanel';
import MapView from '../components/MapView';
import { buildLayerSymbology } from '../utils/symbology';
import './MapExport.css';

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

export default function MapExport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);
  const mapRef = useRef(null);

  const exportId = searchParams.get('id');

  useEffect(() => {
    if (!exportId) {
      return;
    }

    const raw = sessionStorage.getItem(exportId);
    if (!raw) {
      return;
    }

    try {
      setPayload(JSON.parse(raw));
    } catch (error) {
      console.error("Impossible de lire l'etat d'export:", error);
    }
  }, [exportId]);

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('map-export-printing');
      setIsExporting(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const visibleLayers = useMemo(() => {
    if (!payload?.layers) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(payload.layers).filter(([, layer]) => layer.visible && layer.data)
    );
  }, [payload]);

  const exportAsPng = async () => {
    if (!exportRef.current || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      mapRef.current?.invalidateSize();
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
      console.error("Erreur export PNG:", error);
      alert("Impossible d'exporter en PNG pour le moment.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPdf = async () => {
    setIsExporting(true);
    document.body.classList.add('map-export-printing');
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.print();
  };

  if (!payload || !Object.keys(visibleLayers).length) {
    return (
      <div className="map-export-page map-export-page--empty">
        <div className="export-card export-empty">
          <h2>Aucune composition a exporter</h2>
          <p>Retourne sur la carte, active tes couches et relance l'export.</p>
          <button className="export-action export-action--primary" onClick={() => navigate('/map')}>
            Retour a la carte
          </button>
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
            <p>Composition generee depuis GeoNia Data Hub</p>
          </div>
          <div className="map-export-sheet__meta">
            <span>{new Date(payload.createdAt || Date.now()).toLocaleString('fr-FR')}</span>
          </div>
        </header>

        <ExportSummary layers={visibleLayers} />

        <section className="map-export-grid">
          <div className="export-card export-card--map">
            <MapView
              layers={visibleLayers}
              onFeatureClick={() => {}}
              updateActiveLayersData={() => {}}
              mapRef={mapRef}
              showTileLayerSelector={false}
            />
          </div>

          <div className="map-export-side">
            <ExportLegend layers={visibleLayers} />
            <section className="export-card">
              <div className="export-card__header">
                <h3>Diagrammes</h3>
              </div>
              <ChartPanel layersData={payload.activeLayersData || []} />
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
