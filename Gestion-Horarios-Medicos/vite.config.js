import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Import Tailwind CSS plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Add Tailwind CSS plugin to the Vite configuration
  
})
