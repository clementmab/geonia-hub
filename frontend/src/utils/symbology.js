const CATEGORIZED_PALETTE = [
  '#e76f51',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#457b9d',
  '#6d597a',
  '#8ecae6',
  '#ffafcc',
  '#90be6d',
  '#b56576',
];

const GRADUATED_PALETTE = ['#dceaf7', '#b2d4f0', '#7bb8e6', '#4098d7', '#1769aa'];

const DEFAULT_STYLE_MODE = 'single';
const DEFAULT_STYLE_FIELD = 'name';

function normalizeValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
}

function getFeatures(layer) {
  return layer?.data?.features ?? [];
}

function getPropertiesSample(layer) {
  const feature = getFeatures(layer).find((item) => item?.properties);
  return feature?.properties ?? {};
}

export function getLayerFields(layer) {
  const properties = getPropertiesSample(layer);
  const keys = Object.keys(properties).filter((key) => {
    const value = properties[key];
    return typeof value !== 'object' && typeof value !== 'function';
  });

  const numericFields = keys.filter((key) => {
    const value = properties[key];
    return typeof value === 'number' && Number.isFinite(value);
  });

  return {
    allFields: keys,
    numericFields,
  };
}

function pickValidField(layer, mode) {
  const { allFields, numericFields } = getLayerFields(layer);
  const configuredField = layer?.styleField;

  if (mode === 'graduated') {
    if (numericFields.includes(configuredField)) {
      return configuredField;
    }

    if (numericFields.includes('pop')) {
      return 'pop';
    }

    if (numericFields.includes('area')) {
      return 'area';
    }

    return numericFields[0] ?? null;
  }

  if (allFields.includes(configuredField)) {
    return configuredField;
  }

  if (allFields.includes(DEFAULT_STYLE_FIELD)) {
    return DEFAULT_STYLE_FIELD;
  }

  return allFields[0] ?? null;
}

function buildCategorizedStops(layer, field) {
  const values = [];
  const seen = new Set();

  getFeatures(layer).forEach((feature) => {
    const raw = feature?.properties?.[field];
    const key = normalizeValue(raw);

    if (!seen.has(key)) {
      seen.add(key);
      values.push(key);
    }
  });

  return values.map((value, index) => ({
    value,
    color: CATEGORIZED_PALETTE[index % CATEGORIZED_PALETTE.length],
  }));
}

function buildGraduatedStops(layer, field) {
  const numericValues = getFeatures(layer)
    .map((feature) => Number(feature?.properties?.[field]))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!numericValues.length) {
    return [];
  }

  const min = numericValues[0];
  const max = numericValues[numericValues.length - 1];

  if (min === max) {
    return [{
      min,
      max,
      color: GRADUATED_PALETTE[GRADUATED_PALETTE.length - 1],
    }];
  }

  const steps = GRADUATED_PALETTE.length;
  const interval = (max - min) / steps;

  return GRADUATED_PALETTE.map((color, index) => {
    const lower = min + interval * index;
    const upper = index === steps - 1 ? max : min + interval * (index + 1);

    return {
      min: index === 0 ? min : lower,
      max: upper,
      color,
    };
  });
}

function formatLegendValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return normalizeValue(value);
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }

  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export function buildLayerSymbology(layer) {
  const mode = layer?.styleMode ?? DEFAULT_STYLE_MODE;
  const field = pickValidField(layer, mode);
  const opacity = layer?.opacity ?? 0.7;
  const baseStyle = {
    weight: 2,
    opacity: 1,
    color: 'white',
    fillOpacity: opacity,
  };

  if (mode === 'categorized' && field) {
    const stops = buildCategorizedStops(layer, field);
    const colorByValue = new Map(stops.map((stop) => [stop.value, stop.color]));

    return {
      mode,
      field,
      legendItems: stops.map((stop) => ({
        label: stop.value,
        color: stop.color,
      })),
      getFeatureStyle: (feature) => ({
        ...baseStyle,
        fillColor: colorByValue.get(normalizeValue(feature?.properties?.[field])) ?? layer.color,
      }),
    };
  }

  if (mode === 'graduated' && field) {
    const stops = buildGraduatedStops(layer, field);

    return {
      mode,
      field,
      legendItems: stops.map((stop) => ({
        label: `${formatLegendValue(stop.min)} - ${formatLegendValue(stop.max)}`,
        color: stop.color,
      })),
      getFeatureStyle: (feature) => {
        const rawValue = Number(feature?.properties?.[field]);
        const matchedStop = stops.find((stop, index) => {
          if (index === stops.length - 1) {
            return rawValue >= stop.min && rawValue <= stop.max;
          }

          return rawValue >= stop.min && rawValue < stop.max;
        });

        return {
          ...baseStyle,
          fillColor: matchedStop?.color ?? layer.color,
        };
      },
    };
  }

  return {
    mode: DEFAULT_STYLE_MODE,
    field: null,
    legendItems: [
      {
        label: layer?.name ?? 'Couche',
        color: layer?.color ?? '#45B7D1',
      },
    ],
    getFeatureStyle: () => ({
      ...baseStyle,
      fillColor: layer?.color ?? '#45B7D1',
    }),
  };
}
