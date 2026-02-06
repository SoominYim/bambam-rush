import { memo } from "react";
import { WeaponDefinition } from "@/game/config/weaponRegistry";
import { ElementType } from "@/game/types";

interface WeaponIconProps {
  weapon?: WeaponDefinition;
  elementType?: ElementType; // Fallback if weapon is not provided
  size?: string; // CSS size, e.g., "100%", "32px"
}

export const WeaponIcon = memo(({ weapon, elementType, size = "100%" }: WeaponIconProps) => {
  // 1. If weapon has a custom SVG Icon
  if (weapon?.icon && weapon.icon.trim().startsWith("<svg")) {
    // Inject width/height to ensure it fills the container
    const svgWithStyle = weapon.icon.replace(
      "<svg",
      '<svg style="width: 100%; height: 100%; display: block;" preserveAspectRatio="xMidYMid meet"',
    );
    return (
      <div
        dangerouslySetInnerHTML={{ __html: svgWithStyle }}
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  // 2. If weapon has a text icon (emoji)
  if (weapon?.icon) {
    return <div style={{ fontSize: `calc(${size} * 0.8)`, lineHeight: size, textAlign: "center" }}>{weapon.icon}</div>;
  }

  // 3. Fallback to ElementType based icon hierarchy
  const type = elementType || (weapon?.tags && weapon.tags[0]);
  const icon = getIconForType(type || ElementType.PHYSICAL);

  return <div style={{ fontSize: `calc(${size} * 0.8)`, lineHeight: size, textAlign: "center" }}>{icon}</div>;
});

// Reuse the switch logic
export const getIconForType = (type: ElementType | string): string => {
  switch (type) {
    case ElementType.FIRE:
      return "🔥";
    case ElementType.WATER:
      return "💧";
    case ElementType.ICE:
      return "❄️";
    case ElementType.WIND:
      return "💨";
    case ElementType.POISON:
      return "☠️";
    case ElementType.ELECTRIC:
      return "⚡";
    case ElementType.SWORD:
      return "🗡️";
    case ElementType.BOOK:
      return "📖";
    case ElementType.INFERNO:
      return "☄️";
    case ElementType.BLIZZARD:
      return "🌨️";
    case ElementType.POISON_SWAMP:
      return "🟣";
    case ElementType.LIGHTNING_CHAIN:
      return "🌩️";
    case ElementType.SWORD_DANCE:
      return "⚔️";
    case ElementType.STORM:
      return "🌪️";
    case ElementType.PHYSICAL:
      return "👊";
    case ElementType.ARCANE:
      return "🔮";
    case ElementType.TECH:
      return "🔧";
    case ElementType.LIGHT:
      return "✨";
    case ElementType.BLOOD:
      return "🩸";
    case ElementType.GRAVITY:
      return "🌑";
    default:
      return "⚔️";
  }
};
