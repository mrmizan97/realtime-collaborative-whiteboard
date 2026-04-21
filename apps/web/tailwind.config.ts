import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#FAFAFA",
          grid: "#EFEFEF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
