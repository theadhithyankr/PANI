import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  // Custom components for styling
  const components = {
    // Paragraphs
    p: ({ children }) => (
      <div className="mb-2 text-gray-700 leading-relaxed">{children}</div>
    ),
    
    // Strong/Bold text
    strong: ({ children }) => (
      <span className="font-semibold text-gray-900">{children}</span>
    ),
    
    // Emphasis/Italic text
    em: ({ children }) => (
      <span className="italic text-gray-700">{children}</span>
    ),
    
    // Unordered lists
    ul: ({ children }) => (
      <ul className="mb-3 ml-4 space-y-1">{children}</ul>
    ),
    
    // Ordered lists
    ol: ({ children }) => (
      <ol className="mb-3 ml-4 space-y-1 list-decimal">{children}</ol>
    ),
    
    // List items
    li: ({ children }) => (
      <li className="text-gray-700 leading-relaxed">{children}</li>
    ),
    
    // Links
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline transition-colors"
      >
        {children}
      </a>
    ),
    
    // Headings
    h1: ({ children }) => (
      <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    
    // Code blocks
    code: ({ inline, children }) => {
      if (inline) {
        return (
          <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto mb-3">
          <code className="text-sm font-mono">{children}</code>
        </pre>
      );
    },
    
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
        {children}
      </blockquote>
    ),
    
    // Line breaks
    br: () => <br className="mb-1" />,
    
    // Horizontal rules
    hr: () => <hr className="border-gray-300 my-4" />
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeSanitize]}
        skipHtml={true} // Skip HTML tags for security
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;