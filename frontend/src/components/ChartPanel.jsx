import React, { useEffect, useRef, useState } from 'react';
import './ChartPanel.css';

const ChartPanel = ({ layersData, layers }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('pop');
  const chartRef = useRef(null);

  // Préparer les données pour D3
  const prepareChartData = () => {
    const aggregatedData = {};
    
    layersData.forEach(item => {
      const layerName = item.layerName;
      if (!aggregatedData[layerName]) {
        aggregatedData[layerName] = {
          totalPop: 0,
          totalArea: 0,
          count: 0
        };
      }
      
      aggregatedData[layerName].totalPop += item.pop || 0;
      aggregatedData[layerName].totalArea += item.area || 0;
      aggregatedData[layerName].count += 1;
    });

    return Object.keys(aggregatedData).map(layerName => ({
      layerName,
      value: dataType === 'pop' ? aggregatedData[layerName].totalPop : aggregatedData[layerName].totalArea,
      count: aggregatedData[layerName].count,
      color: Object.keys(layers).find(key => layers[key].name === layerName)?.color || '#999'
    }));
  };

  useEffect(() => {
    if (!chartRef.current || layersData.length === 0) return;

    // Nettoyer le graphique précédent
    const svg = chartRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const data = prepareChartData();
    if (data.length === 0) return;

    // Dimensions du graphique
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = svg.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Créer le groupe principal
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);

    // Échelles
    const maxValue = Math.max(...data.map(d => d.value));
    const xScale = (index) => (index * width) / data.length;
    const yScale = (value) => height - (value * height) / maxValue;

    if (chartType === 'bar') {
      // Graphique en barres
      data.forEach((d, i) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', xScale(i) + 10);
        rect.setAttribute('y', yScale(d.value));
        rect.setAttribute('width', (width / data.length) - 20);
        rect.setAttribute('height', height - yScale(d.value));
        rect.setAttribute('fill', d.color);
        rect.setAttribute('class', 'chart-bar');
        
        // Tooltip au survol
        rect.addEventListener('mouseenter', (e) => {
          rect.setAttribute('opacity', '0.8');
          showTooltip(e, d);
        });
        rect.addEventListener('mouseleave', () => {
          rect.setAttribute('opacity', '1');
          hideTooltip();
        });
        
        g.appendChild(rect);
      });
    } else {
      // Graphique en secteurs (pie chart)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;
      
      let currentAngle = 0;
      const total = data.reduce((sum, d) => sum + d.value, 0);
      
      data.forEach((item, i) => {
        const percentage = item.value / total;
        const angle = percentage * 2 * Math.PI;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const largeArc = angle > Math.PI ? 1 : 0;
        
        const x1 = centerX + radius * Math.cos(currentAngle - Math.PI / 2);
        const y1 = centerY + radius * Math.sin(currentAngle - Math.PI / 2);
        const x2 = centerX + radius * Math.cos(currentAngle + angle - Math.PI / 2);
        const y2 = centerY + radius * Math.sin(currentAngle + angle - Math.PI / 2);
        
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        path.setAttribute('d', pathData);
        path.setAttribute('fill', item.color);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'chart-slice');
        
        path.addEventListener('mouseenter', (e) => {
          path.setAttribute('opacity', '0.8');
          showTooltip(e, item);
        });
        path.addEventListener('mouseleave', () => {
          path.setAttribute('opacity', '1');
          hideTooltip();
        });
        
        g.appendChild(path);
        currentAngle += angle;
      });
    }

    // Axes
    if (chartType === 'bar') {
      // Axe Y
      const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      yAxis.setAttribute('x1', 0);
      yAxis.setAttribute('y1', 0);
      yAxis.setAttribute('x2', 0);
      yAxis.setAttribute('y2', height);
      yAxis.setAttribute('stroke', '#666');
      yAxis.setAttribute('stroke-width', '1');
      g.appendChild(yAxis);

      // Labels Y
      for (let i = 0; i <= 5; i++) {
        const value = (maxValue * i) / 5;
        const y = height - (i * height) / 5;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', -10);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-size', '12px');
        text.setAttribute('fill', '#666');
        text.textContent = formatValue(value, dataType);
        g.appendChild(text);
      }

      // Labels X
      data.forEach((d, i) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', xScale(i) + (width / data.length) / 2);
        text.setAttribute('y', height + 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11px');
        text.setAttribute('fill', '#666');
        text.textContent = d.layerName.length > 15 ? d.layerName.substring(0, 12) + '...' : d.layerName;
        g.appendChild(text);
      });
    }
  }, [layersData, chartType, dataType, layers, prepareChartData, showTooltip, hideTooltip]);

  const formatValue = (value, type) => {
    if (type === 'pop') {
      return value.toLocaleString();
    } else {
      return `${value.toFixed(1)} km²`;
    }
  };

  const showTooltip = (event, data) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <strong>${data.layerName}</strong><br>
      ${dataType === 'pop' ? 'Population' : 'Surface'}: ${formatValue(data.value, dataType)}<br>
      Entités: ${data.count}
    `;
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
  };

  const hideTooltip = () => {
    const tooltip = document.querySelector('.chart-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  };

  return (
    <div className="chart-panel">
      <h3>📊 Visualisation Statistique</h3>
      
      <div className="chart-controls">
        <div className="control-group">
          <label>Type de graphique:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
            className="chart-select"
          >
            <option value="bar">Barres</option>
            <option value="pie">Secteurs</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Données:</label>
          <select 
            value={dataType} 
            onChange={(e) => setDataType(e.target.value)}
            className="chart-select"
          >
            <option value="pop">Population</option>
            <option value="area">Surface</option>
          </select>
        </div>
      </div>
      
      <div className="chart-container">
        <svg 
          ref={chartRef} 
          width="100%" 
          height="250"
          className="chart-svg"
        ></svg>
      </div>
      
      <div className="chart-summary">
        <h4>📈 Résumé</h4>
        {prepareChartData().map((item, index) => (
          <div key={index} className="summary-item">
            <div 
              className="summary-color" 
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="summary-info">
              <span className="summary-name">{item.layerName}</span>
              <span className="summary-value">
                {formatValue(item.value, dataType)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartPanel;
