// services/api.ts

/**
 * SIMULATED BACKEND API SERVICE
 * -----------------------------
 * This service mimics network calls to a real backend server.
 * It uses `localStorage` as a mock database and `setTimeout` to simulate network latency.
 *
 * In a real-world application, the `localStorage` logic would be replaced with
 * `fetch` calls to your backend endpoints (e.g., `fetch('/api/data/sales')`).
 * This architecture allows the frontend to be developed independently and makes
 * it easy to integrate with a real backend later.
 */

type DataKey = 'sales' | 'purchases' | 'expenses' | 'hr' | 'stock';
const DATA_KEYS: DataKey[] = ['sales', 'purchases', 'expenses', 'hr', 'stock'];
const STORAGE_PREFIX = 'pizarro_cloud_data_';
const API_LATENCY = 500; // ms

/**
 * Saves or updates a specific dataset via a simulated API call.
 * @param key - The identifier for the dataset (e.g., 'sales').
 * @param data - The array of records to save.
 */
export const saveData = async (key: DataKey, data: any[]): Promise<void> => {
  console.log(`[API Mock] POST /api/data/${key} with ${data.length} records.`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // This is where the actual `fetch` call would go in a real app.
        // For now, we simulate by writing to localStorage.
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
        console.log(`[API Mock] Successfully saved data for key: ${key}`);
        resolve();
      } catch (error) {
        console.error(`[API Mock] Error saving data for key ${key}:`, error);
        // In a real implementation, you'd handle API errors gracefully.
        // We resolve anyway to not block the UI in this simulation.
        resolve();
      }
    }, API_LATENCY);
  });
};

/**
 * Loads all datasets from the simulated backend API.
 * @returns An object containing all available datasets.
 */
export const loadAllData = async (): Promise<{ [key in DataKey]?: any[] }> => {
  console.log('[API Mock] GET /api/data/all');
  
  return new Promise((resolve) => {
    setTimeout(() => {
        try {
            // This is where the `fetch('/api/data/all')` call would go.
            const result: { [key in DataKey]?: any[] } = {};

            DATA_KEYS.forEach(key => {
                const storedData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
                if (storedData) {
                    result[key] = JSON.parse(storedData);
                }
            });
            
            console.log("[API Mock] Successfully loaded all data.", result);
            resolve(result);

        } catch (error) {
            console.error("[API Mock] Error loading all data:", error);
            // Return an empty object on failure to prevent app crash.
            resolve({});
        }
    }, API_LATENCY);
  });
};