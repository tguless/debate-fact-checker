const POMSOFT_WEBSITE = "https://pomsoft.net";
const POMSOFT_EMAIL = "info@pomsoft.net";
export const PUBLISHER_NAME = "Pomsoft LLC";

const LOGO_LIGHT = "/images/pomsoft_logo_light.png";
const LOGO_DARK = "/images/pomsoft_logo_dark.png";

type LogoProps = {
  surface?: "light" | "dark";
  height?: number;
  className?: string;
};

export function PomsoftLogoLink({ surface = "light", height = 44, className = "" }: LogoProps) {
  const src = surface === "dark" ? LOGO_DARK : LOGO_LIGHT;

  return (
    <a
      href={POMSOFT_WEBSITE}
      target="_blank"
      rel="noopener noreferrer"
      className={["pomsoft-logo-link inline-flex", className].filter(Boolean).join(" ")}
      aria-label="Pomsoft — visit pomsoft.net"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Pomsoft" height={height} style={{ height, width: "auto" }} />
    </a>
  );
}

export { POMSOFT_WEBSITE, POMSOFT_EMAIL };
