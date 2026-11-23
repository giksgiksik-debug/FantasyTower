# FantasyTower sprite catalog

Source: `public/assets/phaser-assets/atlas.png` and `atlas.json`.

This catalog records **visual identification only**. It does not assign gameplay behavior, tower statistics, enemy types, prices, damage, targeting rules, or wave roles. Those remain undefined until the game design is approved.

## Character and creature artwork

| Sprite | Visual identification | Status |
|---|---|---|
| `sprite_00`–`sprite_09` | Individual fantasy character / unit-like artwork | Exact identities and whether these are towers, defenders, or enemies are unconfirmed |
| `sprite_10` | Wide composite containing purple and orange creature-like artwork | Needs source confirmation before slicing or assigning separate entities |

## Placement, crystals, and effects

| Sprite | Visual identification | Status |
|---|---|---|
| `sprite_11` | Round platform / placement marker | Visual role only |
| `sprite_12` | Gold crystal | Could be a resource or an effect; gameplay role unconfirmed |
| `sprite_13` | Multi-crystal cluster | Gameplay role unconfirmed |
| `sprite_14` | Blue crystal | Could be a resource or an effect; gameplay role unconfirmed |
| `sprite_15` | Organic / creature-like artwork | Exact identity unconfirmed |
| `sprite_16` | Lightning / impact effect | Visual effect |
| `sprite_17` | Purple magic effect | Visual effect |

## Interface panels and controls

| Sprite | Visual identification |
|---|---|
| `sprite_18` | Wide framed interface panel |
| `sprite_19` | Portrait interface panel |
| `sprite_20` | Tall framed interface element |
| `sprite_21` | Tall framed interface element |
| `sprite_22` | Tall framed interface element |
| `sprite_23` | Grid / inventory-style interface panel |
| `sprite_24` | Green square frame / selection outline |
| `sprite_25` | Green framed button |
| `sprite_26` | Gold framed button |
| `sprite_27` | Pause control icon |
| `sprite_32` | Blue framed button |
| `sprite_33` | Red framed button |

## Status bars

| Sprite | Visual identification |
|---|---|
| `sprite_28` | Red health-style bar |
| `sprite_29` | Purple/blue energy-style bar |

## Icons and resources

| Sprite | Visual identification | Status |
|---|---|---|
| `sprite_30` | Crossed swords icon | Combat-related visual; exact UI use unconfirmed |
| `sprite_31` | Shield icon | Defense-related visual; exact UI use unconfirmed |
| `sprite_34` | Gold coin icon | Currency-like visual; economy rules unconfirmed |
| `sprite_35` | Blue gem icon | Resource-like visual; economy rules unconfirmed |
| `sprite_36` | Heart icon | Health/life-like visual; exact use unconfirmed |
| `sprite_37` | Two-star rating icon | Rating/progression-like visual |
| `sprite_38` | Skull icon | Defeat/enemy-like visual; exact use unconfirmed |
| `sprite_39` | Three-star rating icon | Rating/progression-like visual |

## Integration rules

1. Keep the original world map unchanged.
2. Keep the atlas source files unchanged; use named frames from the atlas.
3. Do not treat the visual labels as gameplay definitions.
4. Do not create tower/enemy classes or balance data until the approved game rules identify their roles.
5. Before using `sprite_10` as separate objects, confirm whether it is one composite image or multiple intended elements.
