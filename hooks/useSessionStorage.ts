
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  try {
    const item = window.sessionStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error(`Error reading sessionStorage key "${key}":`, error);
  }
  return initialValue instanceof Function ? initialValue() : initialValue;
}

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    const setItem = (val: T) => {
      try {
        const valueToStore = JSON.stringify(val);
        window.sessionStorage.setItem(key, valueToStore);
      } catch (error: any) {
        if (
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22 ||
          error.code === 1014
        ) {
          if (Array.isArray(val) && val.length > 0) {
            const newVal = val.slice(0, -1) as unknown as T;
            console.warn(`SessionStorage quota exceeded for "${key}". Trimming old data...`);
            setItem(newVal);
          } else {
             console.warn(`SessionStorage quota exceeded for "${key}" and value cannot be trimmed.`);
          }
        } else {
          console.error(`Error setting sessionStorage key "${key}":`, error);
        }
      }
    };

    setItem(storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
