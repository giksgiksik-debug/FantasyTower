# FantasyTower sprite catalog

Source: `public/assets/phaser-assets/atlas.json` and the visible 40-sprite gallery.

The atlas contains 40 frames. The shared texture key loaded by `BootScene` is `game-atlas`.

| IDs | Visual group | Notes |
|---|---|---|
| sprite_00–sprite_10 | Unclassified game art | Individual art objects are present; gameplay identity is not assigned yet. |
| sprite_11 | Placement marker | Round stone pad/marker, visually confirmed in the gallery. |
| sprite_12–sprite_17 | Effects and magic | Flame, elemental and magical-looking artwork; exact effects are not assigned. |
| sprite_18–sprite_27 | Interface panels and controls | Frames, vertical panels and button/control artwork. |
| sprite_28–sprite_29 | Status bars | Red and purple horizontal bars. |
| sprite_30–sprite_39 | Icons and resources | Weapon/defence-style icons, resource symbols, heart, stars and skull. |

## Frame dimensions

| Frame | Width | Height | Visual group |
|---|---:|---:|---|
| sprite_00 | 239 | 389 | unclassified-game-art |
| sprite_01 | 236 | 424 | unclassified-game-art |
| sprite_02 | 276 | 439 | unclassified-game-art |
| sprite_03 | 259 | 404 | unclassified-game-art |
| sprite_04 | 340 | 765 | unclassified-game-art |
| sprite_05 | 235 | 383 | unclassified-game-art |
| sprite_06 | 248 | 344 | unclassified-game-art |
| sprite_07 | 251 | 340 | unclassified-game-art |
| sprite_08 | 326 | 339 | unclassified-game-art |
| sprite_09 | 323 | 331 | unclassified-game-art |
| sprite_10 | 753 | 330 | unclassified-game-art |
| sprite_11 | 106 | 75 | placement-marker |
| sprite_12 | 110 | 169 | effects-and-magic |
| sprite_13 | 241 | 310 | effects-and-magic |
| sprite_14 | 108 | 171 | effects-and-magic |
| sprite_15 | 296 | 278 | effects-and-magic |
| sprite_16 | 182 | 228 | effects-and-magic |
| sprite_17 | 226 | 227 | effects-and-magic |
| sprite_18 | 794 | 406 | interface-panels-and-controls |
| sprite_19 | 318 | 396 | interface-panels-and-controls |
| sprite_20 | 238 | 571 | interface-panels-and-controls |
| sprite_21 | 222 | 412 | interface-panels-and-controls |
| sprite_22 | 222 | 412 | interface-panels-and-controls |
| sprite_23 | 519 | 420 | interface-panels-and-controls |
| sprite_24 | 269 | 270 | interface-panels-and-controls |
| sprite_25 | 454 | 151 | interface-panels-and-controls |
| sprite_26 | 446 | 143 | interface-panels-and-controls |
| sprite_27 | 173 | 170 | interface-panels-and-controls |
| sprite_28 | 658 | 102 | status-bars |
| sprite_29 | 650 | 120 | status-bars |
| sprite_30 | 189 | 187 | icons-and-resources |
| sprite_31 | 168 | 200 | icons-and-resources |
| sprite_32 | 455 | 151 | icons-and-resources |
| sprite_33 | 446 | 143 | icons-and-resources |
| sprite_34 | 153 | 154 | icons-and-resources |
| sprite_35 | 108 | 166 | icons-and-resources |
| sprite_36 | 166 | 147 | icons-and-resources |
| sprite_37 | 194 | 167 | icons-and-resources |
| sprite_38 | 149 | 174 | icons-and-resources |
| sprite_39 | 319 | 152 | icons-and-resources |

## Integration

Use `addSprite(scene, 'sprite_11', x, y, options)` from `src/systems/SpriteAssets.js` to instantiate a frame from the shared atlas. The helper validates the frame before creating it. The original world map is unchanged.

Gameplay assignments, tower types, enemy types, stats and balance are deliberately left undefined until the game design specifies them.
