/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
        fredoka: ["var(--font-fredoka)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        sand: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        wave: "wave 2s ease-in-out infinite",
        bubble: "bubble 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        float: "float 6s ease-in-out infinite",
        sway: "sway 4s ease-in-out infinite",
        "treasure-glow": "treasure-glow 2s ease-in-out infinite",
        "school-swim": "school-swim 15s linear infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "float-germ": "float-germ 3s ease-in-out infinite",
        "grow-shrink": "grow-shrink 2.5s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        bubble: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "50%": { transform: "translateY(-20px) scale(1.1)", opacity: "1" },
          "100%": { transform: "translateY(-40px) scale(0.9)", opacity: "0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(120deg)" },
          "66%": { transform: "translateY(5px) rotate(240deg)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "treasure-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(250, 204, 21, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(250, 204, 21, 0.6)" },
        },
        "school-swim": {
          "0%": { transform: "translateX(-100px) translateY(0px)" },
          "25%": { transform: "translateX(0px) translateY(-10px)" },
          "50%": { transform: "translateX(100px) translateY(0px)" },
          "75%": { transform: "translateX(200px) translateY(10px)" },
          "100%": { transform: "translateX(300px) translateY(0px)" },
        },
        "gradient-shift": {
          "0%": {
            backgroundPosition: "0% 50%",
            backgroundSize: "400% 400%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            backgroundSize: "400% 400%",
          },
          "100%": {
            backgroundPosition: "0% 50%",
            backgroundSize: "400% 400%",
          },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "float-germ": {
          "0%, 100%": {
            transform: "translate(0, 0) rotate(0deg)",
            opacity: "0.8",
          },
          "25%": {
            transform: "translate(5px, -8px) rotate(90deg)",
            opacity: "1",
          },
          "50%": {
            transform: "translate(-3px, -15px) rotate(180deg)",
            opacity: "0.9",
          },
          "75%": {
            transform: "translate(-8px, -8px) rotate(270deg)",
            opacity: "1",
          },
        },
        "grow-shrink": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "0.7" },
          "50%": { transform: "scale(1.3) rotate(10deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
