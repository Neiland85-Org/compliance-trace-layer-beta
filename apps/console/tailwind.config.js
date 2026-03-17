/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbit: ["Space Grotesk", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
      },
      colors: {
        neon: {
          green: "#00ffc6",
          blue: "#00e0ff",
          yellow: "#f0ff00",
          orange: "#ffaa00",
        },
      },
      boxShadow: {
        neon: "0 0 25px rgba(0,255,198,0.5)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "20px",
      },
      height: {
        "screen-150": "150vh",
        "screen-200": "200vh",
      },
    },
  },
  plugins: [],
}
