// src/services/atom.service.ts
import { WritableAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

class AtomService {
  private atoms: Record<string, WritableAtom<unknown, [unknown], void>> = {};
  private memoryStorage: Record<string, string> = {};

  constructor() {
    this.loadAtomsFromStorage();
  }

  private getStorageItem(key: string): string | null {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return this.memoryStorage[key] ?? null;
  }

  private setStorageItem(key: string, value: string): void {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
  }

  private removeStorageItem(key: string): void {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      delete this.memoryStorage[key];
    }
  }

  /**
   * Safely load existing atoms from localStorage.
   * Invalid JSON entries are automatically removed.
   */
  private loadAtomsFromStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = this.safeParse(key);
      if (value !== undefined) {
        this.atoms[key] = atomWithStorage<unknown>(key, value);
      }
    }
  }

  /**
   * Safely parse a storage value. Returns undefined if invalid.
   * If invalid, removes the entry and logs a warning.
   */
  private safeParse(key: string): unknown | undefined {
    try {
      const raw = this.getStorageItem(key);
      return raw !== null ? JSON.parse(raw) : undefined;
    } catch {
      console.warn(`[AtomService] Removed invalid storage key: "${key}"`);
      this.removeStorageItem(key);
      return undefined;
    }
  }

  /**
   * Get or create an atom with the given initial value.
   */
  getAtom<T>(key: string, initialValue: T): WritableAtom<T, [T], void> {
    if (!this.atoms[key]) {
      const existing = this.safeParse(key) as T | undefined;
      this.atoms[key] = atomWithStorage<unknown>(
        key,
        existing !== undefined ? existing : initialValue,
      );
    }
    return this.atoms[key] as WritableAtom<T, [T], void>;
  }

  /**
   * Set a value directly in storage.
   */
  set<T>(key: string, value: T): void {
    try {
      this.setStorageItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[AtomService] Failed to set storage key "${key}":`, e);
    }
  }

  /**
   * Get a parsed value directly from storage.
   */
  get<T>(key: string): T | undefined {
    return this.safeParse(key) as T | undefined;
  }

  /**
   * Remove an atom and its storage entry.
   */
  remove(key: string): void {
    if (this.atoms[key]) {
      delete this.atoms[key];
    }
    this.removeStorageItem(key);
  }

  /**
   * Get all current atom keys.
   */
  getKeys(): string[] {
    return Object.keys(this.atoms);
  }
}

export default new AtomService();
