import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type ReviewStatus = 'open' | 'resolved'

interface ReviewThreadRow {
  id: string
  route: string
  selector: string
  x_ratio: number
  y_ratio: number
  element_label: string | null
  status: ReviewStatus
  created_at: string
}

interface ReviewCommentRow {
  id: string
  thread_id: string
  author_name: string
  body: string
  created_at: string
}

interface ReviewDatabase {
  exec(sql: string): void
  prepare(sql: string): {
    all(...params: unknown[]): unknown[]
    get(...params: unknown[]): unknown
    run(...params: unknown[]): unknown
  }
}

const MAX_BODY_BYTES = 16 * 1024

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

const readJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = []
  let total = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error('Request body is too large')
    chunks.push(buffer)
  }

  if (chunks.length === 0) return {}
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object')
  }
  return parsed as Record<string, unknown>
}

const asTrimmedString = (
  value: unknown,
  field: string,
  maxLength: number,
): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim().slice(0, maxLength)
}

const asRatio = (value: unknown, field: string): number => {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Error(`${field} must be between 0 and 1`)
  }
  return number
}

const loadThread = (db: ReviewDatabase, id: string): ReviewThreadRow | null =>
  (db.prepare('SELECT * FROM threads WHERE id = ?').get(id) as ReviewThreadRow | undefined) ??
  null

const loadThreads = (db: ReviewDatabase, route: string | null) => {
  const threads = (route
    ? db
        .prepare('SELECT * FROM threads WHERE route = ? ORDER BY created_at ASC')
        .all(route)
    : db.prepare('SELECT * FROM threads ORDER BY created_at DESC').all()) as ReviewThreadRow[]

  const commentsStatement = db.prepare(
    'SELECT * FROM comments WHERE thread_id = ? ORDER BY created_at ASC',
  )

  return threads.map((thread) => ({
    ...thread,
    comments: commentsStatement.all(thread.id) as ReviewCommentRow[],
  }))
}

export const reviewCommentsPlugin = (): Plugin => {
  let databasePromise: Promise<ReviewDatabase> | null = null

  const getDatabase = () => {
    if (!databasePromise) {
      databasePromise = (async () => {
        const { DatabaseSync } = await import('node:sqlite')
        const dataDirectory = path.resolve(process.cwd(), '.review-data')
        fs.mkdirSync(dataDirectory, { recursive: true })
        const db = new DatabaseSync(
          path.join(dataDirectory, 'review-comments.sqlite'),
        ) as unknown as ReviewDatabase

        db.exec(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS threads (
            id TEXT PRIMARY KEY,
            route TEXT NOT NULL,
            selector TEXT NOT NULL,
            x_ratio REAL NOT NULL,
            y_ratio REAL NOT NULL,
            element_label TEXT,
            status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
            created_at TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS threads_route_created_at
            ON threads(route, created_at);

          CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS comments_thread_created_at
            ON comments(thread_id, created_at);
        `)

        return db
      })()
    }
    return databasePromise
  }

  return {
    name: 'review-comments-api',
    configureServer(server) {
      server.middlewares.use('/api/review', async (req, res) => {
        try {
          const db = await getDatabase()
          const url = new URL(req.url || '/', 'http://review.local')
          const pathname = url.pathname.replace(/^\/api\/review/, '') || '/'
          const method = req.method || 'GET'

          if (method === 'GET' && pathname === '/health') {
            sendJson(res, 200, { ok: true })
            return
          }

          if (method === 'GET' && pathname === '/threads') {
            const route = url.searchParams.get('route')
            sendJson(res, 200, { threads: loadThreads(db, route) })
            return
          }

          if (method === 'POST' && pathname === '/threads') {
            const body = await readJsonBody(req)
            const id = crypto.randomUUID()
            const commentId = crypto.randomUUID()
            const createdAt = new Date().toISOString()
            const route = asTrimmedString(body.route, 'route', 512)
            const selector = asTrimmedString(body.selector, 'selector', 2000)
            const xRatio = asRatio(body.x_ratio, 'x_ratio')
            const yRatio = asRatio(body.y_ratio, 'y_ratio')
            const elementLabel =
              typeof body.element_label === 'string' && body.element_label.trim()
                ? body.element_label.trim().slice(0, 500)
                : null
            const authorName = asTrimmedString(body.author_name, 'author_name', 64)
            const commentBody = asTrimmedString(body.body, 'body', 4000)

            db.exec('BEGIN IMMEDIATE')
            try {
              db.prepare(
                `INSERT INTO threads
                  (id, route, selector, x_ratio, y_ratio, element_label, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
              ).run(id, route, selector, xRatio, yRatio, elementLabel, createdAt)
              db.prepare(
                `INSERT INTO comments
                  (id, thread_id, author_name, body, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
              ).run(commentId, id, authorName, commentBody, createdAt)
              db.exec('COMMIT')
            } catch (error) {
              db.exec('ROLLBACK')
              throw error
            }

            const thread = loadThread(db, id)
            const comment = db
              .prepare('SELECT * FROM comments WHERE id = ?')
              .get(commentId) as ReviewCommentRow
            sendJson(res, 201, { thread, comment })
            return
          }

          const commentMatch = pathname.match(/^\/threads\/([^/]+)\/comments$/)
          if (method === 'POST' && commentMatch) {
            const threadId = decodeURIComponent(commentMatch[1])
            if (!loadThread(db, threadId)) {
              sendJson(res, 404, { error: 'Thread not found' })
              return
            }
            const body = await readJsonBody(req)
            const commentId = crypto.randomUUID()
            const createdAt = new Date().toISOString()
            const authorName = asTrimmedString(body.author_name, 'author_name', 64)
            const commentBody = asTrimmedString(body.body, 'body', 4000)

            db.prepare(
              `INSERT INTO comments
                (id, thread_id, author_name, body, created_at)
               VALUES (?, ?, ?, ?, ?)`,
            ).run(commentId, threadId, authorName, commentBody, createdAt)

            const comment = db
              .prepare('SELECT * FROM comments WHERE id = ?')
              .get(commentId) as ReviewCommentRow
            sendJson(res, 201, { comment })
            return
          }

          const threadMatch = pathname.match(/^\/threads\/([^/]+)$/)
          if (method === 'PATCH' && threadMatch) {
            const threadId = decodeURIComponent(threadMatch[1])
            const body = await readJsonBody(req)
            if (body.status !== 'open' && body.status !== 'resolved') {
              sendJson(res, 400, { error: 'status must be open or resolved' })
              return
            }
            const result = db
              .prepare('UPDATE threads SET status = ? WHERE id = ?')
              .run(body.status, threadId) as { changes?: number }
            if (!result.changes) {
              sendJson(res, 404, { error: 'Thread not found' })
              return
            }
            sendJson(res, 200, { thread: loadThread(db, threadId) })
            return
          }

          sendJson(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unexpected review API error'
          const status =
            error instanceof SyntaxError ||
            message.includes('required') ||
            message.includes('must be') ||
            message.includes('too large') ||
            message.includes('Expected')
              ? 400
              : 500
          // eslint-disable-next-line no-console
          console.error('[review-comments-api]', error)
          sendJson(res, status, { error: message })
        }
      })
    },
  }
}
