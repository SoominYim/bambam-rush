# Code Context – Weapon & Combat System

## 1. 코드 구조 철학

- 데이터와 행동을 분리한다
- “무기별 코드”는 만들지 않는다
- 패턴별 공용 로직만 존재한다

---

## 2. 핵심 파일 역할

### weaponRegistry.ts

- 무기 정의 데이터
- 패턴, 스탯, 레벨 스케일만 포함
- 로직 ❌

### weaponSystem.ts

- 무기 발동 시점 관리
- 패턴별 생성 함수
- 언제 / 몇 개 / 어떤 스탯

### projectile / entity

- 실제 이동 / 충돌 / 상태 처리
- 어떻게 움직이고 맞히는지

---

## 3. 패턴 구현 원칙

- weaponSystem.ts
  - fireXXX(), spawnXXX()
- projectile/entity
  - updateXXX()

👉 생성과 행동을 분리한다

---

## 4. 상태와 행동

- 투사체 / 무기는 상태를 가질 수 있다
  - idle
  - attack
  - return
- 상태 전환은 부드럽게 (lerp)

---

## 5. 성능 기준

- 항상 존재하는 객체:
  - orbit
  - aura
  - minion
- 반드시:
  - hitCooldown
  - tick 간격
  - 최소 충돌 체크

---

## 6. 확장 기준

- 신규 패턴 추가 시:
  - 기존 코드 수정 최소화
- switch 확장보다:
  - behavior map 선호

---

## 7. 한 줄 정의

> 이 코드는 “지금 동작”보다  
> **미래 확장**을 위해 존재한다
