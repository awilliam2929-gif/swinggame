import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { searchCoursesRemote } from './server/searchCoursesRemote'

function courseSearchDevApi(): Plugin {
  return {
    name: 'course-search-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/course-search', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const requestUrl = req.url ?? '/'
        const q = new URL(requestUrl, 'http://localhost').searchParams
          .get('q')
          ?.trim() ?? ''

        res.setHeader('Content-Type', 'application/json')

        if (q.length < 2) {
          res.end(JSON.stringify([]))
          return
        }

        try {
          const results = await searchCoursesRemote(q)
          res.end(JSON.stringify(results))
        } catch {
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'Search unavailable' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), courseSearchDevApi()],
})
