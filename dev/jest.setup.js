import '@testing-library/jest-dom'

// Polyfill Web APIs for Jest environment (needed for Next.js server components)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this.body = init.body
    }
    json() { return Promise.resolve(JSON.parse(this.body || '{}')) }
    text() { return Promise.resolve(this.body || '') }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new Headers(init.headers)
    }
    json() { return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body) }
    text() { return Promise.resolve(String(this.body)) }
    static json(data, init = {}) {
      return new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map()
      if (init) {
        if (Array.isArray(init)) init.forEach(([k, v]) => this.set(k, v))
        else if (typeof init === 'object') Object.entries(init).forEach(([k, v]) => this.set(k, v))
      }
    }
    get(n) { return this._headers.get(n.toLowerCase()) || null }
    set(n, v) { this._headers.set(n.toLowerCase(), v) }
    has(n) { return this._headers.has(n.toLowerCase()) }
    delete(n) { this._headers.delete(n.toLowerCase()) }
    forEach(cb) { this._headers.forEach(cb) }
  }
}

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.GOOGLE_AI_API_KEY = 'test-google-key'
process.env.STRIPE_SECRET_KEY = 'test-stripe-key'
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock fetch globally
global.fetch = jest.fn()

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})
