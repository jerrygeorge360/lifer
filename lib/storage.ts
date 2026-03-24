import type { RegistrationState, SetupState } from "@/lib/types";

const registrationKey = "lifer.registration";
const setupKey = "lifer.setup";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRegistration(): RegistrationState | null {
  return readJson<RegistrationState>(registrationKey);
}

export function saveRegistration(value: RegistrationState): void {
  writeJson(registrationKey, value);
}

export function getSetup(): SetupState | null {
  return readJson<SetupState>(setupKey);
}

export function saveSetup(value: SetupState): void {
  writeJson(setupKey, value);
}

export function clearLocalRegistration(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(registrationKey);
}
