export type RgbColor = readonly [number, number, number];

const HEX_COLOR_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

// '#rrggbb' → каналы 0..1; невалидная строка даёт чёрный
export function hexToRgb(hex: string): RgbColor {
  const match = HEX_COLOR_PATTERN.exec(hex);

  if (!match) {
    return [0, 0, 0];
  }

  const [, red = '00', green = '00', blue = '00'] = match;

  return [parseInt(red, 16) / 255, parseInt(green, 16) / 255, parseInt(blue, 16) / 255];
}
