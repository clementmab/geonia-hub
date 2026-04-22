import React from 'react';
import { buildLayerSymbology, getLayerFields } from '../utils/symbology';
import './LayerControl.css';

const STYLE_MODE_OPTIONS = [
  { value: 'single', label: 'Couleur unique' },
  { value: 'categorized', label: 'Categorisation' },
  { value: 'graduated', label: 'Graduation' },
];

const LayerControl = ({ layers, onToggle, onStyleChange }) => {
  const handleColorChange = (layerKey, color) => {
    onStyleChange(layerKey, 'color', color);
  };

  const handleOpacityChange = (layerKey, opacity) => {
    onStyleChange(layerKey, 'opacity', parseFloat(opacity));
  };

  const handleModeChange = (layerKey, layer, nextMode) => {
    const { allFields, numericFields } = getLayerFields(layer);
    const nextField =
      nextMode === 'graduated'
        ? (numericFields.includes('pop') && 'pop') || (numericFields.includes('area') && 'area') || numericFields[0] || ''
        : (allFields.includes('name') && 'name') || allFields[0] || '';

    onStyleChange(layerKey, 'styleMode', nextMode);
    if (nextField) {
      onStyleChange(layerKey, 'styleField', nextField);
    }
  };

  const handleLabelToggle = (layerKey, enabled) => {
    onStyleChange(layerKey, 'labelEnabled', enabled);
  };

  return (
    <div className="layer-control">
      <h3>Controle des couches</h3>

      <div className="layers-list">
        {Object.keys(layers).map((layerKey) => {
          const layer = layers[layerKey];
          const symbology = buildLayerSymbology(layer);
          const { allFields, numericFields } = getLayerFields(layer);
          const availableFields = layer.styleMode === 'graduated' ? numericFields : allFields;

          return (
            <div key={layerKey} className="layer-item">
              <div className="layer-header">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => onToggle(layerKey)}
                  />
                  <span className="checkmark"></span>
                  <span className="layer-name">{layer.name}</span>
                </label>

                {layer.visible && (
                  <div className="layer-status">
                    <span
                      className="color-indicator"
                      style={{ backgroundColor: symbology.legendItems[0]?.color || layer.color }}
                    ></span>
                  </div>
                )}
              </div>

              {layer.visible && (
                <div className="layer-controls">
                  <div className="control-group">
                    <label>Mode de symbologie</label>
                    <select
                      value={layer.styleMode || 'single'}
                      onChange={(event) => handleModeChange(layerKey, layer, event.target.value)}
                      className="style-select"
                    >
                      {STYLE_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {layer.styleMode !== 'single' && (
                    <div className="control-group">
                      <label>Champ</label>
                      <select
                        value={symbology.field || ''}
                        onChange={(event) => onStyleChange(layerKey, 'styleField', event.target.value)}
                        className="style-select"
                      >
                        {availableFields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="control-group">
                    <label className="inline-checkbox">
                      <input
                        type="checkbox"
                        checked={Boolean(layer.labelEnabled)}
                        onChange={(event) => handleLabelToggle(layerKey, event.target.checked)}
                      />
                      <span>Afficher les etiquettes</span>
                    </label>
                  </div>

                  {layer.labelEnabled && allFields.length > 0 && (
                    <div className="control-group">
                      <label>Champ d etiquette</label>
                      <select
                        value={layer.labelField || 'name'}
                        onChange={(event) => onStyleChange(layerKey, 'labelField', event.target.value)}
                        className="style-select"
                      >
                        {allFields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {layer.styleMode === 'single' && (
                    <div className="control-group">
                      <label>Couleur</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={layer.color}
                          onChange={(event) => handleColorChange(layerKey, event.target.value)}
                          className="color-input"
                        />
                        <input
                          type="text"
                          value={layer.color}
                          onChange={(event) => handleColorChange(layerKey, event.target.value)}
                          className="color-text"
                          placeholder="#45B7D1"
                        />
                      </div>
                    </div>
                  )}

                  <div className="control-group">
                    <label>Opacite</label>
                    <div className="opacity-control">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(event) => handleOpacityChange(layerKey, event.target.value)}
                        className="opacity-slider"
                      />
                      <span className="opacity-value">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>

                  {symbology.legendItems.length > 0 && (
                    <div className="mini-legend">
                      {symbology.legendItems.slice(0, 8).map((item) => (
                        <div key={`${layerKey}-${item.label}`} className="legend-item">
                          <div
                            className="legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="legend-text">{item.label}</span>
                        </div>
                      ))}
                      {symbology.legendItems.length > 8 && (
                        <div className="legend-more">+ {symbology.legendItems.length - 8} autres classes</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerControl;
