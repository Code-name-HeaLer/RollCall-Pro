import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from '../data/types'; // Assuming types are defined here

// Current app data version - increment when making breaking changes to data structure
export const APP_DATA_VERSION = 1;

// Key for storing app data in AsyncStorage
const APP_DATA_KEY = 'appData';
const APP_DATA_VERSION_KEY = 'appDataVersion';

/**
 * Load app data from AsyncStorage with version checking
 */
export const loadAppData = async (): Promise<AppData | null> => {
  try {
    // Check stored data version
    const storedVersion = await AsyncStorage.getItem(APP_DATA_VERSION_KEY);
    const dataVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
    
    // Get stored data
    const jsonValue = await AsyncStorage.getItem(APP_DATA_KEY);
    
    if (!jsonValue) {
      console.log('No app data found in storage');
      return null;
    }
    
    // Parse stored data
    const parsedData: AppData = JSON.parse(jsonValue, (key, value) => {
      // Convert date strings back to Date objects for assignments
      if (key === 'dueDate' && value) {
        return new Date(value);
      }
      return value;
    });
    
    // Handle version mismatch
    if (dataVersion < APP_DATA_VERSION) {
      console.log(`Data upgrade needed: v${dataVersion} -> v${APP_DATA_VERSION}`);
      // Here you would add migration code for each version upgrade
      
      // After migration, update stored version
      await AsyncStorage.setItem(APP_DATA_VERSION_KEY, APP_DATA_VERSION.toString());
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading app data:', error);
    // Provide more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

/**
 * Save app data to AsyncStorage with error handling and version tracking
 */
export const saveAppData = async (data: AppData): Promise<boolean> => {
  try {
    // Serialize data, handling Date objects
    const jsonValue = JSON.stringify(data);
    
    // Save data and version in parallel
    await Promise.all([
      AsyncStorage.setItem(APP_DATA_KEY, jsonValue),
      AsyncStorage.setItem(APP_DATA_VERSION_KEY, APP_DATA_VERSION.toString())
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving app data:', error);
    // Provide more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    
    // Check if error is related to storage capacity
    if (error instanceof Error && error.message.includes('storage')) {
      // Get the jsonValue from the current scope
      const jsonValue = JSON.stringify(data);
      console.error('Possible storage capacity issue. Data size:', jsonValue.length);
    }
    
    return false;
  }
};

/**
 * Clear all app data from storage (for debugging/testing)
 */
export const clearAppData = async (): Promise<boolean> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(APP_DATA_KEY),
      AsyncStorage.removeItem(APP_DATA_VERSION_KEY)
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
}; 