// GeoniA Design System
// Palettes de couleurs et styles constants

export const COLORS = {
  // Primaires
  green: '#0F6E56',
  darkBlue: '#0C447C',
  orange: '#EF9F27',
  
  // Secondaires
  lightGreen: '#E1F5EE',
  lightBlue: '#E6F1FB',
  lightOrange: '#FAEEDA',
  lightRed: '#FCEBEB',
  lightPurple: '#EEEDFE',
  lightGray: '#F1EFE8',
  
  // Neutres
  darkText: '#263238',
  mediumText: '#555',
  lightText: '#888',
  lightestText: '#aaa',
  border: '#e0e0e0',
  background: '#f5f5f5',
  white: '#fff',
  
  // Texte accent
  accentGreen: '#D4E8E0',
  darkGreen: '#085041',
  darkOrange: '#412402',
};

export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.darkBlue} 100%)`,
  primaryToOrange: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.darkBlue} 50%, #1a3a52 100%)`,
  lightGreen: `linear-gradient(135deg, ${COLORS.lightGreen} 0%, ${COLORS.lightBlue} 100%)`,
  background: 'linear-gradient(135deg, #f5f9fc 0%, #f0f7fa 100%)',
};

export const SHADOWS = {
  sm: '0 2px 6px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(0,0,0,0.1)',
  lg: '0 8px 20px rgba(15, 110, 86, 0.15)',
  xl: '0 12px 32px rgba(0,0,0,0.15)',
};

export const FORMAT_COLORS = {
  shp: { bg: '#E1F5EE', text: '#085041' },
  geojson: { bg: '#E6F1FB', text: '#0C447C' },
  tif: { bg: '#FAEEDA', text: '#633806' },
  pdf: { bg: '#FCEBEB', text: '#791F1F' },
  gpkg: { bg: '#EEEDFE', text: '#3C3489' },
  zip: { bg: '#F1EFE8', text: '#444441' },
};

export const TRANSITIONS = {
  fast: 'all 0.15s ease',
  normal: 'all 0.3s ease',
  slow: 'all 0.5s ease',
};
