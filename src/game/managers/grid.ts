import { GameObject, Enemy } from "@/game/types";

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<GameObject>> = new Map();

  constructor(cellSize: number = 500) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  clear() {
    this.grid.clear();
  }

  insert(entity: GameObject) {
    const key = this.getCellKey(entity.position.x, entity.position.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(entity);
  }

  getNearbyEnemies(x: number, y: number, radius: number): Enemy[] {
    const nearby: Enemy[] = [];
    const startX = Math.floor((x - radius) / this.cellSize);
    const endX = Math.floor((x + radius) / this.cellSize);
    const startY = Math.floor((y - radius) / this.cellSize);
    const endY = Math.floor((y + radius) / this.cellSize);

    const radiusSq = radius * radius;

    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(entity => {
            // We assume only enemies are queried here or we filter by type/property
            if ("hp" in entity) {
              // Type guard for Enemy
              const dx = entity.position.x - x;
              const dy = entity.position.y - y;
              if (dx * dx + dy * dy <= radiusSq) {
                nearby.push(entity as Enemy);
              }
            }
          });
        }
      }
    }
    return nearby;
  }
}

export const spatialGrid = new SpatialGrid(500);
