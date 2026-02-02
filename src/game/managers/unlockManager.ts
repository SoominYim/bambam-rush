export const UNLOCK_STORAGE_KEY = "bambam_rush_unlocks";

interface Unlocks {
  weapons: string[];
  characters: string[];
  achievements: string[];
}

const DEFAULT_UNLOCKS: Unlocks = {
  weapons: ["W01", "W02", "W03", "W04", "W05"], // Initial starting pool
  characters: ["BASIC"],
  achievements: [],
};

export const getUnlocks = (): Unlocks => {
  const stored = localStorage.getItem(UNLOCK_STORAGE_KEY);
  if (!stored) return DEFAULT_UNLOCKS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_UNLOCKS;
  }
};

export const unlockWeapon = (id: string) => {
  const current = getUnlocks();
  if (current.weapons.includes(id)) return;
  current.weapons.push(id);
  saveUnlocks(current);
};

export const isWeaponUnlocked = (id: string) => {
  const current = getUnlocks();
  return current.weapons.includes(id);
};

const saveUnlocks = (u: Unlocks) => {
  localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(u));
};
