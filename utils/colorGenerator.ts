// utils/colorGenerator.ts
import { ColorMap } from '../types';

// A predefined list of visually distinct colors.
// An elegant and vibrant palette for data visualization.
const PREDEFINED_COLORS = [
  '#0284c7', // sky-600
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6d28d9', // violet-700
  '#475569', // slate-600
  '#db2777', // pink-600
  '#0ea5e9', // sky-500
  '#22c55e', // green-500
  '#8b5cf6', // violet-500
  '#38bdf8', // sky-400
  '#4ade80', // green-400
  '#a78bfa', // violet-400
];

/**
 * Generates or assigns colors to a list of names.
 * If a name already exists in the provided map, its color is preserved.
 * New names are assigned colors from a predefined list.
 * @param names - An array of strings (e.g., branch names, salesperson names).
 * @param existingMap - An existing map of names to colors to preserve continuity.
 * @returns A new ColorMap object.
 */
export const generateColorMap = (names: string[], existingMap: ColorMap = {}): ColorMap => {
  const newMap: ColorMap = { ...existingMap };
  const usedColors = new Set(Object.values(existingMap));
  let colorIndex = 0;

  names.forEach(name => {
    if (!newMap[name]) {
      // Find a color that's not already in use
      let nextColor = PREDEFINED_COLORS[colorIndex % PREDEFINED_COLORS.length];
      while (usedColors.has(nextColor) && colorIndex < PREDEFINED_COLORS.length * 2) {
          // Multiply by 2 to give a chance to cycle through colors if many are taken
          colorIndex++;
          nextColor = PREDEFINED_COLORS[colorIndex % PREDEFINED_COLORS.length];
      }
      
      newMap[name] = nextColor;
      usedColors.add(nextColor);
      colorIndex++;
    }
  });

  return newMap;
};
