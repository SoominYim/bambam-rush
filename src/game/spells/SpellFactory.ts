import { EntityManager } from '../EntityManager';
import { Projectile } from './Projectile';
import { SpellType } from '../../types';
import { Vector2D } from '../../types';

export class SpellFactory {
    static createSpell(type: SpellType, origin: Vector2D, target: Vector2D) {
        const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
        
        // Multi-projectile logic for specific elements could go here
        const projectile = new Projectile(origin.x, origin.y, angle, type);
        EntityManager.getInstance().addEntity(projectile);
        
        // Example: Wind spell creates 2 smaller projectiles?
        // if (type === SpellType.WIND) { ... }
    }
    
    static createComboSpell(comboName: string, origin: Vector2D, target: Vector2D) {
        // Handle combo creation (simplified for now)
        console.log(`Casting Combo: ${comboName}`);
        
        // Example implementation for Steam Blast (Fire + Water)
        if (comboName === 'Storm') {
             // Create multiple projectiles or a large AOE entity
             const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
             const p = new Projectile(origin.x, origin.y, angle, SpellType.WIND); // Placeholder
             p.color = 'purple';
             p.radius = 30;
             p.damage = 50;
             EntityManager.getInstance().addEntity(p);
        }
    }
}
