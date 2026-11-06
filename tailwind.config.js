/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F8FA',
          card: '#FFFFFF',
          subtle: '#F2F4F6',
          warm: '#FAF9F6',
        },
        ink: {
          DEFAULT: '#191F28',
          secondary: '#4E5968',
          muted: '#8B95A1',
          faint: '#B0B8C1',
        },
        line: {
          DEFAULT: '#E5E8EB',
          strong: '#D1D6DB',
          dark: '#191F28',
        },
        accent: {
          DEFAULT: '#191F28',
          blue: '#3182F6',
          warm: '#D95B43',
          green: '#1B7F5C',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
