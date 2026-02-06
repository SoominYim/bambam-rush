import { memo } from "react";
import { WeaponDefinition } from "@/game/config/weaponRegistry";
import { ElementType } from "@/game/types";

interface WeaponIconProps {
  weapon?: WeaponDefinition;
  elementType?: ElementType; // Fallback if weapon is not provided
  size?: string; // CSS size, e.g., "100%", "32px"
}

export const WeaponIcon = memo(({ weapon, size = "100%" }: WeaponIconProps) => {
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

  // 2. If weapon has a text icon (emoji) - legacy fallback
  if (weapon?.icon) {
    return <div style={{ fontSize: `calc(${size} * 0.8)`, lineHeight: size, textAlign: "center" }}>{weapon.icon}</div>;
  }

  // 3. No icon available - show empty placeholder
  return <div style={{ width: size, height: size }} />;
});
