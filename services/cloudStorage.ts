// services/cloudStorage.ts

/**
 * MOCK CLOUD STORAGE SERVICE
 * --------------------------
 * This service simulates a cloud storage backend (like Google Cloud Storage or AWS S3)
 * by using the browser's `localStorage`. In a real-world application, the functions
 * in this file would be replaced with secure HTTP calls to a dedicated backend server.
 *
 * This backend server would handle:
 * 1. Authentication & Authorization: Verifying the user has permission to access data.
 * 2. Secure Credential Management: Storing and using cloud provider API keys securely.
 * 3. Interaction with Cloud Storage: Reading and writing files from/to a cloud bucket.
 *
 * This simulation allows the frontend architecture to be prepared for a real backend
 * integration without exposing any sensitive information on the client-side.
 */

// Define the keys for different data types.
type DataKey = 'sales' | 'purchases' | 'expenses' | 'hr' | 'stock';
const DATA_KEYS: DataKey[] = ['sales', 'purchases', 'expenses', 'hr', 'stock'];
const STORAGE_PREFIX = 'pizarro_cloud_data_';

/**
 * Saves or updates a specific dataset in the simulated cloud storage.
 * @param key - The identifier for the dataset (e.g., 'sales').
 * @param data - The array of records to save.
 */
export const saveData = async (key: DataKey, data: any[]): Promise<void> => {
  return new Promise((resolve) => {
    try {
      // In a real implementation, this would be an API call:
      // await fetch('/api/save-data', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' },
      //   body: JSON.stringify({ key, data })
      // });
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
      console.log(`[Cloud Mock] Saved data for key: ${key}`);
      resolve();
    } catch (error) {
      console.error(`[Cloud Mock] Error saving data for key ${key}:`, error);
      // In a real implementation, you'd handle API errors gracefully.
      // For this mock, we'll just log and continue.
      resolve(); 
    }
  });
};

/**
 * Loads all datasets from the simulated cloud storage.
 * @returns An object containing all available datasets.
 */
export const loadAllData = async (): Promise<{ [key in DataKey]?: any[] }> => {
    return new Promise((resolve) => {
        try {
            // In a real implementation, this would be a single API call to get all user data:
            // const response = await fetch('/api/load-all-data', { headers: { 'Authorization': 'Bearer <token>' } });
            // const allData = await response.json();
            // resolve(allData);

            const result: { [key in DataKey]?: any[] } = {};

            DATA_KEYS.forEach(key => {
                const storedData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
                if (storedData) {
                    result[key] = JSON.parse(storedData);
                }
            });
            
            console.log("[Cloud Mock] Loaded all data from localStorage.", result);
            resolve(result);

        } catch (error) {
            console.error("[Cloud Mock] Error loading all data:", error);
            // Return an empty object on failure to prevent app crash.
            resolve({});
        }
    });
};