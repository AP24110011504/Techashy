import React, { useState } from 'react';
import { Bot, User, Sparkles, CornerDownLeft } from 'lucide-react';

const QUICK_PROMPTS = [
  "What is the blast radius and which servers are affected?",
  "Is the customer database corrupted or tampered with?",
  "What is the recommended containment action?"
];

export function AskAegisConsole({ history = [], onAsk, isQuerying }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || isQuerying) return;
    onAsk(query.trim());
    setQuery('');
  };

  const handleSelectQuickPrompt = (prompt) => {
    setQuery(prompt);
  };

  return (
    <div className="soc-surface p-3.5 rounded border border-border">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-card border border-border">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-semibold font-mono text-text-primary uppercase tracking-wide">
              Ask AEGISX // Analyst Query Console
            </h3>
            <p className="text-[11px] text-text-secondary font-mono">
              Natural-language cybersecurity copilot powered by multi-agent investigation buffer
            </p>
          </div>
        </div>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AEGISX (e.g., 'What is the blast radius and lateral movement status?')..."
            disabled={isQuerying}
            className="w-full bg-card border border-border px-3.5 py-2.5 pr-24 text-xs font-mono rounded text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:border-accent disabled:opacity-60 transition-colors shadow-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || isQuerying}
            className="absolute right-1.5 px-3 py-1.5 bg-accent text-white font-mono text-xs font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {isQuerying ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <CornerDownLeft className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
          <span className="text-text-secondary flex items-center gap-1 font-mono text-[10px]">
            <Sparkles className="w-3 h-3 text-accent" /> Suggested:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectQuickPrompt(prompt)}
              className="text-left font-mono text-[10px] text-text-secondary hover:text-text-primary px-2 py-0.5 rounded bg-card border border-border hover:border-accent transition-colors shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>

      {/* Conversation Thread */}
      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-text-secondary rounded bg-card border border-border/60">
            No queries asked yet. Enter a question above to query the incident knowledge base.
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="space-y-2 p-2.5 rounded bg-card border border-border text-xs font-mono shadow-xs">
              {/* User question */}
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-surface border border-border mt-0.5 text-text-secondary">
                  <User className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-text-secondary block uppercase">
                    Analyst Question
                  </span>
                  <p className="text-text-primary font-medium text-xs mt-0.5">
                    {item.query}
                  </p>
                </div>
              </div>

              {/* Sentinel answer */}
              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                <div className="p-1 rounded bg-blue-50 dark:bg-accent/10 border border-blue-200 dark:border-accent/20 mt-0.5 text-accent">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-accent block uppercase font-semibold">
                      AEGISX Response
                    </span>
                    {item.confidence && (
                      <span className="text-[10px] text-text-secondary font-mono">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-text-primary text-xs leading-relaxed mt-1 font-sans">
                    {item.answer}
                  </p>

                  {/* Suggested action tags */}
                  {item.suggestedActions && item.suggestedActions.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-text-secondary">Suggested Actions:</span>
                      {item.suggestedActions.map((action, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[10px] text-accent px-1.5 py-0.5 rounded bg-surface border border-border"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
