import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { DemoProduct } from "@/lib/demo-product";

type GeneratedAssets = Pick<
  DemoProduct,
  "frontPrintUrl" | "backPrintUrl" | "mockupFrontUrl" | "mockupBackUrl"
>;

const publicDir = path.join(process.cwd(), "public");

function outputPath(day: number, filename: string) {
  return path.join(publicDir, "generated", `basepaint-${day}`, filename);
}

function outputUrl(day: number, filename: string) {
  return `/generated/basepaint-${day}/${filename}`;
}

export function generatedAssetPaths(day: number) {
  return {
    frontPrintUrl: {
      filename: "front_print.png",
      filePath: outputPath(day, "front_print.png"),
    },
    backPrintUrl: {
      filename: "back_print.png",
      filePath: outputPath(day, "back_print.png"),
    },
    mockupFrontUrl: {
      filename: "mockup_front.png",
      filePath: outputPath(day, "mockup_front.png"),
    },
    mockupBackUrl: {
      filename: "mockup_back.png",
      filePath: outputPath(day, "mockup_back.png"),
    },
  };
}

const pixelGlyphs: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  A: ["01110", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000"],
  G: ["01111", "10000", "10111", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["111", "010", "010", "010", "111"],
  J: ["00111", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10011", "01111"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  X: ["10001", "01010", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100"],
  Z: ["11111", "00010", "00100", "01000", "11111"],
  "#": ["01010", "11111", "01010", "11111", "01010"],
  " ": ["0", "0", "0", "0", "0"],
};

function measurePixelText(text: string, cell: number, gap: number) {
  return text
    .toUpperCase()
    .split("")
    .reduce((total, char, index) => {
      const glyph = pixelGlyphs[char] ?? pixelGlyphs[" "];
      const width = glyph[0].length * cell + Math.max(0, glyph[0].length - 1) * gap;
      return total + width + (index > 0 ? cell * 2 : 0);
    }, 0);
}

function pixelTextSvg({
  width,
  height,
  lines,
  cell = 8,
  gap = 1,
  fill = "#ffffff",
  align = "middle",
}: {
  width: number;
  height: number;
  lines: string[];
  cell?: number;
  gap?: number;
  fill?: string;
  align?: "start" | "middle" | "end";
}) {
  const widestLine = Math.max(
    ...lines.map((line) => measurePixelText(line, cell, gap)),
  );
  const scale = widestLine > width ? width / widestLine : 1;
  const fittedCell = Math.max(1, Math.floor(cell * scale));
  const fittedGap = Math.max(0, Math.floor(gap * scale));
  const lineHeight = fittedCell * 7;
  const totalHeight = lineHeight * lines.length;
  const startY = Math.max(0, Math.round((height - totalHeight) / 2));
  const rects: string[] = [];

  lines.forEach((line, lineIndex) => {
    const text = line.toUpperCase();
    const lineWidth = measurePixelText(text, fittedCell, fittedGap);
    let x =
      align === "start"
        ? 0
        : align === "end"
          ? width - lineWidth
          : Math.round((width - lineWidth) / 2);
    const y = startY + lineIndex * lineHeight;

    for (const char of text) {
      const glyph = pixelGlyphs[char] ?? pixelGlyphs[" "];

      glyph.forEach((row, rowIndex) => {
        row.split("").forEach((pixel, colIndex) => {
          if (pixel === "1") {
            rects.push(
              `<rect x="${x + colIndex * (fittedCell + fittedGap)}" y="${y + rowIndex * (fittedCell + fittedGap)}" width="${fittedCell}" height="${fittedCell}" fill="${fill}"/>`,
            );
          }
        });
      });

      x +=
        glyph[0].length * fittedCell +
        Math.max(0, glyph[0].length - 1) * fittedGap +
        fittedCell * 2;
    }
  });

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${rects.join("")}
    </svg>
  `);
}

function shirtSvg({
  width,
  height,
  shirtColor,
}: {
  width: number;
  height: number;
  shirtColor: string;
}) {
  const fill =
    shirtColor === "White" || shirtColor === "Athletic Heather" ? "#f4f4f4" : "#0b0b0b";
  const stroke = fill === "#0b0b0b" ? "#2a2a2a" : "#d7d7d7";

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f7f4ee"/>
      <path d="M405 250 L540 130 H660 L795 250 L1040 360 L940 650 L805 595 V1240 H395 V595 L260 650 L160 360 Z" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <path d="M540 130 C555 230 645 230 660 130" fill="none" stroke="${stroke}" stroke-width="8"/>
      <path d="M398 595 L320 940" stroke="${stroke}" stroke-width="4" opacity="0.55"/>
      <path d="M802 595 L880 940" stroke="${stroke}" stroke-width="4" opacity="0.55"/>
    </svg>
  `);
}

async function fetchArtwork(product: DemoProduct) {
  const response = await fetch(product.artUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Artwork fetch returned ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createFrontPrint(product: DemoProduct, filePath: string) {
  await sharp({
    create: {
      width: 1800,
      height: 2400,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite([
      {
        input: pixelTextSvg({
          width: 1500,
          height: 190,
          lines: product.frontPrintText,
          align: "end",
          cell: 8,
          gap: 1,
        }),
        left: 180,
        top: 385,
      },
    ])
    .png()
    .toFile(filePath);
}

async function createBackPrint(
  product: DemoProduct,
  artwork: Buffer,
  filePath: string,
) {
  const art = await sharp(artwork)
    .resize(1500, 1500, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1800,
      height: 2400,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite([
      {
        input: pixelTextSvg({
          width: 1500,
          height: 290,
          lines: [`BasePaint #${product.basepaintDay}`, product.theme],
          align: "start",
          cell: 18,
          gap: 2,
        }),
        left: 150,
        top: 420,
      },
      {
        input: art,
        left: 150,
        top: 800,
      },
    ])
    .png()
    .toFile(filePath);
}

async function createMockup({
  product,
  printPath,
  filePath,
  side,
}: {
  product: DemoProduct;
  printPath: string;
  filePath: string;
  side: "front" | "back";
}) {
  const print = await sharp(printPath)
    .resize(side === "front" ? 250 : 480, side === "front" ? 330 : 620, {
      fit: "inside",
    })
    .png()
    .toBuffer();

  await sharp(shirtSvg({ width: 1200, height: 1400, shirtColor: product.shirtColor }))
    .composite([
      {
        input: print,
        left: side === "front" ? 700 : 360,
        top: side === "front" ? 345 : 290,
      },
    ])
    .png()
    .toFile(filePath);
}

export async function generatePrintAssets(
  product: DemoProduct,
): Promise<GeneratedAssets> {
  const dir = path.join(publicDir, "generated", `basepaint-${product.basepaintDay}`);
  await mkdir(dir, { recursive: true });

  const frontPrintPath = outputPath(product.basepaintDay, "front_print.png");
  const backPrintPath = outputPath(product.basepaintDay, "back_print.png");
  const mockupFrontPath = outputPath(product.basepaintDay, "mockup_front.png");
  const mockupBackPath = outputPath(product.basepaintDay, "mockup_back.png");
  const artwork = await fetchArtwork(product);

  await createFrontPrint(product, frontPrintPath);
  await createBackPrint(product, artwork, backPrintPath);
  await createMockup({
    product,
    printPath: frontPrintPath,
    filePath: mockupFrontPath,
    side: "front",
  });
  await createMockup({
    product,
    printPath: backPrintPath,
    filePath: mockupBackPath,
    side: "back",
  });

  return {
    frontPrintUrl: outputUrl(product.basepaintDay, "front_print.png"),
    backPrintUrl: outputUrl(product.basepaintDay, "back_print.png"),
    mockupFrontUrl: outputUrl(product.basepaintDay, "mockup_front.png"),
    mockupBackUrl: outputUrl(product.basepaintDay, "mockup_back.png"),
  };
}
