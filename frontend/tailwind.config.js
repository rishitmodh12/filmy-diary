/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F2",
        ink: "#2C2C2A",
        "ink-soft": "#5F5E5A",
        "ink-faint": "#888780",
        rule: "#E5E3DA",
        rule_soft: "#D3D1C7",
        archive: {
          50: "#E1F5EE",
          600: "#0F6B53",
          700: "#085041",
        },
        stamp: {
          500: "#BA7517",
          600: "#9A5E0E",
        },
        coral: {
          50: "#FAECE7",
          700: "#712B13",
        },
        info: {
          50: "#E6F1FB",
          600: "#185FA5",
        },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
