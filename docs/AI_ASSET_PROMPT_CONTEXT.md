# AI Asset Prompt Context (Canvas Game)

## 0) 목적
- 캔버스 게임용 고품질 에셋 생성 프롬프트 표준 문서다.
- 모든 AI 이미지 생성은 이 템플릿을 기준으로 작성한다.

## 1) 공통 스타일 컨텍스트
```text
top-down 2D action game asset, clean silhouette, readable at small size,
stylized but not noisy, high contrast shape language, consistent lighting direction,
transparent background, centered composition, no text, no logo, no watermark
```

## 2) 공통 네거티브 프롬프트
```text
photorealistic, cinematic scene, background environment, UI screenshot, mockup frame,
text, letters, logo, watermark, signature, blurry, over-detailed noise, low contrast,
cropped subject, disfigured anatomy, duplicate limbs
```

## 3) 카테고리별 추가 컨텍스트
### 3-1. 캐릭터
```text
hero unit sprite, clear head-body readability, strong primary shape,
distinct idle stance, subtle emissive accents, game-ready sprite concept
```

### 3-2. 적
```text
enemy unit sprite, threatening silhouette, readable attack intent,
tiered visual hierarchy (normal/elite/boss), strong contrast against dark ground
```

### 3-3. 무기/투사체
```text
weapon icon for top-down combat, iconic shape, immediate function readability,
impact-oriented silhouette, color coding by element
```

### 3-4. VFX 텍스처
```text
vfx texture sheet style, additive-friendly glow, soft alpha falloff,
ring slash spark smoke variants, seamless transparent edges
```

### 3-5. UI 아이콘
```text
ui icon set, bold silhouette, minimal interior noise, consistent stroke weight,
high legibility at 32px and 48px
```

## 4) 원소 색상 맵
- FIRE: orange/red
- ICE: cyan/blue
- POISON: green
- ELECTRIC: yellow/white
- WIND: mint/teal
- TECH: steel/blue

## 5) 단일 에셋 템플릿
```text
[COMMON_STYLE]
category: [CHARACTER|ENEMY|WEAPON_ICON|PROJECTILE|VFX|UI_ICON]
theme: [short description]
element: [FIRE|ICE|POISON|ELECTRIC|WIND|TECH|NONE]
silhouette: [one sentence]
detail level: medium
output: transparent png, centered subject, single asset
[NEGATIVE_PROMPT]
```

## 6) 배치 생성 템플릿
```text
[COMMON_STYLE]
create [N] variations of [CATEGORY] in one consistent visual family,
each variation must be distinguishable by silhouette and function,
keep identical lighting direction and rendering style,
transparent background for each asset
[NEGATIVE_PROMPT]
```

## 7) 예시 프롬프트 (W19 시공 봉인문)
```text
top-down 2D action game asset, clean silhouette, readable at small size,
stylized but not noisy, high contrast shape language, consistent lighting direction,
transparent background, centered composition, no text, no logo, no watermark,
weapon icon, two linked spatial gates, arcane-tech fusion,
WIND and TECH color accents, single icon, transparent png
Negative prompt: photorealistic, background scene, text, watermark
```

## 8) 후처리 규칙
- 배경 제거 -> 투명 PNG
- 크기 정규화
- 중심 정렬/여백 통일
- 파일명 규칙 적용
- 50% 축소 판독성 검사

## 9) 승인 체크리스트
- [ ] 스타일 앵커와 일치
- [ ] 실루엣 역할 식별 가능
- [ ] 색상 맵 준수
- [ ] 텍스트/워터마크 없음
- [ ] 게임 배경 위에서 가독성 확보
