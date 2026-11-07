export function getBrandTheme(color?: string) {
  const primary = /^#[0-9a-f]{6}$/i.test(color || "") ? color! : "#17191F";
  const channels = [1, 3, 5]
    .map((index) => parseInt(primary.slice(index, index + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;
  return {
    "--brand-primary": primary,
    "--brand-ink": whiteContrast >= blackContrast ? "#ffffff" : "#000000",
    "--brand-soft": primary + "12",
  };
}
