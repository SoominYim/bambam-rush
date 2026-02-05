import React, { memo, useState, useEffect } from "react";
import { PlayerStats } from "@/game/types";
import { getPlayerStats, getTail, getPlayer } from "@/game/managers/state";
import { getEffectiveStats } from "@/game/systems/weaponSystem";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";

interface TailDetail {
  name: string;
  level: number;
  damage: number;
  attackSpeed: number;
  count: number;
  size: number;
  speed: number;
  range: number;
  hitInterval: number;
  orbitRadiusBase: number;
  triggerRange: number;
  aggroSpeedMultiplier: number;
  burnDamage: number;
  burnDuration: number;
  explosionRadius: number;
  explosionDamage: number;
  chainCount: number;
  chainRange: number;
}

interface StatsUIProps {
  stats: PlayerStats | null;
}

export const StatsUI: React.FC<StatsUIProps> = memo(({ stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats || getPlayerStats());
  const [tailInfo, setTailInfo] = useState<TailDetail[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = getPlayerStats();
      const currentTail = getTail();
      const player = getPlayer();

      if (currentStats) setStats({ ...currentStats });

      if (player && currentTail.length > 0) {
        const info = currentTail
          .map(seg => {
            const weaponId = seg.weaponId;
            const def = WEAPON_REGISTRY[weaponId];
            if (!def) return null;

            const active = player.activeWeapons.find(aw => aw.id === weaponId);

            const eff = active ? getEffectiveStats(player, active) : { ...def.baseStats };

            return {
              name: def.name.split(" ").slice(-1)[0] || def.name,
              level: active ? active.level : 1,
              damage: eff.damage,
              attackSpeed: eff.attackSpeed,
              count: eff.count,
              size: eff.size,
              speed: eff.speed || 0,
              range: eff.range || 0,
              hitInterval: eff.hitInterval || 0,
              orbitRadiusBase: (eff as any).orbitRadiusBase || 0,
              triggerRange: (eff as any).triggerRange || 0,
              aggroSpeedMultiplier: (eff as any).aggroSpeedMultiplier || 0,
              burnDamage: (eff as any).burnDamage,
              burnDuration: (eff as any).burnDuration,
              explosionRadius: (eff as any).explosionRadius,
              explosionDamage:
                (eff as any).explosionRadius !== undefined ? eff.damage * (stats?.atk || 1) * 0.7 : undefined,
              chainCount: (eff as any).chainCount,
              chainRange: (eff as any).chainRange,
            } as any;
          })
          .filter(Boolean) as TailDetail[];

        setTailInfo(info);
      } else {
        setTailInfo([]);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div
      className="detail-stats-overlay"
      style={{
        maxHeight: "85vh",
        overflowY: "auto",
        width: "320px",
        fontSize: "0.8rem",
        padding: "12px",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", borderBottom: "1px solid #444", paddingBottom: "4px" }}>Player Stats</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", marginBottom: "15px" }}>
        <span>❤️ HP:</span>
        <span style={{ textAlign: "right" }}>
          {Math.floor(stats.hp)} / {stats.maxHp}
        </span>
        <span>⚔️ ATK:</span>
        <span style={{ textAlign: "right" }}>{stats.atk.toFixed(2)}</span>
        <span>🛡️ DEF:</span>
        <span style={{ textAlign: "right" }}>{stats.def.toFixed(1)}</span>
        <span>⚡ Atk Spd:</span>
        <span style={{ textAlign: "right" }}>{stats.fireRate.toFixed(2)}x</span>
        <span>🏃 Move Spd:</span>
        <span style={{ textAlign: "right" }}>{(stats.speed || 1.0).toFixed(2)}x</span>
      </div>

      {tailInfo.length > 0 && (
        <>
          <h3 style={{ margin: "15px 0 10px 0", borderBottom: "1px solid #444", paddingBottom: "4px" }}>
            Tail Stats ({tailInfo.length})
          </h3>
          {tailInfo.map((info, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
                padding: "8px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "2px",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#64b5f6" }}>
                  #{idx + 1} {info.name}
                </span>
                <span style={{ fontWeight: "bold", color: "#ffd700" }}>Lv.{info.level}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#aaa" }}>DMG:</span>
                  <span style={{ color: "#ff5252" }}>{info.damage.toFixed(0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#aaa" }}>AS:</span>
                  <span style={{ color: "#40c4ff" }}>{info.attackSpeed.toFixed(2)}/s</span>
                </div>

                {/* 0이 아닌 유효한 스탯만 조건부 렌더링 */}
                {info.count > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>Count:</span>
                    <span>{info.count}</span>
                  </div>
                )}
                {info.size > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>Size:</span>
                    <span>{info.size}</span>
                  </div>
                )}
                {info.speed > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>Speed:</span>
                    <span>{info.speed.toFixed(0)}</span>
                  </div>
                )}
                {info.range > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>Range:</span>
                    <span>{info.range}</span>
                  </div>
                )}
                {info.hitInterval > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>HitInt:</span>
                    <span>{info.hitInterval}ms</span>
                  </div>
                )}
                {info.orbitRadiusBase > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>Orbit:</span>
                    <span>{info.orbitRadiusBase}</span>
                  </div>
                )}
                {info.triggerRange > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>TrigR:</span>
                    <span>{info.triggerRange}</span>
                  </div>
                )}
                {info.aggroSpeedMultiplier > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>AggroX:</span>
                    <span>{info.aggroSpeedMultiplier}x</span>
                  </div>
                )}
                {info.burnDamage !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#ffab40" }}>BurnD:</span>
                    <span>{(info.burnDamage || 0).toFixed(1)}</span>
                  </div>
                )}
                {info.burnDuration !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#ffab40" }}>BurnT:</span>
                    <span>{((info.burnDuration || 0) / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {info.explosionRadius !== undefined && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#ff5252" }}>ExplodeR:</span>
                      <span>{info.explosionRadius || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#ff5252" }}>ExplodeD:</span>
                      <span>{(info.explosionDamage || 0).toFixed(0)}</span>
                    </div>
                  </>
                )}
                {info.chainCount !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#ffff88" }}>ChainC:</span>
                    <span>{info.chainCount || 0}</span>
                  </div>
                )}
                {info.chainRange !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#ffff88" }}>ChainR:</span>
                    <span>{info.chainRange || 0}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
});
