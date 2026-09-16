import localFont from "next/font/local";

const body = localFont({
  src: [
    { path: "../../public/fonts/manrope-400-normal.ttf", weight: "400" },
    { path: "../../public/fonts/manrope-500-normal.ttf", weight: "500" },
    { path: "../../public/fonts/manrope-600-normal.ttf", weight: "600" },
    { path: "../../public/fonts/manrope-700-normal.ttf", weight: "700" },
    { path: "../../public/fonts/manrope-800-normal.ttf", weight: "800" },
  ],
  variable: "--landing-body",
  display: "swap",
});
const heading = localFont({
  src: [
    {
      path: "../../public/fonts/playfair-display-600-normal.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/playfair-display-700-normal.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/playfair-display-600-italic.ttf",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--landing-heading",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../../public/fonts/dm-mono-400-normal.ttf", weight: "400" },
    { path: "../../public/fonts/dm-mono-500-normal.ttf", weight: "500" },
  ],
  variable: "--landing-mono",
  display: "swap",
});
export const landingFonts = `${body.variable} ${heading.variable} ${mono.variable}`;
