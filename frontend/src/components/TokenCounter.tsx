/**
 * Token Counter Component
 * Displays real-time token count for prompt text
 * Uses a simple estimation: ~4 characters per token (GPT-style approximation)
 *
 * For production, consider using tiktoken or a proper tokenizer library
 */

import { useEffect, useState, useMemo } from "react";

interface TokenCounterProps {
  text: string;
  debounceMs?: number;
  maxTokens?: number;
  showWarning?: boolean;
}

/**
 * Simple token estimation
 * Real GPT tokenizers are more complex, but this provides a good approximation
 * Average: ~0.75 tokens per word, ~4 characters per token
 */
function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Remove extra whitespace
  const cleanedText = text.trim().replace(/\s+/g, " ");

  // Count words (more accurate than character-based for English)
  const words = cleanedText.split(/\s+/).length;

  // Average of 0.75 tokens per word (GPT-3.5/4 approximation)
  // Adjust multiplier based on language: English ~0.75, code ~1.2
  const hasCode = /[{}[\]<>()]/g.test(text);
  const multiplier = hasCode ? 1.2 : 0.75;

  return Math.ceil(words * multiplier);
}

export function TokenCounter({
  text,
  debounceMs = 300,
  maxTokens,
  showWarning = true
}: TokenCounterProps): JSX.Element {
  const [debouncedText, setDebouncedText] = useState(text);

  // Debounce text updates to avoid excessive recalculations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  // Calculate token count
  const tokenCount = useMemo(() => {
    return estimateTokenCount(debouncedText);
  }, [debouncedText]);

  // Determine warning state
  const isNearLimit = maxTokens ? tokenCount >= maxTokens * 0.8 : false;
  const isOverLimit = maxTokens ? tokenCount > maxTokens : false;

  // Styling classes
  const className = [
    "token-counter",
    isOverLimit && showWarning ? "token-counter--error" : "",
    isNearLimit && !isOverLimit && showWarning ? "token-counter--warning" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <span className="token-counter__label">Tokens:</span>
      <span className="token-counter__count">
        {tokenCount.toLocaleString()}
        {maxTokens ? ` / ${maxTokens.toLocaleString()}` : ""}
      </span>
      {isOverLimit && showWarning ? (
        <span className="token-counter__icon" title="Exceeds token limit">
          ⚠️
        </span>
      ) : null}
    </div>
  );
}

export default TokenCounter;
