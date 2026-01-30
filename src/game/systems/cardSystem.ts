import { ElementType, PlayerStats } from "@/game/types";
import { getPlayer, addTailSegment } from "@/game/managers/state";
import { createTailSegment } from "@/game/entities/player";
// import { SPELL_STATS } from "@/game/config/spellStats";

export enum CardType {
  SKILL = "SKILL",
  STAT = "STAT",
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "LEGENDARY";
  // For Skill Cards
  elementType?: ElementType;
  // For Stat Cards
  statType?: keyof PlayerStats | "heal";
  statValue?: number;
}

// Pool of Stat Upgrades
const STAT_CARDS: Omit<Card, "id">[] = [
  {
    type: CardType.STAT,
    title: "공격력 증가",
    description: "공격력이 10% 증가합니다",
    icon: "⚔️",
    rarity: "COMMON",
    statType: "atk",
    statValue: 0.1, // +10% base
  },
  {
    type: CardType.STAT,
    title: "방어력 증가",
    description: "방어력이 2 증가합니다",
    icon: "🛡️",
    rarity: "COMMON",
    statType: "def",
    statValue: 2,
  },
  {
    type: CardType.STAT,
    title: "최대 체력 증가",
    description: "최대 체력이 20 증가합니다",
    icon: "❤️",
    rarity: "COMMON",
    statType: "maxHp",
    statValue: 20,
  },
  {
    type: CardType.STAT,
    title: "회복 물약",
    description: "최대 체력의 30%를 회복합니다",
    icon: "🧪",
    rarity: "COMMON",
    statType: "heal",
    statValue: 0.3,
  },
  {
    type: CardType.STAT,
    title: "자석 강화",
    description: "아이템 획득 범위가 20% 증가합니다",
    icon: "🧲",
    rarity: "RARE",
    statType: "pickupRange",
    statValue: 0.2, // +20%
  },
  {
    type: CardType.STAT,
    title: "공격 속도 증가",
    description: "공격 속도가 10% 빨라집니다",
    icon: "⚡",
    rarity: "RARE",
    statType: "fireRate",
    statValue: 0.1,
  },
  {
    type: CardType.STAT,
    title: "체력 재생",
    description: "초당 체력을 0.5 회복합니다",
    icon: "💖",
    rarity: "RARE",
    statType: "hpRegen",
    statValue: 0.5,
  },
];

// Available Skills (All basic elements)
const ELEMENT_CARDS: ElementType[] = [
  ElementType.FIRE,
  ElementType.WATER,
  ElementType.ICE,
  ElementType.WIND,
  ElementType.POISON,
  ElementType.ELECTRIC,
  ElementType.SWORD,
  ElementType.BOOK,
];

export const draftCards = (count: number = 3): Card[] => {
  const result: Card[] = [];

  for (let i = 0; i < count; i++) {
    const isSkill = Math.random() < 0.6; // 60% chance for Skill

    if (isSkill) {
      const type = ELEMENT_CARDS[Math.floor(Math.random() * ELEMENT_CARDS.length)];
      // const stats = SPELL_STATS[type]; // Unused
      result.push({
        id: crypto.randomUUID(),
        type: CardType.SKILL,
        title: `${type} 마스터리`,
        description: `[${type}] 꼬리를 추가합니다.`,
        icon: getElementIcon(type),
        rarity: "COMMON",
        elementType: type,
      });
    } else {
      const template = STAT_CARDS[Math.floor(Math.random() * STAT_CARDS.length)];
      result.push({
        ...template,
        id: crypto.randomUUID(),
      });
    }
  }

  return result;
};

export const applyCardEffect = (card: Card) => {
  const player = getPlayer();
  if (!player) return;

  if (card.type === CardType.SKILL && card.elementType) {
    // Add new segment
    const tailLength = player.stats.level || 0; // Or standard tail length logic
    const newSegment = createTailSegment(tailLength + 999, card.elementType);
    // Just append to end, exact index doesn't matter much for creation logic as it uses history
    addTailSegment(newSegment);
    console.log(`Applied Skill Card: ${card.title}`);
  } else if (card.type === CardType.STAT && card.statType) {
    applyStatEffect(player, card);
  }
};

const applyStatEffect = (player: any, card: Card) => {
  if (!card.statValue) return;

  switch (card.statType) {
    case "atk":
      player.stats.atk += card.statValue;
      break;
    case "def":
      player.stats.def += card.statValue;
      break;
    case "maxHp":
      player.stats.maxHp += card.statValue;
      player.stats.hp += card.statValue; // Heal the added amount
      break;
    case "heal":
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + player.stats.maxHp * card.statValue);
      break;
    case "pickupRange":
      player.stats.pickupRange = (player.stats.pickupRange || 150) * (1 + card.statValue);
      break;
    case "fireRate":
      player.stats.fireRate += card.statValue;
      break;
    case "hpRegen":
      player.stats.hpRegen = (player.stats.hpRegen || 0) + card.statValue;
      break;
  }
  console.log(`Applied Stat Card: ${card.title}`);
};

const getElementIcon = (type: ElementType): string => {
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
    default:
      return "❓";
  }
};
