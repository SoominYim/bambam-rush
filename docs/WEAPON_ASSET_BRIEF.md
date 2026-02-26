# Weapon Asset Brief

## Goal
- Remove interpretation gaps from weapon names.
- Lock art output direction for the current `SVG + Canvas` pipeline.
- Keep briefs aligned with `src/game/config/weaponRegistry.ts`.

## Required 5-Field Template
- `Silhouette`: shape keywords
- `Material/Texture`: surface and material keywords
- `Primary Color`: dominant palette
- `VFX Keyword`: hit/cast/impact effect keywords
- `Animation Keyword`: motion and timing keywords

## Pattern Asset Packs
- `orbit`: icon, world sprite (1-2), trail/arc, hit spark
- `projectile/line/linear`: icon, projectile, impact, muzzle/launch
- `area/vortex/trap`: icon, ground loop texture, edge, tick hit
- `beam`: icon, beam body, start cap, end cap, charge/sweep
- `chain/bounce/spread`: icon, base projectile, jump/ricochet/split impact
- `flame/nuke/sky/bat`: icon, cast effect, duration/telegraph component

## Full Weapon Briefs (W01-W20)

### W01 Guardian Sword
- Pattern/Role: `orbit`, close guard + stab chase
- Silhouette: short guardian blade with clear tip
- Material/Texture: polished steel + faint runic edge
- Primary Color: silver + pale blue accent
- VFX Keyword: slash spark, guard arc
- Animation Keyword: tight orbit, short dash stab
- Identity: permanent orbit blade that pokes nearby threats

### W02 Magic Missile
- Pattern/Role: `projectile`, nearest-target homing shot
- Silhouette: slim dart with glowing tail
- Material/Texture: arcane energy bolt
- Primary Color: indigo + cyan core
- VFX Keyword: arcane trail, homing hit flash
- Animation Keyword: seek, curve, impact burst
- Identity: reliable lock-on single/multi missile

### W03 Fireball
- Pattern/Role: `line`, burn-focused straight shot
- Silhouette: compact orb + short flame tail
- Material/Texture: plasma core + thin flame shell
- Primary Color: orange-red + yellow core
- VFX Keyword: burn, ember, mini explosion
- Animation Keyword: fast travel, short trail
- Identity: single-shot projectile, not sustained spray

### W04 Chain Lightning
- Pattern/Role: `chain`, first hit then electric jumps
- Silhouette: forked electric arc segments
- Material/Texture: ionized plasma thread
- Primary Color: electric blue + white spikes
- VFX Keyword: chain arc, crackle burst
- Animation Keyword: snap jump, instant branch
- Identity: visible enemy-to-enemy transfer rhythm

### W05 Poison Puddle
- Pattern/Role: `area`, thrown persistent DoT zone
- Silhouette: irregular toxic puddle blob
- Material/Texture: viscous liquid + bubbling edge
- Primary Color: acid green + dark olive edge
- VFX Keyword: poison bubble, corrosion puff
- Animation Keyword: splat spawn, looping simmer
- Identity: space control via ground damage field

### W06 Boomerang
- Pattern/Role: `return`, outbound/inbound pierce blade
- Silhouette: curved twin-edge boomerang
- Material/Texture: sharpened metal with wind grooves
- Primary Color: steel + teal streak
- VFX Keyword: wind trail, cut spark
- Animation Keyword: outward throw, return sweep
- Identity: two-pass hit line with heavy pierce value

### W07 Frost Nova
- Pattern/Role: `projectile`, impact explosion with chill/freeze
- Silhouette: icy orb with crystal spikes
- Material/Texture: frosted crystal core
- Primary Color: ice cyan + white
- VFX Keyword: frost burst, ice shard pop
- Animation Keyword: glide shot, impact nova
- Identity: hit-triggered cold CC explosion

### W08 Guardian Orb
- Pattern/Role: `orbit`, defensive contact damage orbit
- Silhouette: smooth orb with inner halo
- Material/Texture: hard-light sphere
- Primary Color: white + gold/sky glow
- VFX Keyword: shield pulse, holy spark
- Animation Keyword: close orbit, steady spin
- Identity: sustained near-body collision DPS

### W09 Needle Mine
- Pattern/Role: `trap`, deployed trigger bomb
- Silhouette: disk body + top spike + warning core
- Material/Texture: rough metal body, scratched surface
- Primary Color: gunmetal + red warning light
- VFX Keyword: spike burst, shrapnel pop
- Animation Keyword: arm -> trigger -> radial burst
- Identity: deploy/trap style, no chase behavior

### W10 Laser Beam
- Pattern/Role: `beam`, wide piercing line cast
- Silhouette: thick linear beam with start/end caps
- Material/Texture: concentrated photonic line
- Primary Color: cyan + white core
- VFX Keyword: beam burn, line scorch
- Animation Keyword: quick charge, beam hold
- Identity: instant lane-clearing pierce damage

### W11 Bat Summon
- Pattern/Role: `bat`, life-steal summon swarm
- Silhouette: multiple small bats with sharp wing edges
- Material/Texture: organic membrane + shadow rim
- Primary Color: deep purple + crimson accent
- VFX Keyword: bite spark, blood siphon
- Animation Keyword: flutter, swoop, return orbit
- Identity: multi-minion attack loop, not a single bullet

### W12 Axe Throw
- Pattern/Role: `projectile`, heavy arc throw with pierce
- Silhouette: thick one-hand axe silhouette
- Material/Texture: iron blade + wood grip
- Primary Color: dark steel + brown
- VFX Keyword: heavy hit spark, metal thud
- Animation Keyword: arc throw, spin travel
- Identity: slow but heavy-feel piercing throw

### W13 Black Hole
- Pattern/Role: `vortex`, impact-created gravity zone
- Silhouette: dark core sphere + distortion ring
- Material/Texture: space distortion field
- Primary Color: black-violet + neon rim
- VFX Keyword: gravity pull, event ripple
- Animation Keyword: slow drift, collapse pulse
- Identity: crowd pull/control after impact

### W14 Chakram
- Pattern/Role: `bounce`, ricochet spinning blade
- Silhouette: circular ring blade with inner void
- Material/Texture: sharpened alloy ring
- Primary Color: silver + green wind accent
- VFX Keyword: ricochet spark, slicing streak
- Animation Keyword: spin flight, bounce redirect
- Identity: repeated enemy-to-enemy ricochet cuts

### W15 Inferno
- Pattern/Role: `flame`, cone-like sustained burn
- Silhouette: fan/cone flame stream
- Material/Texture: high-heat gas + turbulent flame layers
- Primary Color: yellow -> orange -> red gradient
- VFX Keyword: sustained flame, heat haze
- Animation Keyword: continuous spray, cone tick
- Identity: short-mid range sustained DPS, not burst projectile

### W16 Thunderstorm
- Pattern/Role: `sky`, random strikes from above
- Silhouette: vertical bolt column + impact ring
- Material/Texture: storm plasma channel
- Primary Color: yellow-white + blue fringe
- VFX Keyword: lightning strike, shock ring
- Animation Keyword: sky telegraph, sudden drop
- Identity: random map pressure from top-down hits

### W17 Shotgun
- Pattern/Role: `spread`, close-range cone pellet burst
- Silhouette: fan spread of small pellet streaks
- Material/Texture: ballistic pellets + smoke flash
- Primary Color: orange muzzle + gray pellets
- VFX Keyword: muzzle flash, pellet impact pop
- Animation Keyword: burst fire, cone spread
- Identity: close-range burst scaling with pellet count

### W18 Senbonzakura
- Pattern/Role: `orbit`, petal blade orbit + chase slash
- Silhouette: petal-shaped blade cluster
- Material/Texture: thin metal + sakura energy glow
- Primary Color: pink + mint highlight
- VFX Keyword: petal trail, slash line
- Animation Keyword: orbit -> dash -> return
- Identity: petal blade traces and slash rhythm are mandatory

### W19 Phase Mark Lance
- Pattern/Role: `linear`, mark then re-hit detonate/link
- Silhouette: slim arcane-tech spear + mark glyph
- Material/Texture: crystal core + energy shaft
- Primary Color: violet + white core
- VFX Keyword: phase mark, link burst, arc line
- Animation Keyword: first hit mark, re-hit detonate, chain link
- Identity: first-hit mark then re-hit detonation/link rule

### W20 Meteor
- Pattern/Role: `nuke`, delayed wide-area finisher
- Silhouette: large falling rock + flame tail
- Material/Texture: rough rock + lava cracks
- Primary Color: dark rock + lava orange
- VFX Keyword: descent streak, impact crater, shockwave
- Animation Keyword: telegraph -> drop -> large impact
- Identity: delayed wide-area finisher with clear telegraph

## Naming Rules
- Split UI display text and internal asset key.
- Example:
  - `displayName: "Phase Mark Lance"`
  - `assetKey: "phase_lance"`

## Evolved Weapon (Currently Registered)

### W06_EVO Storm Ruler
- Pattern/Role: `return`, giant storm boomerang with high pierce
- Silhouette: oversized double-blade boomerang with storm fins
- Material/Texture: alloy blade + charged wind plasma
- Primary Color: steel gray + storm cyan
- VFX Keyword: cyclone trail, thunder cut spark
- Animation Keyword: fast spin throw, heavy return sweep
- Identity: upgraded boomerang lane control with larger size/count
