# Full sprite archive comparison

Source: `phaser_assets_final (1).zip`

The complete source atlas and all 46 individual PNGs were extracted byte-for-byte into `public/assets/phaser-assets/archive-final/`. The current production atlas and its sprite files were left unchanged.

## Atlas comparison

- Incoming atlas: 1600 × 2714 px, 4082994 bytes, 46 frames.
- Current atlas: 1600 × 3326 px, 4065501 bytes, 40 frames.
- Incoming atlas PNG alpha channel: yes.

## Individual PNG comparison

| File | Archive PNG dimensions | Current PNG dimensions | Current file comparison | Incoming atlas frame | Current atlas frame | Transparency metadata |
|---|---:|---:|---|---|---|---|
| sprite_00.png | 217 × 362 | 239 × 389 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_01.png | 218 × 399 | 236 × 424 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_02.png | 255 × 410 | 276 × 439 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_03.png | 239 × 374 | 259 × 404 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_04.png | 225 × 318 | 340 × 765 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_05.png | 314 × 414 | 235 × 383 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_06.png | 221 × 371 | 248 × 344 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_07.png | 323 × 251 | 251 × 340 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_08.png | 274 × 258 | 326 × 339 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_09.png | 297 × 316 | 323 × 331 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_10.png | 308 × 308 | 753 × 330 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_11.png | 319 × 271 | 106 × 75 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_12.png | 402 × 307 | 110 × 169 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_13.png | 279 × 244 | 241 × 310 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_14.png | 28 × 42 | 108 × 171 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_15.png | 194 × 241 | 296 × 278 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_16.png | 229 × 225 | 182 × 228 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_17.png | 221 × 208 | 226 × 227 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_18.png | 583 × 270 | 794 × 406 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_19.png | 235 × 327 | 318 × 396 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_20.png | 235 × 326 | 238 × 571 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_21.png | 234 × 326 | 222 × 412 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_22.png | 233 × 326 | 222 × 412 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_23.png | 501 × 376 | 519 × 420 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_24.png | 308 × 312 | 269 × 270 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_25.png | 323 × 155 | 454 × 151 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_26.png | 296 × 120 | 446 × 143 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_27.png | 297 × 120 | 173 × 170 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_28.png | 298 × 121 | 658 × 102 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_29.png | 152 × 153 | 650 × 120 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_30.png | 153 × 154 | 189 × 187 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_31.png | 454 × 79 | 168 × 200 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_32.png | 454 × 79 | 455 × 151 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_33.png | 143 × 152 | 446 × 143 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_34.png | 149 × 202 | 153 × 154 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_35.png | 163 × 146 | 108 × 166 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_36.png | 133 × 151 | 166 × 147 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_37.png | 166 × 167 | 194 × 167 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_38.png | 149 × 172 | 149 × 174 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_39.png | 161 × 154 | 319 × 152 | DIFFERENT DIMENSIONS | match | MISMATCH | alpha channel | 
| sprite_40.png | 327 × 168 | — | not present in current folder | match | no frame | alpha channel | 
| gem_blue.png | 151 × 248 | — | not present in current folder | match | no frame | alpha channel | 
| gem_green.png | 152 × 243 | — | not present in current folder | match | no frame | alpha channel | 
| gem_purple.png | 158 × 250 | — | not present in current folder | match | no frame | alpha channel | 
| gem_red.png | 155 × 248 | — | not present in current folder | match | no frame | alpha channel | 
| gem_yellow.png | 152 × 245 | — | not present in current folder | match | no frame | alpha channel | 

## Summary

- Source PNGs inspected: 46
- Incoming atlas frames matching source PNG dimensions: 46
- Incoming atlas frame dimension mismatches: 0
- Existing current PNGs with different dimensions: 40
- Existing current PNGs byte-identical to archive: 0

Transparency metadata indicates an alpha channel or tRNS chunk; pixel-level alpha values have not been decoded. Atlas frame checks compare dimensions only, not visual cropping or pixel content. No production asset was replaced.
