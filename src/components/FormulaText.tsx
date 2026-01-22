import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

/**
 * Props for the FormulaText component.
 */
interface FormulaTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with LaTeX formulas.
 * Supports both inline ($...$) and block ($$...$$) formulas.
 */
const FormulaText: React.FC<FormulaTextProps> = ({ text, className }) => {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Split by LaTeX patterns: $$...$$ for block, $...$ for inline
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process block formulas first ($$...$$)
    const blockRegex = /\$\$([\s\S]+?)\$\$/g;
    const inlineRegex = /\$([^$\n]+?)\$/g;

    // First, handle block formulas
    let lastIndex = 0;
    let blockMatch;
    const withoutBlocks: { type: 'text' | 'block'; content: string }[] = [];

    while ((blockMatch = blockRegex.exec(text)) !== null) {
      if (blockMatch.index > lastIndex) {
        withoutBlocks.push({ type: 'text', content: text.slice(lastIndex, blockMatch.index) });
      }
      withoutBlocks.push({ type: 'block', content: blockMatch[1] });
      lastIndex = blockMatch.index + blockMatch[0].length;
    }
    if (lastIndex < text.length) {
      withoutBlocks.push({ type: 'text', content: text.slice(lastIndex) });
    }

    // Now process each segment
    withoutBlocks.forEach((segment, segIndex) => {
      if (segment.type === 'block') {
        try {
          const html = katex.renderToString(segment.content, {
            displayMode: true,
            throwOnError: false,
            strict: false,
          });
          parts.push(
            <div
              key={`block-${segIndex}`}
              className="my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          parts.push(<span key={`block-${segIndex}`} className="text-destructive">$$${segment.content}$$</span>);
        }
      } else {
        // Process inline formulas in text segments
        let textLastIndex = 0;
        let inlineMatch;
        const textContent = segment.content;
        inlineRegex.lastIndex = 0;

        while ((inlineMatch = inlineRegex.exec(textContent)) !== null) {
          if (inlineMatch.index > textLastIndex) {
            parts.push(<span key={`text-${segIndex}-${key++}`}>{textContent.slice(textLastIndex, inlineMatch.index)}</span>);
          }
          try {
            const html = katex.renderToString(inlineMatch[1], {
              displayMode: false,
              throwOnError: false,
              strict: false,
            });
            parts.push(
              <span
                key={`inline-${segIndex}-${key++}`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            parts.push(<span key={`inline-${segIndex}-${key++}`} className="text-destructive">${inlineMatch[1]}$</span>);
          }
          textLastIndex = inlineMatch.index + inlineMatch[0].length;
        }
        if (textLastIndex < textContent.length) {
          parts.push(<span key={`text-${segIndex}-${key++}`}>{textContent.slice(textLastIndex)}</span>);
        }
      }
    });

    return parts;
  }, [text]);

  return <span className={className}>{renderedContent}</span>;
};

export default FormulaText;
