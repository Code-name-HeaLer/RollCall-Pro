module.exports = {
  darkMode: "class", // Enable class strategy
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", // Include all files in the app directory
    "./app/components/**/*.{js,jsx,ts,tsx}", // Include components if we add them later
  ],
  theme: {
    extend: {
      // Extend the default Tailwind theme here if needed
      // Example: Add custom colors from readme.md
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        accent: "#F59E0B",
        // Add dark mode colors (optional but recommended)
        dark: {
          background: "#121212", // Example dark background
          card: "#1e1e1e", // Example dark card background
          text: "#e0e0e0", // Example dark text
          border: "#333333", // Example dark border
        },
      },
    },
  },
  plugins: [],
};
