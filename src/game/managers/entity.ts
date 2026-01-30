import { GameObject } from "@/game/types";

export class EntityManager {
  private static instance: EntityManager;
  private entities: GameObject[] = [];

  private constructor() {}

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  public addEntity(entity: GameObject) {
    this.entities.push(entity);
  }

  public update(deltaTime: number) {
    // Update all entities
    this.entities.forEach(entity => entity.update(deltaTime));

    // Remove expired entities
    this.entities = this.entities.filter(entity => !entity.isExpired);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Sort by y position for basic depth sorting (optional) or just draw
    this.entities.forEach(entity => entity.draw(ctx));
  }

  public getEntities(): GameObject[] {
    return this.entities;
  }

  public clear() {
    this.entities = [];
  }
}
