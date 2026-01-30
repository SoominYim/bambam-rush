// ===== WORLD CONFIG =====
export const WORLD_WIDTH = 50000;
export const WORLD_HEIGHT = 50000;

// ===== PLAYER BASE STATS =====
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_ATK = 1.0;
export const PLAYER_BASE_DEF = 5;
export const PLAYER_BASE_FIRE_RATE = 1.0;
export const PLAYER_SPEED = 180;
export const PLAYER_RADIUS = 12;

// ===== SNAKE CONFIG =====
export const SNAKE_SEGMENT_SPACING = 35;
export const SNAKE_SEGMENT_RADIUS = 15;
export const SNAKE_SEGMENT_DISTANCE = 35;

// ===== SPAWN RATES =====
export const COLLECTIBLE_SPAWN_CHANCE = 0.015;
export const ENEMY_SPAWN_CHANCE = 0.01;

// ===== SPAWN RANGE =====
export const COLLECTIBLE_SPAWN_RANGE = 1000;
export const ENEMY_SPAWN_DISTANCE = 800;

// ===== ENEMY CONFIG =====
export const ENEMY_BASE_SPEED = 70;
export const ENEMY_SPEED_VARIANCE = 50;
export const ENEMY_BASE_HP = 100;
export const ENEMY_DAMAGE = 10;
export const ENEMY_RADIUS = 15;
export const ENEMY_HIT_RADIUS = 20;

// ===== COMBAT BALANCING =====
export const TURRET_RANGE = 400;
export const TURRET_BASE_FIRE_RATE = 1500; // 1.5초 (초기 공속 대폭 하향)
export const TURRET_FIRE_RATE_PER_TIER = 100; // 티어당 100ms 감소
export const PROJECTILE_BASE_SPEED = 400;
export const PROJECTILE_SPEED_PER_TIER = 50;
export const PROJECTILE_BASE_DAMAGE = 30;
export const PROJECTILE_RADIUS_BASE = 5;
export const PROJECTILE_RADIUS_PER_TIER = 2;
export const PROJECTILE_HIT_RADIUS = 20;

// ===== SKILL BEHAVIOR CONFIG =====
export const ORBITAL_RADIUS = 60;
export const ORBITAL_ROTATION_SPEED = 3; // Radians per second
export const AREA_DURATION_BASE = 3000; // ms
export const MELEE_RANGE = 80;

// ===== CAMERA CONFIG =====
export const CAMERA_SMOOTHING = 0.1;

// ===== UI CONFIG =====
export const MINIMAP_SIZE = 150;
export const MINIMAP_MARGIN = 20;
export const MINIMAP_VISIBLE_RANGE = 2000;

// ===== PERFORMANCE CONFIG =====
export const MAX_DELTA_TIME = 0.1;
export const MIN_DELTA_TIME = 0.001;
export const DEFAULT_DELTA_TIME = 0.016;
export const SCORE_UPDATE_INTERVAL = 500; // ms

// ===== GRID CONFIG =====
export const GRID_SIZE = 50;
export const GRID_COLOR = "#1a1a1a";
export const GRID_LINE_WIDTH = 1;

// ===== COLLECTION CONFIG =====
export const COLLECTION_RADIUS = 40;
export const COLLECTION_SCORE = 10;
