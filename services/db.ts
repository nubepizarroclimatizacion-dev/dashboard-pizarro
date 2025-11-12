
// services/db.ts

const DB_NAME = 'PizarroDB';
const DB_VERSION = 1;
// The object stores for each type of data
const OBJECT_STORES: DataKey[] = ['sales', 'purchases', 'expenses', 'hr', 'stock'];

type DataKey = 'sales' | 'purchases' | 'expenses' | 'hr' | 'stock';

// A promise that resolves with the database connection
let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject("Error opening IndexedDB.");
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      OBJECT_STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { autoIncrement: true });
        }
      });
    };
  });
  return dbPromise;
};

/**
 * Saves or updates a specific dataset in IndexedDB.
 * It clears the existing data in the store and then adds the new data.
 * @param key - The identifier for the dataset (e.g., 'sales').
 * @param data - The array of records to save.
 */
export const saveData = async (key: DataKey, data: any[]): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(key, 'readwrite');
    const store = transaction.objectStore(key);
    
    // Clear old data first
    store.clear();
    
    // Add new data records
    data.forEach(item => {
        store.add(item);
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error("Transaction error:", transaction.error);
      reject(`Error saving data to ${key}`);
    };
  });
};

/**
 * Loads all datasets from all object stores in IndexedDB.
 * @returns An object containing all available datasets.
 */
export const loadAllData = async (): Promise<{ [key in DataKey]?: any[] }> => {
    const db = await openDatabase();
    const result: { [key in DataKey]?: any[] } = {};

    const loadStore = (storeName: DataKey): Promise<void> => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                result[storeName] = request.result;
                resolve();
            };
            request.onerror = () => {
                console.error(`Error loading data from ${storeName}:`, request.error);
                reject(`Error loading ${storeName}`);
            };
        });
    };

    // Use Promise.all to fetch data from all stores concurrently
    await Promise.all(OBJECT_STORES.map(store => loadStore(store)));
    
    return result;
};
