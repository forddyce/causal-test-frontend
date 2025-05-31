/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        "10px": "10px",
      },
      spacing: {
        "8px": "8px",
        "10px": "10px",
        "12px": "12px",
        "16px": "16px",
        "24px": "24px",
        "28px": "28px",
        "32px": "32px",
        "40px": "40px",
        "56px": "56px",
      },
    },
  },
  plugins: [],
};
