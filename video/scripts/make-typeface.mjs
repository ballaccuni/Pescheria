// Converte i font Lexend (WOFF) nel formato "typeface" letto dal motore 3D (three.js).
// Uso: node scripts/make-typeface.mjs
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const here = path.dirname(new URL(import.meta.url).pathname);
const CHARS = "PESCHERIAapore di Mare Raffadali ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàèéìòù'.,!-";

for (const weight of ["500", "600"]) {
  const font = opentype.loadSync(path.join(here, "fonts", `lexend-${weight}.woff`));
  const glyphs = {};
  for (const ch of new Set(CHARS)) {
    const g = font.charToGlyph(ch);
    if (!g) continue;
    const o = [];
    for (const c of g.path.commands) {
      const r = (v) => Math.round(v);
      if (c.type === "M") o.push("m", r(c.x), r(c.y));
      else if (c.type === "L") o.push("l", r(c.x), r(c.y));
      else if (c.type === "Q") o.push("q", r(c.x), r(c.y), r(c.x1), r(c.y1));
      else if (c.type === "C") o.push("b", r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
    }
    const bb = g.getBoundingBox();
    glyphs[ch] = { ha: Math.round(g.advanceWidth), x_min: Math.round(bb.x1), x_max: Math.round(bb.x2), o: o.join(" ") };
  }
  const out = {
    glyphs,
    familyName: "Lexend",
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: { yMin: font.tables.head.yMin, xMin: font.tables.head.xMin, yMax: font.tables.head.yMax, xMax: font.tables.head.xMax },
    resolution: font.unitsPerEm,
    original_font_information: { format: 0, fontFamily: "Lexend", fontSubfamily: weight },
    cssFontWeight: weight,
    cssFontStyle: "normal",
  };
  fs.writeFileSync(path.join(here, "..", "src", "fonts", `lexend-${weight}.json`), JSON.stringify(out));
  console.log(weight, Object.keys(glyphs).length, "glifi");
}
