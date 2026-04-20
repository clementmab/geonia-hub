import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './ChartPanel.css';

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ChartPanel = ({ layersData, layers }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('pop');
  const [labelType, setLabelType] = useState('name');

  // Préparer les données pour Chart.js - afficher les entités individuelles
  const prepareChartData = useCallback(() => {
    if (layersData.length === 0) return { labels: [], datasets: [] };
    
    const processedData = layersData.map((item, index) => {
      let value;
      
      if (dataType === 'pop') {
        value = item.pop || 0;
      } else if (dataType === 'area') {
        value = item.area || 0;
      } else if (dataType === 'density') {
        value = item.density || 0;
      }
      
      // Déterminer l'étiquette selon le choix de l'utilisateur
      let displayLabel;
      if (labelType === 'name') {
        displayLabel = item.name || `Entité ${index + 1}`;
      } else if (labelType === 'area') {
        displayLabel = `${(item.area || 0).toFixed(1)} km²`;
      } else if (labelType === 'pop') {
        displayLabel = `${(item.pop || 0).toLocaleString()} hab.`;
      }
      
      return {
        label: displayLabel,
        value: value || 0,
        originalName: item.name,
        layerName: item.layerName,
        pop: item.pop || 0,
        area: item.area || 0,
        density: item.density || 0
      };
    }).filter(item => item.value > 0); // Filtrer les valeurs nulles

    // Créer des couleurs par catégorie (pas par couche)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#FD79A8', '#A29BFE', '#6C5CE7', '#00B894', '#00CEC9',
      '#0984E3', '#6C5CE7', '#FDCB6E', '#E17055', '#74B9FF'
    ];

    const labels = processedData.map(item => item.label);
    const dataValues = processedData.map(item => item.value);
    const backgroundColors = processedData.map((_, index) => colors[index % colors.length]);

    return {
      labels,
      datasets: [{
        label: getDataLabel(),
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1
      }]
    };
  }, [layersData, dataType, labelType]);

  const getDataLabel = () => {
    switch (dataType) {
      case 'pop': return 'Population';
      case 'area': return 'Surface (km²)';
      case 'density': return 'Densité (hab/km²)';
      default: return 'Valeur';
    }
  };

  // Options pour Chart.js
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
          afterLabel: function(context) {
            const index = context.dataIndex;
            const item = layersData.filter(item => {
              let displayLabel;
              if (labelType === 'name') {
                displayLabel = item.name;
              } else if (labelType === 'area') {
                displayLabel = `${(item.area || 0).toFixed(1)} km²`;
              } else if (labelType === 'pop') {
                displayLabel = `${(item.pop || 0).toLocaleString()} hab.`;
              }
              return displayLabel === context.label;
            })[0];
            
            if (item) {
              return [
                `Couche: ${item.layerName}`,
                `Population: ${(item.pop || 0).toLocaleString()} hab.`,
                `Surface: ${(item.area || 0).toFixed(1)} km²`,
                `Densité: ${(item.density || 0).toFixed(1)} hab/km²`
              ];
            }
            return [];
          }
      }
    }
  };

  const chartData = prepareChartData();

  return (
    <div className="chart-panel">
      <h3>📊 Visualisation Statistique</h3>
      
      <div className="chart-controls">
        <div className="control-group">
          <label>Type de graphique:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="bar">Barres</option>
            <option value="pie">Secteurs</option>
          </select>
        </div>
        <div className="control-group">
          <label>Type de données:</label>
          <select 
            value={dataType} 
            onChange={(e) => setDataType(e.target.value)}
          >
            <option value="pop">Population</option>
            <option value="area">Surface</option>
            <option value="density">Densité</option>
          </select>
        </div>
        <div className="control-group">
          <label>Étiquettes:</label>
          <select 
            value={labelType} 
            onChange={(e) => setLabelType(e.target.value)}
          >
            <option value="name">Nom de l'entité</option>
            <option value="area">Superficie</option>
            <option value="pop">Population</option>
          </select>
        </div>
      </div>
      
      <div className="chart-container">
        {chartData.labels.length > 0 ? (
          <div style={{ height: '250px' }}>
            {chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Pie data={chartData} options={chartOptions} />
            )}
          </div>
        ) : (
          <div className="no-data">
            <p>Aucune donnée à afficher</p>
            <p>Veuillez sélectionner une couche sur la carte</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPanel;
