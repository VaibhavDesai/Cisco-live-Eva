import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const iconsDir = path.resolve(
  __dirname,
  'node_modules/@momentum-design/icons/dist/svg'
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-momentum-icons',
      configureServer(server) {
        server.middlewares.use('/momentum-icons', (req, res, next) => {
          if (!req.url) return next()
          const fileName = req.url.replace(/^\//, '')
          const filePath = path.join(iconsDir, fileName)
          try {
            let data = fs.readFileSync(filePath, 'utf-8')
            data = data.replace('<svg ', '<svg fill="currentColor" ')
            res.setHeader('Content-Type', 'image/svg+xml')
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            res.end(data)
          } catch {
            res.statusCode = 404
            res.end('Not found')
          }
        })
      },
    },
  ],
  server: {
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
})
