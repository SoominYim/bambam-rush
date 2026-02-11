export const WEAPON_ICONS = {
  // W01: 가디언 소드
  GUARDIAN_SWORD: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4L38 44H26L32 4Z" fill="#E0E0E0" stroke="#777" stroke-width="2"/><rect x="20" y="44" width="24" height="6" rx="2" fill="#DAA520" stroke="#B8860B" stroke-width="2"/><rect x="28" y="50" width="8" height="10" fill="#8B4513" stroke="#5D4037" stroke-width="2"/><circle cx="32" cy="47" r="2" fill="#FFF"/></svg>`,

  // W05: 맹독 웅덩이
  POISON_PUDDLE: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M26 14H38V22L48 54H16L26 22V14Z" fill="#9932CC" stroke="#4B0082" stroke-width="3"/><rect x="24" y="6" width="16" height="8" rx="1" fill="#8B4513"/><circle cx="24" cy="36" r="3" fill="#BA55D3"/><circle cx="40" cy="46" r="4" fill="#BA55D3"/><path d="M20 40H44" stroke="#BA55D3" stroke-width="2" stroke-opacity="0.5"/></svg>`,

  // W06: 부메랑
  BOOMERANG: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M52 12L32 32L12 12C12 12 18 48 32 56C46 48 52 12 52 12Z" fill="#87CEFA" stroke="#00BFFF" stroke-width="4"/><path d="M32 32L12 12M32 32L52 12" stroke="#E0FFFF" stroke-width="2"/><circle cx="32" cy="42" r="6" fill="#E0FFFF" fill-opacity="0.6"/></svg>`,

  // W06_EVO: 스톰 룰러
  // W06_EVO: 스톰 룰러
  STORM_RULER: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="stormGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E0FFFF" /><stop offset="100%" stop-color="#00BFFF" /></linearGradient></defs><circle cx="32" cy="32" r="28" fill="url(#stormGrad)" fill-opacity="0.3"/><path d="M56 8L32 32L8 8C8 8 16 52 32 60C48 52 56 8 56 8Z" fill="#00BFFF" stroke="#FFFFFF" stroke-width="3"/><path d="M32 20V44M20 32H44" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,

  // W02: 매직 미사일
  MAGIC_MISSILE: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="#9370DB" stroke="#483D8B" stroke-width="2"/><path d="M32 10L36 26H28L32 10Z" fill="#E6E6FA"/><path d="M32 54L36 38H28L32 54Z" fill="#E6E6FA"/><path d="M10 32L26 28V36L10 32Z" fill="#E6E6FA"/><path d="M54 32L38 28V36L54 32Z" fill="#E6E6FA"/><circle cx="32" cy="32" r="8" fill="#FFF" fill-opacity="0.5"/></svg>`,

  // W03: 화염구
  FIREBALL: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="34" r="18" fill="#FF4500"/><path d="M32 8C20 18 14 30 14 34C14 44 22 52 32 52C42 52 50 44 50 34C50 30 44 18 32 8Z" fill="#FF8C00"/><path d="M32 16C26 22 22 28 22 34C22 40 26 44 32 44C38 44 42 40 42 34C42 28 38 22 32 16Z" fill="#FFFF00"/></svg>`,

  // W04: 체인 라이트닝
  CHAIN_LIGHTNING: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M38 4L22 32H36L26 60L50 28H34L38 4Z" fill="#FFD700" stroke="#DAA520" stroke-width="2"/><circle cx="26" cy="60" r="4" fill="#FFF" fill-opacity="0.6"/></svg>`,

  // W07: 서리 폭발
  FROST_NOVA: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4V60M4 32H60M12 12L52 52M12 52L52 12" stroke="#00BFFF" stroke-width="4"/><circle cx="32" cy="32" r="12" fill="#E0FFFF" stroke="#B0E0E6" stroke-width="2"/></svg>`,

  // W08: 수호의 구슬
  GUARDIAN_ORB: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="14" fill="#FFFFE0" stroke="#FFD700" stroke-width="2"/><circle cx="12" cy="32" r="6" fill="#F0E68C"/><circle cx="52" cy="32" r="6" fill="#F0E68C"/><circle cx="32" cy="12" r="6" fill="#F0E68C"/><circle cx="32" cy="52" r="6" fill="#F0E68C"/><circle cx="32" cy="32" r="22" stroke="#DAA520" stroke-width="1" fill="none"/></svg>`,

  // W09: 바늘 지뢰
  NEEDLE_MINE: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="24" width="32" height="24" rx="4" fill="#696969" stroke="#2F4F4F" stroke-width="2"/><circle cx="32" cy="36" r="6" fill="#FF0000"/><path d="M32 24V14M16 24L10 16M48 24L54 16" stroke="#2F4F4F" stroke-width="2"/></svg>`,

  // W10: 레이저 빔
  LASER_BEAM: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="26" width="36" height="12" fill="#444"/><rect x="50" y="22" width="6" height="20" fill="#222"/><path d="M14 32H4" stroke="#00FF00" stroke-width="4"/><path d="M14 32H0" stroke="#FFF" stroke-width="1" stroke-opacity="0.7"/></svg>`,

  // W11: 박쥐 소환
  SUMMON_BAT: `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><style>.wing-left{transform-origin:45px 30px;animation:flap-l 0.3s ease-in-out infinite alternate}.wing-right{transform-origin:55px 30px;animation:flap-r 0.3s ease-in-out infinite alternate}@keyframes flap-l{from{transform:rotate(0deg) scaleY(1)}to{transform:rotate(20deg) scaleY(0.4)}}@keyframes flap-r{from{transform:rotate(0deg) scaleY(1)}to{transform:rotate(-20deg) scaleY(0.4)}}</style><g fill="#1a1a1a"><path class="wing-left" d="M45 30C35 15 15 10 0 25C10 30 20 30 25 35C30 45 40 40 45 30Z"/><path class="wing-right" d="M55 30C65 15 85 10 100 25C90 30 80 30 75 35C70 45 60 40 55 30Z"/><path d="M50 20L44 10L46 22L54 22L56 10L50 20Z"/><circle cx="50" cy="30" r="8"/><circle cx="47" cy="28" r="2" fill="#FFFFFF"/><circle cx="53" cy="28" r="2" fill="#FFFFFF"/></g></svg>`,

  // W12: 도끼 투척
  AXE_THROW: "/axe.svg",

  // W13: 블랙홀
  BLACK_HOLE: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="20" fill="#000"/><circle cx="32" cy="32" r="22" stroke="#483D8B" stroke-width="2" fill="none"/><circle cx="32" cy="32" r="26" stroke="#8A2BE2" stroke-width="1" fill="none"/></svg>`,

  // W14: 차크람
  CHAKRAM: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cg" cx="50%" cy="50%" r="50%"><stop offset="60%" stop-color="#C0C0C0"/><stop offset="80%" stop-color="#E8E8E8"/><stop offset="100%" stop-color="#909090"/></radialGradient></defs><circle cx="32" cy="32" r="28" fill="url(#cg)"/><circle cx="32" cy="32" r="18" fill="#1a1a2e"/><circle cx="32" cy="32" r="22" stroke="#B8860B" stroke-width="2" fill="none"/><path d="M32 14C40 22 40 42 32 50" stroke="#C0C0C0" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 50C24 42 24 22 32 14" stroke="#C0C0C0" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 15C39 22 39 42 32 49" stroke="#FFF" stroke-width="1" fill="none" stroke-opacity="0.5" stroke-linecap="round"/><path d="M32 49C25 42 25 22 32 15" stroke="#FFF" stroke-width="1" fill="none" stroke-opacity="0.5" stroke-linecap="round"/><circle cx="32" cy="32" r="28" stroke="#E0E0E0" stroke-width="1.5" fill="none"/></svg>`,

  // W15: 화염 오라
  FIRE_AURA: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="24" stroke="#FF4500" stroke-width="2" fill="none"/><circle cx="32" cy="32" r="20" stroke="#FF8C00" stroke-width="2" fill="none" stroke-dasharray="4,4"/><circle cx="32" cy="32" r="8" fill="#FFD700"/></svg>`,

  // W16: 천둥 번개
  THUNDERSTORM: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 20C16 10 24 4 32 4C40 4 48 10 48 20C54 20 60 24 60 30C60 38 52 42 46 42H18C12 42 4 38 4 30C4 24 10 20 16 20Z" fill="#708090"/><path d="M36 42L26 54H32L28 64L42 50H34L36 42Z" fill="#FFD700"/></svg>`,

  // W17: 샷건
  SHOTGUN: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M10 28H40L54 22L54 42L40 36H10V28Z" fill="#696969"/><rect x="4" y="26" width="6" height="12" fill="#8B4513"/><circle cx="48" cy="28" r="2" fill="#000"/><circle cx="48" cy="36" r="2" fill="#000"/></svg>`,

  // W18: 역병 구름
  PLAGUE_CLOUD: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 24C12 24 8 28 8 34C8 42 16 46 22 46H42C48 46 56 42 56 34C56 26 48 22 42 22C40 16 32 14 26 18C22 18 16 20 16 24Z" fill="#556B2F"/><circle cx="24" cy="30" r="2" fill="#ADFF2F"/><circle cx="40" cy="36" r="3" fill="#ADFF2F"/><circle cx="30" cy="40" r="2" fill="#ADFF2F"/></svg>`,

  // W19: 얼음 파편
  ICE_SHARD: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 4L38 24L56 32L38 40L32 60L26 40L8 32L26 24Z" fill="#E0FFFF"/><path d="M32 4V60M8 32H56" stroke="#B0E0E6" stroke-width="1"/></svg>`,

  // W20: 메테오
  METEOR: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="44" r="12" fill="#8B4513"/><path d="M28 36L48 16L56 8L36 28" fill="#FF4500"/><path d="M56 8L44 8L56 20Z" fill="#FFD700"/></svg>`,
};
