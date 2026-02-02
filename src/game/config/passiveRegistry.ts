export interface PassiveDefinition {
  id: string;
  name: string;
  description: string;
  levels: Record<
    number,
    {
      value: number;
      description: string;
    }
  >;
}

export const PASSIVE_REGISTRY: Record<string, PassiveDefinition> = {
  P01: {
    id: "P01",
    name: "무력 (Might)",
    description: "모든 공격의 공격력이 증가합니다.",
    levels: {
      1: { value: 0.1, description: "공격력 +10%" },
      2: { value: 0.2, description: "공격력 +20%" },
      3: { value: 0.3, description: "공격력 +30%" },
      4: { value: 0.4, description: "공격력 +40%" },
      5: { value: 0.5, description: "공격력 +50%" },
    },
  },
  P02: {
    id: "P02",
    name: "공격 속도 (Cooldown)",
    description: "모든 무기의 재사용 대기시간이 감소합니다.",
    levels: {
      1: { value: -0.05, description: "쿨타임 -5%" },
      2: { value: -0.1, description: "쿨타임 -10%" },
      3: { value: -0.15, description: "쿨타임 -15%" },
      4: { value: -0.2, description: "쿨타임 -20%" },
      5: { value: -0.3, description: "쿨타임 -30%" },
    },
  },
  P05: {
    id: "P05",
    name: "주문 가속 (Bracer)",
    description: "투사체의 속도가 증가합니다.",
    levels: {
      1: { value: 0.1, description: "탄속 +10%" },
      2: { value: 0.2, description: "탄속 +20%" },
      3: { value: 0.3, description: "탄속 +30%" },
      4: { value: 0.4, description: "탄속 +40%" },
      5: { value: 0.5, description: "탄속 +50%" },
    },
  },
  P06: {
    id: "P06",
    name: "지속 시간 (Spellbinder)",
    description: "무기 효과의 지속 시간이 증가합니다.",
    levels: {
      1: { value: 0.1, description: "지속시간 +10%" },
      2: { value: 0.2, description: "지속시간 +20%" },
      3: { value: 0.3, description: "지속시간 +30%" },
      4: { value: 0.5, description: "지속시간 +50%" },
      5: { value: 1.0, description: "지속시간 +100%" },
    },
  },
  P13: {
    id: "P13",
    name: "복제 (Duplicator)",
    description: "발사되는 투사체의 수가 증가합니다.",
    levels: {
      1: { value: 1, description: "투사체 수 +1" },
      2: { value: 2, description: "투사체 수 +2" },
      3: { value: 3, description: "투사체 수 +3" },
    },
  },
};
