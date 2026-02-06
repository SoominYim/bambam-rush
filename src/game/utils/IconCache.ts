import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";

const imageCache: Record<string, HTMLImageElement> = {};
const loadingSet: Set<string> = new Set();

export const getWeaponIconImage = (weaponId: string): HTMLImageElement | null => {
  if (imageCache[weaponId]) {
    return imageCache[weaponId];
  }

  // If already loading, don't trigger again
  if (loadingSet.has(weaponId)) return null;

  const def = WEAPON_REGISTRY[weaponId];
  if (!def || !def.icon) return null; // No icon available

  // Only handle SVG strings for now
  if (def.icon.startsWith("<svg")) {
    loadingSet.add(weaponId);

    const img = new Image();
    // Encode SVG safely
    const svgEncoded = encodeURIComponent(def.icon);
    img.src = `data:image/svg+xml;charset=utf-8,${svgEncoded}`;

    img.onload = () => {
      imageCache[weaponId] = img;
      loadingSet.delete(weaponId);
    };

    img.onerror = () => {
      console.error(`Failed to load icon for weapon ${weaponId}`);
      loadingSet.delete(weaponId);
    };
  }

  return null;
};
