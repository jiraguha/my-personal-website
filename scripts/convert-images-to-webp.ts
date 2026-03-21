import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.resolve(import.meta.dir, "../public");
const QUALITY = 80;

const targets = [
  ...fs.readdirSync(path.join(PUBLIC, "assets/covers")).flatMap((slug) => {
    const dir = path.join(PUBLIC, "assets/covers", slug);
    if (!fs.statSync(dir).isDirectory()) return [];
    const cover = path.join(dir, "cover.png");
    return fs.existsSync(cover) ? [cover] : [];
  }),
  path.join(PUBLIC, "assets/authors/jp.png"),
].filter((f) => fs.existsSync(f));

console.log(`Converting ${targets.length} images to WebP...\n`);

let converted = 0;
for (const src of targets) {
  const dest = src.replace(/\.png$/, ".webp");
  if (fs.existsSync(dest)) {
    console.log(`  skip (exists): ${path.relative(PUBLIC, dest)}`);
    continue;
  }
  const srcSize = fs.statSync(src).size;
  await sharp(src).webp({ quality: QUALITY }).toFile(dest);
  const destSize = fs.statSync(dest).size;
  const saving = Math.round((1 - destSize / srcSize) * 100);
  console.log(
    `  ${path.relative(PUBLIC, src)} → .webp (${(srcSize / 1024).toFixed(0)}KB → ${(destSize / 1024).toFixed(0)}KB, -${saving}%)`,
  );
  converted++;
}

console.log(`\nDone. Converted ${converted} image(s).`);
