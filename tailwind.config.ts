import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        luxluf: {
          50: "#faf8f5",
          100: "#f0ebe3",
          200: "#e0d5c6",
          300: "#cdbaa2",
          400: "#b99c7e",
          500: "#a98464",
          600: "#9c7258",
          700: "#825d4a",
          800: "#6a4d40",
          900: "#574136",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
