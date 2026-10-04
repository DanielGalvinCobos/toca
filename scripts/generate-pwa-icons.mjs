import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";

const input = "public/logo/toca-symbol.svg";
const outputDir = "public/icons";

await mkdir(outputDir, { recursive: true });

const originalSvg = await readFile(input, "utf8");

// Creamos una COPIA del SVG cambiando únicamente el color del símbolo.
// El archivo original public/logo/toca-symbol.svg no se modifica.
const whiteSvg = originalSvg.replaceAll("#6366F1", "#FFFFFF");

const sizes = [192, 512];

for (const size of sizes) {
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: {
        r: 99,
        g: 102,
        b: 241,
        alpha: 1,
      },
    },
  })
    .png()
    .toBuffer();

  const symbolSize = Math.round(size * 0.78);

  const symbol = await sharp(Buffer.from(whiteSvg))
    .resize(symbolSize, symbolSize, {
      fit: "contain",
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .png()
    .toBuffer();

  const left = Math.round((size - symbolSize) / 2);
  const top = Math.round((size - symbolSize) / 2);

  await sharp(background)
    .composite([
      {
        input: symbol,
        left,
        top,
      },
    ])
    .png()
    .toFile(`${outputDir}/toca-${size}.png`);

  console.log(`Creado: ${outputDir}/toca-${size}.png`);
}