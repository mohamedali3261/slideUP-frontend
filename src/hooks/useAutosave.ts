import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutosaveConfig {
  key: string;
  data: unknown;
  interval?: number; // in milliseconds
  enabled?: boolean;
  onSave?: (data: unknown) => void;
  onRestore?: (data: unknown) => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

export interface AutosaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveCount: number;
  error: Error | null;
}

export interface AutosaveReturn extends AutosaveState {
  save: () => void;
  restore: () => unknown | null;
  clear: () => void;
  setEnabled: (enabled: boolean) => void;
  getStorageSize: () => string;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
}

const STORAGE_PREFIX = 'slideforge_autosave_';

export const useAutosave = ({
  key,
  data,
  interval = 30000, // 30 seconds default
  enabled = true,
  onSave,
  onRestore,
  onError,
  debounceMs = 1000,
}: AutosaveConfig): AutosaveReturn => {
  const [state, setState] = useState<AutosaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    saveCount: 0,
    error: null,
  });

  const [isEnabled, setIsEnabled] = useState(enabled);
  const previousDataRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Check if data has changed
  const hasDataChanged = useCallback(() => {
    const currentData = JSON.stringify(data);
    return currentData !== previousDataRef.current;
  }, [data]);

  // Save to localStorage
  const save = useCallback(() => {
    if (!isEnabled) return;

    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));

      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        version: 1,
      };

      localStorage.setItem(storageKey, JSON.stringify(saveData));
      previousDataRef.current = JSON.stringify(data);

      const now = new Date();
      setState(prev => ({
        ...prev,
        lastSaved: now,
        isSaving: false,
        hasUnsavedChanges: false,
        saveCount: prev.saveCount + 1,
      }));

      onSave?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save');
      setState(prev => ({ ...prev, isSaving: false, error: err }));
      onError?.(err);
    }
  }, [data, isEnabled, storageKey, onSave, onError]);

  // Restore from localStorage
  const restore = useCallback((): unknown | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      previousDataRef.current = JSON.stringify(parsed.data);
      
      onRestore?.(parsed.data);
      
      setState(prev => ({
        ...prev,
        lastSaved: new Date(parsed.timestamp),
        hasUnsavedChanges: false,
      }));

      return parsed.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to restore');
      onError?.(err);
      return null;
    }
  }, [storageKey, onRestore, onError]);

  // Clear saved data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      previousDataRef.current = '';
      setState({
        lastSaved: null,
        isSaving: false,
        hasUnsavedChanges: false,
        saveCount: 0,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to clear');
      onError?.(err);
    }
  }, [storageKey, onError]);

  // Get storage size
  const getStorageSize = useCallback((): string => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return '0 B';

      const bytes = new Blob([saved]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return '0 B';
    }
  }, [storageKey]);

  // Export data as JSON string
  const exportData = useCallback((): string => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved || '';
    } catch {
      return '';
    }
  }, [storageKey]);

  // Import data from JSON string
  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) return false;

      localStorage.setItem(storageKey, jsonString);
      previousDataRef.current = JSON.stringify(parsed.data);
      
      setState(prev => ({
        ...prev,
        lastSaved: new Date(parsed.timestamp),
        hasUnsavedChanges: false,
      }));

      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Debounced save on data change
  useEffect(() => {
    if (!isEnabled) return;

    if (hasDataChanged()) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        save();
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, isEnabled, hasDataChanged, save, debounceMs]);

  // Interval-based save
  useEffect(() => {
    if (!isEnabled || interval <= 0) return;

    intervalRef.current = setInterval(() => {
      if (hasDataChanged()) {
        save();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, interval, hasDataChanged, save]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges && isEnabled) {
        save();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges, isEnabled, save]);

  // Save on visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.hasUnsavedChanges && isEnabled) {
        save();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.hasUnsavedChanges, isEnabled, save]);

  return {
    ...state,
    save,
    restore,
    clear,
    setEnabled: setIsEnabled,
    getStorageSize,
    exportData,
    importData,
  };
};

// Utility to check if there's saved data
export const hasSavedData = (key: string): boolean => {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) !== null;
  } catch {
    return false;
  }
};

// Utility to get all saved presentations
export const getAllSavedPresentations = (): { key: string; timestamp: string; title: string }[] => {
  const presentations: { key: string; timestamp: string; title: string }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          presentations.push({
            key: key.replace(STORAGE_PREFIX, ''),
            timestamp: parsed.timestamp,
            title: parsed.data?.title || 'Untitled',
          });
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return presentations.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export default useAutosave;
