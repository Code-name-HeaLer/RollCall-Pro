import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from '../data/types'; // Assuming types are defined here

const STORAGE_KEY = '@StudentAttendancePlus:data';

// Function to load data from AsyncStorage
export const loadAppData = async (): Promise<AppData | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Failed to load data from storage", e);
    return null;
  }
};

// Function to save data to AsyncStorage
export const saveAppData = async (value: AppData): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save data to storage", e);
  }
};

// Function to clear data (optional, for debugging/reset)
export const clearAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear data from storage", e);
  }
}; 