# Full sprite archive comparison

Source: `phaser_assets_final (1).zip`

The source atlas and all 46 individual PNGs were validated against the previous production set, then promoted byte-for-byte as the new production assets. The previous atlas and sprite files were replaced; the temporary staging directory was removed.

## Atlas comparison

- Incoming atlas: 1600 × 2714 px, 4082994 bytes, 46 frames.
- Current atlas: 1600 × 2714 px, 4082994 bytes, 46 frames.
- Incoming atlas PNG alpha channel: yes.

## Individual PNG comparison

| File | Archive PNG dimensions | Current PNG dimensions | Current file comparison | Incoming atlas frame | Current atlas frame | Transparency metadata |
|---|---:|---:|---|---|---|---|
| sprite_00.png | 217 × 362 | 217 × 362 | identical | match | match | alpha channel | 
| sprite_01.png | 218 × 399 | 218 × 399 | identical | match | match | alpha channel | 
| sprite_02.png | 255 × 410 | 255 × 410 | identical | match | match | alpha channel | 
| sprite_03.png | 239 × 374 | 239 × 374 | identical | match | match | alpha channel | 
| sprite_04.png | 225 × 318 | 225 × 318 | identical | match | match | alpha channel | 
| sprite_05.png | 314 × 414 | 314 × 414 | identical | match | match | alpha channel | 
| sprite_06.png | 221 × 371 | 221 × 371 | identical | match | match | alpha channel | 
| sprite_07.png | 323 × 251 | 323 × 251 | identical | match | match | alpha channel | 
| sprite_08.png | 274 × 258 | 274 × 258 | identical | match | match | alpha channel | 
| sprite_09.png | 297 × 316 | 297 × 316 | identical | match | match | alpha channel | 
| sprite_10.png | 308 × 308 | 308 × 308 | identical | match | match | alpha channel | 
| sprite_11.png | 319 × 271 | 319 × 271 | identical | match | match | alpha channel | 
| sprite_12.png | 402 × 307 | 402 × 307 | identical | match | match | alpha channel | 
| sprite_13.png | 279 × 244 | 279 × 244 | identical | match | match | alpha channel | 
| sprite_14.png | 28 × 42 | 28 × 42 | identical | match | match | alpha channel | 
| sprite_15.png | 194 × 241 | 194 × 241 | identical | match | match | alpha channel | 
| sprite_16.png | 229 × 225 | 229 × 225 | identical | match | match | alpha channel | 
| sprite_17.png | 221 × 208 | 221 × 208 | identical | match | match | alpha channel | 
| sprite_18.png | 583 × 270 | 583 × 270 | identical | match | match | alpha channel | 
| sprite_19.png | 235 × 327 | 235 × 327 | identical | match | match | alpha channel | 
| sprite_20.png | 235 × 326 | 235 × 326 | identical | match | match | alpha channel | 
| sprite_21.png | 234 × 326 | 234 × 326 | identical | match | match | alpha channel | 
| sprite_22.png | 233 × 326 | 233 × 326 | identical | match | match | alpha channel | 
| sprite_23.png | 501 × 376 | 501 × 376 | identical | match | match | alpha channel | 
| sprite_24.png | 308 × 312 | 308 × 312 | identical | match | match | alpha channel | 
| sprite_25.png | 323 × 155 | 323 × 155 | identical | match | match | alpha channel | 
| sprite_26.png | 296 × 120 | 296 × 120 | identical | match | match | alpha channel | 
| sprite_27.png | 297 × 120 | 297 × 120 | identical | match | match | alpha channel | 
| sprite_28.png | 298 × 121 | 298 × 121 | identical | match | match | alpha channel | 
| sprite_29.png | 152 × 153 | 152 × 153 | identical | match | match | alpha channel | 
| sprite_30.png | 153 × 154 | 153 × 154 | identical | match | match | alpha channel | 
| sprite_31.png | 454 × 79 | 454 × 79 | identical | match | match | alpha channel | 
| sprite_32.png | 454 × 79 | 454 × 79 | identical | match | match | alpha channel | 
| sprite_33.png | 143 × 152 | 143 × 152 | identical | match | match | alpha channel | 
| sprite_34.png | 149 × 202 | 149 × 202 | identical | match | match | alpha channel | 
| sprite_35.png | 163 × 146 | 163 × 146 | identical | match | match | alpha channel | 
| sprite_36.png | 133 × 151 | 133 × 151 | identical | match | match | alpha channel | 
| sprite_37.png | 166 × 167 | 166 × 167 | identical | match | match | alpha channel | 
| sprite_38.png | 149 × 172 | 149 × 172 | identical | match | match | alpha channel | 
| sprite_39.png | 161 × 154 | 161 × 154 | identical | match | match | alpha channel | 
| sprite_40.png | 327 × 168 | — | not present in current folder | match | match | alpha channel | 
| gem_blue.png | 151 × 248 | — | not present in current folder | match | match | alpha channel | 
| gem_green.png | 152 × 243 | — | not present in current folder | match | match | alpha channel | 
| gem_purple.png | 158 × 250 | — | not present in current folder | match | match | alpha channel | 
| gem_red.png | 155 × 248 | — | not present in current folder | match | match | alpha channel | 
| gem_yellow.png | 152 × 245 | — | not present in current folder | match | match | alpha channel | 

## Summary

- Source PNGs inspected: 46
- Incoming atlas frames matching source PNG dimensions: 46
- Incoming atlas frame dimension mismatches: 0
- Existing current PNGs with different dimensions: 0
- Existing current PNGs byte-identical to archive: 40

Transparency metadata indicates an alpha channel or tRNS chunk; pixel-level alpha values have not been decoded. Atlas frame checks compare dimensions only, not visual cropping or pixel content. The previous production atlas and sprite files were replaced with the validated source archive.
