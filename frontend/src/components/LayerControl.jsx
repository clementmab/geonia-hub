import React from 'react';
import './LayerControl.css';

const LayerControl = ({ layers, onToggle, onStyleChange }) => {
  const handleColorChange = (layerKey, color) => {
    onStyleChange(layerKey, 'color', color);
  };

  const handleOpacityChange = (layerKey, opacity) => {
    onStyleChange(layerKey, 'opacity', parseFloat(opacity));
  };

  return (
    <div className="layer-control">
      <h3>🗺️ Contrôle des Couches</h3>
      
      <div className="layers-list">
        {Object.keys(layers).map(layerKey => {
          const layer = layers[layerKey];
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
                      style={{ backgroundColor: layer.color }}
                    ></span>
                  </div>
                )}
              </div>
              
              {layer.visible && (
                <div className="layer-controls">
                  <div className="control-group">
                    <label>Couleur:</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) => handleColorChange(layerKey, e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={layer.color}
                        onChange={(e) => handleColorChange(layerKey, e.target.value)}
                        className="color-text"
                        placeholder="#FF6B6B"
                      />
                    </div>
                  </div>
                  
                  <div className="control-group">
                    <label>Opacité:</label>
                    <div className="opacity-control">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) => handleOpacityChange(layerKey, e.target.value)}
                        className="opacity-slider"
                      />
                      <span className="opacity-value">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="layer-legend">
        <h4>📍 Légende</h4>
        <div className="legend-items">
          {Object.keys(layers)
            .filter(layerKey => layers[layerKey].visible)
            .map(layerKey => {
              const layer = layers[layerKey];
              return (
                <div key={layerKey} className="legend-item">
                  <div 
                    className="legend-color"
                    style={{ backgroundColor: layer.color }}
                  ></div>
                  <span className="legend-text">{layer.name}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default LayerControl;
