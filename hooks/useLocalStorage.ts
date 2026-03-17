
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
  }
  return initialValue instanceof Function ? initialValue() : initialValue;
}


export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    const setItem = (val: T) => {
      try {
        const valueToStore = JSON.stringify(val);
        window.localStorage.setItem(key, valueToStore);
      } catch (error: any) {
        // Check for quota exceeded error
        if (
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22 ||
          error.code === 1014
        ) {
          if (Array.isArray(val) && val.length > 0) {
            // If it's an array, remove the last item (oldest) and try again
            // We assume the array is ordered [newest, ..., oldest]
            const newVal = val.slice(0, -1) as unknown as T;
            console.warn(`LocalStorage quota exceeded for "${key}". Trimming old data...`);
            setItem(newVal);
          } else {
             console.warn(`LocalStorage quota exceeded for "${key}" and value cannot be trimmed.`);
          }
        } else {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    };

    setItem(storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
