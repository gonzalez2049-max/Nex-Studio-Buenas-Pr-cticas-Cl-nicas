import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// Config auxiliar (no producción) para generar una vista previa autocontenida
// en un solo archivo HTML. No afecta al build normal.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist-single',
    chunkSizeWarningLimit: 20000,
  },
})
