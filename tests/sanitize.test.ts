import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../src/lib/sanitize'

describe('sanitizeHtml', () => {
  it('should allow clean HTML to pass through unchanged', () => {
    const clean = '<p>Hello <strong>world</strong>!</p><h1>Title</h1>'
    expect(sanitizeHtml(clean)).toBe(clean)
  })

  it('should remove script tags and their inner content', () => {
    const dirty = '<p>Hello</p><script>alert("XSS")</script><div>World</div>'
    expect(sanitizeHtml(dirty)).toBe('<p>Hello</p><div>World</div>')
  })

  it('should remove inline event handlers', () => {
    const dirty = '<button onclick="alert(1)" class="btn">Click me</button>'
    const expected = '<button class="btn">Click me</button>'
    expect(sanitizeHtml(dirty).trim()).toBe(expected)
  })

  it('should remove event handlers without quotes', () => {
    const dirty = '<img src="pic.jpg" onerror=alert(1) />'
    const expected = '<img src="pic.jpg" />'
    expect(sanitizeHtml(dirty).trim()).toBe(expected)
  })

  it('should remove javascript: and data: links', () => {
    const dirty = '<a href="javascript:alert(1)">Link 1</a><a href="data:text/html,hack">Link 2</a>'
    const result = sanitizeHtml(dirty)
    expect(result).toContain('href="#"')
    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('data:')
  })

  it('should remove dangerous tags like iframe, object, embed, and form', () => {
    const dirty = '<div><iframe src="hack.html"></iframe><object>embed</object></div>'
    expect(sanitizeHtml(dirty)).toBe('<div></div>')
  })
})
