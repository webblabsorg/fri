/**
 * Jest Polyfills
 * These must run before any test files are loaded
 */

// Polyfill Web APIs for Jest environment (needed for Next.js server components)
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
    entries() { return this._headers.entries() }
    keys() { return this._headers.keys() }
    values() { return this._headers.values() }
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    #url
    #method
    #headers
    #body
    #cache
    #credentials
    #mode
    #redirect
    #referrer
    #signal
    
    constructor(input, init = {}) {
      this.#url = typeof input === 'string' ? input : input.url
      this.#method = init.method || 'GET'
      this.#headers = new global.Headers(init.headers)
      this.#body = init.body
      this.#cache = init.cache || 'default'
      this.#credentials = init.credentials || 'same-origin'
      this.#mode = init.mode || 'cors'
      this.#redirect = init.redirect || 'follow'
      this.#referrer = init.referrer || 'about:client'
      this.#signal = init.signal || null
    }
    
    get url() { return this.#url }
    get method() { return this.#method }
    get headers() { return this.#headers }
    get body() { return this.#body }
    get cache() { return this.#cache }
    get credentials() { return this.#credentials }
    get mode() { return this.#mode }
    get redirect() { return this.#redirect }
    get referrer() { return this.#referrer }
    get signal() { return this.#signal }
    
    json() { return Promise.resolve(JSON.parse(this.#body || '{}')) }
    text() { return Promise.resolve(this.#body || '') }
    clone() { return new Request(this.#url, { method: this.#method, headers: this.#headers, body: this.#body }) }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || ''
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new global.Headers(init.headers)
      this.type = 'basic'
      this.url = ''
    }
    json() { return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body) }
    text() { return Promise.resolve(String(this.body)) }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)) }
    blob() { return Promise.resolve(new Blob([this.body])) }
    clone() { return new Response(this.body, { status: this.status, headers: this.headers }) }
    static json(data, init = {}) {
      return new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
    }
    static redirect(url, status = 302) {
      return new Response(null, { status, headers: { Location: url } })
    }
    static error() {
      return new Response(null, { status: 0, type: 'error' })
    }
  }
}

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// URL polyfill
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL
}
