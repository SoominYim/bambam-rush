// ===== WORLD CONFIG =====
export const WORLD_WIDTH = 50000; // 무한 맵 느낌
export const WORLD_HEIGHT = 50000;

// ===== PLAYER CONFIG =====
export const PLAYER_SPEED = 250;
export const PLAYER_RADIUS = 12;
export const SNAKE_SEGMENT_SPACING = 35;
export const SNAKE_SEGMENT_RADIUS = 15;

// ===== SPAWN RATES =====
export const COLLECTIBLE_SPAWN_CHANCE = 0.015;
export const ENEMY_SPAWN_CHANCE = 0.01;

// ===== SPAWN RANGE =====
export const COLLECTIBLE_SPAWN_RANGE = 1000; // 플레이어 주변 반경 (미니맵 범위 내)
export const ENEMY_SPAWN_DISTANCE = 800; // 화면 밖 적 스폰 거리

// ===== SPAWN POSITIONS =====
export const COLLECTIBLE_SPAWN_MIN_MARGIN = 100;
export const COLLECTIBLE_SPAWN_MAX_MARGIN = 100;
export const ENEMY_SPAWN_OFFSET = 150; // 화면 밖 거리

// ===== ENEMY CONFIG =====
export const ENEMY_BASE_SPEED = 100;
export const ENEMY_SPEED_VARIANCE = 50;
export const ENEMY_BASE_HP = 100;
export const ENEMY_DAMAGE = 10;
export const ENEMY_RADIUS = 15;

// ===== COMBAT CONFIG =====
export const PROJECTILE_BASE_SPEED = 400;
export const PROJECTILE_SPEED_PER_TIER = 50;
export const PROJECTILE_BASE_DAMAGE = 30;
export const TURRET_RANGE = 300;
export const TURRET_BASE_FIRE_RATE = 300;
export const TURRET_FIRE_RATE_PER_TIER = 50;

// ===== CAMERA CONFIG =====
export const CAMERA_SMOOTHING = 0.1;

// ===== UI CONFIG =====
export const MINIMAP_SIZE = 150;
export const MINIMAP_MARGIN = 20;
export const MINIMAP_VISIBLE_RANGE = 2000; // 미니맵에 표시되는 범위 (반경)

// ===== PERFORMANCE CONFIG =====
export const MAX_DELTA_TIME = 0.1; // 최대 프레임 시간 (초)
export const MIN_DELTA_TIME = 0.001; // 최소 프레임 시간 (초)
export const DEFAULT_DELTA_TIME = 0.016; // 기본 60fps
export const SCORE_UPDATE_INTERVAL = 500; // ms

// ===== GRID CONFIG =====
export const GRID_SIZE = 50;
export const GRID_COLOR = "#1a1a1a";
export const GRID_LINE_WIDTH = 1;

// ===== COLLECTION CONFIG =====
export const COLLECTION_RADIUS = 40; // 아이템 획득 거리
export const COLLECTION_SCORE = 10; // 아이템 획득 점수
