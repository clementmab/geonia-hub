import React, { useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './ChartPanel.css';

// Enregistrement des composants
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ChartPanel = ({ layersData = [] }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('pop');
  const [labelType, setLabelType] = useState('name');

  // Préparer les données pour Chart.js - afficher les entités individuelles
  const prepareChartData = useCallback(() => {
    // Label du dataset (déplacé ici pour éviter les dépendances externes)
    const getDataLabel = () => {
      switch (dataType) {
        case 'pop': return 'Population';
        case 'area': return 'Surface (km²)';
        case 'density': return 'Densité (hab/km²)';
        default: return 'Valeur';
      }
    };

    if (!layersData.length) return { labels: [], datasets: [] };

    const processed = layersData
      .map((item, i) => {
        const pop = item.pop || 0;
        const area = item.area || 0;
        const density = area > 0 ? pop / area : 0;

        let value =
          dataType === 'pop' ? pop :
          dataType === 'area' ? area :
          density;

        let label =
          labelType === 'name' ? item.name :
          labelType === 'area' ? `${area.toFixed(1)} km²` :
          `${pop.toLocaleString()} hab`;

        return {
          label: label || `Entité ${i + 1}`,
          value,
          pop,
          area,
          density,
          layerName: item.layerName || 'N/A'
        };
      })
      .filter(d => d.value > 0);

    const colors = [
      '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
      '#FD79A8','#A29BFE','#6C5CE7','#00B894','#00CEC9'
    ];

    return {
      labels: processed.map(d => d.label),
      datasets: [
        {
          label: getDataLabel(),
          data: processed.map(d => d.value),
          backgroundColor: processed.map((_, i) => colors[i % colors.length]),
          borderWidth: 1
        }
      ]
    };
  }, [layersData, dataType, labelType]);

  const chartData = prepareChartData();

  // 🔧 Options corrigées
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-panel">
      <h3>📊 Visualisation Statistique</h3>

      <div className="chart-controls">
        <div className="control-group">
          <label>Type:</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="bar">Barres</option>
            <option value="pie">Camembert</option>
          </select>
        </div>

        <div className="control-group">
          <label>Donnée:</label>
          <select value={dataType} onChange={e => setDataType(e.target.value)}>
            <option value="pop">Population</option>
            <option value="area">Surface</option>
            <option value="density">Densité</option>
          </select>
        </div>

        <div className="control-group">
          <label>Étiquette:</label>
          <select value={labelType} onChange={e => setLabelType(e.target.value)}>
            <option value="name">Nom</option>
            <option value="area">Surface</option>
            <option value="pop">Population</option>
          </select>
        </div>
      </div>

      <div className="chart-container" style={{ height: 250 }}>
        {chartData.labels.length ? (
          chartType === 'bar' ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Pie data={chartData} options={chartOptions} />
          )
        ) : (
          <div className="no-data">
            <p>Aucune donnée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPanel;