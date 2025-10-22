import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

/**
 * Render markdown to safe HTML with syntax highlighting support
 */
export function renderMarkdown(markdown: string): string {
  // Configure marked for better code block rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const html = marked(markdown) as string;
  
  // Sanitize to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
      'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
}
