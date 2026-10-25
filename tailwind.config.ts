import type { Config } from "tailwindcss";
import uiPreset from "./packages/ui/tailwind.preset.js";

const config: Config = {
  // Brand colours, type and motion come from the shared @biobloom/ui preset
  presets: [uiPreset],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
