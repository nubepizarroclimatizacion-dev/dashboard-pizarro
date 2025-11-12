// utils/formatters.ts

// Formateador para moneda (Pesos Argentinos por defecto)
export const formatCurrency = (value: number, currencyCode: 'ARS' | 'USD' = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Formateador para números, con opción compacta para ejes de gráficos
export const formatNumber = (value: number, compact: boolean = false): string => {
  const options: Intl.NumberFormatOptions = compact
    ? { notation: 'compact', compactDisplay: 'short' }
    : {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      };
  
  return new Intl.NumberFormat('es-ES', options).format(value);
};

// Formateador para fechas
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};