import { validateUrlForFetch } from '../url-validator'

describe('validateUrlForFetch', () => {
  describe('valid URLs', () => {
    it('should accept valid HTTP URLs', () => {
      const result = validateUrlForFetch('http://example.com')
      expect(result.valid).toBe(true)
      expect(result.url?.hostname).toBe('example.com')
    })

    it('should accept valid HTTPS URLs', () => {
      const result = validateUrlForFetch('https://example.com/path?query=1')
      expect(result.valid).toBe(true)
      expect(result.url?.hostname).toBe('example.com')
    })

    it('should accept URLs with ports', () => {
      const result = validateUrlForFetch('https://example.com:8080/api')
      expect(result.valid).toBe(true)
    })

    it('should accept public IP addresses', () => {
      const result = validateUrlForFetch('http://8.8.8.8')
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid URL formats', () => {
    it('should reject malformed URLs', () => {
      const result = validateUrlForFetch('not-a-url')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })

    it('should reject URLs without protocol', () => {
      const result = validateUrlForFetch('example.com')
      expect(result.valid).toBe(false)
    })
  })

  describe('blocked protocols', () => {
    it('should reject file:// URLs', () => {
      const result = validateUrlForFetch('file:///etc/passwd')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only HTTP and HTTPS URLs are allowed')
    })

    it('should reject ftp:// URLs', () => {
      const result = validateUrlForFetch('ftp://ftp.example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only HTTP and HTTPS URLs are allowed')
    })

    it('should reject javascript: URLs', () => {
      const result = validateUrlForFetch('javascript:alert(1)')
      expect(result.valid).toBe(false)
    })
  })

  describe('SSRF protection - localhost', () => {
    it('should reject localhost', () => {
      const result = validateUrlForFetch('http://localhost')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Localhost URLs are not allowed')
    })

    it('should reject localhost with port', () => {
      const result = validateUrlForFetch('http://localhost:3000')
      expect(result.valid).toBe(false)
    })

    it('should reject 127.0.0.1', () => {
      const result = validateUrlForFetch('http://127.0.0.1')
      expect(result.valid).toBe(false)
    })

    it('should reject 127.x.x.x range', () => {
      const result = validateUrlForFetch('http://127.0.0.2')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Private network URLs are not allowed')
    })

    it('should reject 0.0.0.0', () => {
      const result = validateUrlForFetch('http://0.0.0.0')
      expect(result.valid).toBe(false)
    })
  })

  describe('SSRF protection - private networks', () => {
    it('should reject 10.x.x.x range', () => {
      const result = validateUrlForFetch('http://10.0.0.1')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Private network URLs are not allowed')
    })

    it('should reject 172.16.x.x range', () => {
      const result = validateUrlForFetch('http://172.16.0.1')
      expect(result.valid).toBe(false)
    })

    it('should reject 172.31.x.x range', () => {
      const result = validateUrlForFetch('http://172.31.255.255')
      expect(result.valid).toBe(false)
    })

    it('should accept 172.15.x.x (not private)', () => {
      const result = validateUrlForFetch('http://172.15.0.1')
      expect(result.valid).toBe(true)
    })

    it('should reject 192.168.x.x range', () => {
      const result = validateUrlForFetch('http://192.168.1.1')
      expect(result.valid).toBe(false)
    })
  })

  describe('SSRF protection - link-local', () => {
    it('should reject 169.254.x.x range', () => {
      const result = validateUrlForFetch('http://169.254.1.1')
      expect(result.valid).toBe(false)
    })
  })

  describe('SSRF protection - cloud metadata', () => {
    it('should reject AWS metadata IP', () => {
      const result = validateUrlForFetch('http://169.254.169.254')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Cloud metadata URLs are not allowed')
    })

    it('should reject AWS metadata with path', () => {
      const result = validateUrlForFetch('http://169.254.169.254/latest/meta-data/')
      expect(result.valid).toBe(false)
    })

    it('should reject AWS ECS metadata', () => {
      const result = validateUrlForFetch('http://169.254.170.2')
      expect(result.valid).toBe(false)
    })
  })

  describe('SSRF protection - IPv6', () => {
    it('should reject IPv6 loopback', () => {
      const result = validateUrlForFetch('http://[::1]')
      expect(result.valid).toBe(false)
    })
  })
})
