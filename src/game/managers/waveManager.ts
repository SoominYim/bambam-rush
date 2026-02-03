import { createEnemy } from "@/game/entities/enemy";
import { createBoss } from "@/game/entities/boss";
import { addEnemy, getPlayer } from "@/game/managers/entityStore";
import * as CONFIG from "@/game/config/constants";
import { EnemyType } from "@/game/types";

interface WaveConfig {
  startTime: number; // seconds
  endTime: number;
  spawnInterval: number; // seconds
  enemyType: EnemyType;
  maxEnemies?: number;
}

const WAVES: WaveConfig[] = [
  { startTime: 0, endTime: 60, spawnInterval: 2, enemyType: EnemyType.BASIC },
  { startTime: 60, endTime: 120, spawnInterval: 1.5, enemyType: EnemyType.FAST },
  { startTime: 120, endTime: 180, spawnInterval: 1, enemyType: EnemyType.BASIC },
  { startTime: 180, endTime: 300, spawnInterval: 0.8, enemyType: EnemyType.TANK },
  { startTime: 300, endTime: 9999, spawnInterval: 0.5, enemyType: EnemyType.BOSS }, // Boss Wave
];

class WaveManager {
  private playTime: number = 0;
  private spawnTimer: number = 0;
  private currentWaveIndex: number = 0;
  private isBossSpawned: boolean = false;

  update(deltaTime: number) {
    this.playTime += deltaTime;
    this.spawnTimer += deltaTime;

    const currentWave = WAVES[this.currentWaveIndex];

    // Check for next wave
    if (this.playTime > currentWave.endTime && this.currentWaveIndex < WAVES.length - 1) {
      this.currentWaveIndex++;
      console.log(`Wave ${this.currentWaveIndex + 1} Started!`);
    }

    // Spawn Logic
    if (this.spawnTimer > currentWave.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy(currentWave.enemyType);
    }

    // Boss Spawn Check (Specific logic if needed, e.g., only one boss)
    if (currentWave.enemyType === EnemyType.BOSS && !this.isBossSpawned) {
      this.isBossSpawned = true;
      const player = getPlayer();
      if (player) {
        // Spawn Boss far away but within bounds
        const angle = Math.random() * Math.PI * 2;
        const distance = CONFIG.ENEMY_SPAWN_DISTANCE * 1.5;
        const x = player.position.x + Math.cos(angle) * distance;
        const y = player.position.y + Math.sin(angle) * distance;

        const boss = createBoss(x, y);
        addEnemy(boss);
        console.log("BOSS SPAWNED!");
      }
    }
  }

  private spawnEnemy(type: EnemyType) {
    const player = getPlayer();
    if (!player) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = CONFIG.ENEMY_SPAWN_DISTANCE;
    const x = player.position.x + Math.cos(angle) * distance;
    const y = player.position.y + Math.sin(angle) * distance;

    if (x >= 0 && x <= CONFIG.WORLD_WIDTH && y >= 0 && y <= CONFIG.WORLD_HEIGHT) {
      const enemy = createEnemy(x, y, type);
      addEnemy(enemy);
    }
  }

  getPlayTime() {
    return this.playTime;
  }

  reset() {
    this.playTime = 0;
    this.spawnTimer = 0;
    this.currentWaveIndex = 0;
    this.isBossSpawned = false;
  }
}

export const waveManager = new WaveManager();
