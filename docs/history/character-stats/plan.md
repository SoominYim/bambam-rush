# 캐릭터 스탯 및 스킬 동작 개편 기획 (History)

본 문서는 캐릭터의 성장 요소를 도입하고 스킬의 동작 방식을 다양화하기 위한 기획 및 설계 기록입니다.

## 1. 개편 목표

- 모든 매직 넘버의 상수화 (`constants.ts` 집중 관리)
- 캐릭터 스탯 시스템 구축 (HP, ATK, DEF, Fire Rate)
- 스킬 동작 방식의 4가지 카테고리화 (발사형, 회전형, 장판형, 근접형)
- 공격 속도 600% 하향 및 성장 가중치 적용

## 2. 세부 설계

- **Base Stats**: HP 100, ATK 1.0, DEF 5, Fire Rate 1.0 (Base 1500ms)
- **UI Layout**: HUD(상단), Pause Menu(상세)
- **Behavior Matrix**:
  - PROJECTILE: 직선 발사
  - ORBITAL: 공전
  - AREA: 장판
  - MELEE: 근접 휘두르기

---

_기록 날짜: 2026-01-30_
