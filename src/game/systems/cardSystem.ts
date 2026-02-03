import { ElementType, ActiveWeapon, PassiveInstance } from "@/game/types";
import { getPlayer, addTailSegment, getTail } from "@/game/managers/state";
import { createTailSegment } from "@/game/entities/player";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";
import { isWeaponUnlocked } from "@/game/managers/unlockManager";

export enum CardType {
  WEAPON = "WEAPON",
  PASSIVE = "PASSIVE",
  STAT = "STAT",
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "LEGENDARY";
  elementType?: string;

  // payload
  targetId?: string; // weaponId or passiveId
  statType?: string;
  statValue?: number;
}

export const draftCards = (count: number = 3): Card[] => {
  const player = getPlayer();
  if (!player) return [];

  const result: Card[] = [];
  const draftedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // 50% Weapon, 30% Passive, 20% Stat
    const roll = Math.random();
    let card: Card | null = null;

    if (roll < 0.5) {
      card = draftWeaponCard(player, draftedIds);
    } else if (roll < 0.8) {
      card = draftPassiveCard(player, draftedIds);
    } else {
      card = draftStatCard(draftedIds);
    }

    if (card) {
      result.push(card);
      draftedIds.add(card.targetId || card.statType || "");
    } else {
      // Fallback to stat if others fail
      const stat = draftStatCard(draftedIds);
      if (stat) result.push(stat);
    }
  }

  return result;
};

const draftWeaponCard = (player: any, seenIds: Set<string>): Card | null => {
  const weaponIds = Object.keys(WEAPON_REGISTRY).filter(id => isWeaponUnlocked(id));
  if (weaponIds.length === 0) return null;
  const randomId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
  if (seenIds.has(randomId)) return null;

  const def = WEAPON_REGISTRY[randomId];
  const active = player.activeWeapons.find((w: ActiveWeapon) => w.id === randomId);

  if (active && active.level >= 8) return null; // Max level

  const nextLevel = active ? active.level + 1 : 1;
  const levelDesc = def.levels[nextLevel]?.description || "강화";

  return {
    id: crypto.randomUUID(),
    type: CardType.WEAPON,
    title: active ? `${def.name} (Lv.${nextLevel})` : `${def.name} 획득`,
    description: active ? levelDesc : def.description,
    icon: getIconForTags(def.tags),
    rarity: "COMMON",
    targetId: randomId,
    elementType: def.tags[0] || "무속성",
  };
};

const draftPassiveCard = (player: any, seenIds: Set<string>): Card | null => {
  const passiveIds = Object.keys(PASSIVE_REGISTRY);
  const randomId = passiveIds[Math.floor(Math.random() * passiveIds.length)];
  if (seenIds.has(randomId)) return null;

  const def = PASSIVE_REGISTRY[randomId];
  const active = player.passives.find((p: PassiveInstance) => p.id === randomId);

  if (active && active.level >= 5) return null; // Max level

  const nextLevel = active ? active.level + 1 : 1;
  const levelDesc = def.levels[nextLevel]?.description || "강화";

  return {
    id: crypto.randomUUID(),
    type: CardType.PASSIVE,
    title: active ? `${def.name} (Lv.${nextLevel})` : `${def.name} 습득`,
    description: levelDesc,
    icon: getPassiveIcon(randomId),
    rarity: "RARE",
    targetId: randomId,
  };
};

const draftStatCard = (_draftedIds: Set<string>): Card => {
  const stats = [
    { type: "atk", title: "공격력 증가", icon: "⚔️", val: 0.1 },
    { type: "def", title: "방어력 증가", icon: "🛡️", val: 2 },
    { type: "maxHp", title: "최대 체력 증가", icon: "❤️", val: 20 },
    { type: "heal", title: "회복 물약", icon: "🧪", val: 0.3 },
  ];
  const s = stats[Math.floor(Math.random() * stats.length)];

  return {
    id: crypto.randomUUID(),
    type: CardType.STAT,
    title: s.title,
    description: s.type === "heal" ? "체력 30% 회복" : "기본 능력치 강화",
    icon: s.icon,
    rarity: "COMMON",
    statType: s.type,
    statValue: s.val,
  };
};

export const applyCardEffect = (card: Card) => {
  const player = getPlayer();
  if (!player) return;

  switch (card.type) {
    case CardType.WEAPON:
      if (card.targetId) {
        const active = player.activeWeapons.find(w => w.id === card.targetId);
        if (active) {
          active.level++;
        } else {
          player.activeWeapons.push({
            id: card.targetId,
            level: 1,
            timer: 0,
            lastFired: 0,
          });
          // Add tail visual
          const def = WEAPON_REGISTRY[card.targetId];
          const newSegment = createTailSegment(getTail().length, def.tags[0]);
          newSegment.weaponId = card.targetId;
          addTailSegment(newSegment);
        }
      }
      break;

    case CardType.PASSIVE:
      if (card.targetId) {
        const active = player.passives.find(p => p.id === card.targetId);
        if (active) {
          active.level++;
        } else {
          player.passives.push({
            id: card.targetId,
            level: 1,
          });
        }
      }
      break;

    case CardType.STAT:
      if (card.statType && card.statValue) {
        switch (card.statType) {
          case "atk":
            player.stats.atk += card.statValue;
            break;
          case "def":
            player.stats.def += card.statValue;
            break;
          case "maxHp":
            player.stats.maxHp += card.statValue;
            player.stats.hp += card.statValue;
            break;
          case "heal":
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + player.stats.maxHp * card.statValue);
            break;
        }
      }
      break;
  }
};

const getIconForTags = (tags: ElementType[]): string => {
  const first = tags[0];
  switch (first) {
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
    case ElementType.PHYSICAL:
      return "🗡️";
    case ElementType.ARCANE:
      return "✨";
    default:
      return "⚔️";
  }
};

const getPassiveIcon = (id: string): string => {
  switch (id) {
    case "P01":
      return "💪";
    case "P02":
      return "⏳";
    case "P05":
      return "⚡";
    case "P06":
      return "📖";
    case "P13":
      return "👯";
    default:
      return "💎";
  }
};
export const addWeapon = (weaponId: string) => {
  const player = getPlayer();
  if (!player) return;

  const active = player.activeWeapons.find(w => w.id === weaponId);
  if (active) {
    if (active.level < 8) active.level++;
  } else {
    player.activeWeapons.push({
      id: weaponId,
      level: 1,
      timer: 0,
      lastFired: 0,
    });
    // Add tail visual
    const def = WEAPON_REGISTRY[weaponId];
    if (def) {
      const newSegment = createTailSegment(getTail().length, def.tags[0]);
      newSegment.weaponId = weaponId;
      addTailSegment(newSegment);
    }
  }
};
