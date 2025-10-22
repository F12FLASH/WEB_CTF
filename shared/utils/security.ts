import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

/**
 * Render markdown to safe HTML
 */
export function renderMarkdown(markdown: string): string {
  const html = marked(markdown) as string;
  return sanitizeHtml(html);
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
