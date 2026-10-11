import React, { useState } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldQuestion,
  ArrowUpRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export function SentinelCopilot({
  history = [],
  investigations = [],
  onAsk,
  isQuerying = false
}) {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedAgentTab, setSelectedAgentTab] = useState('copilot'); // 'copilot' | 'agents'

  // Voice speech hook
  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition({
    onResult: (text) => {
      setInputQuery(text);
    }
  });

  const suggestedPrompts = [
    "Summarize the active incident.",
    "Which events support this attack path?",
    "Which evidence artifacts failed verification?",
    "What containment action is recommended?",
    "What remains uncertain?"
  ];

  const handlePromptClick = (prompt) => {
    setInputQuery(prompt);
    onAsk(prompt);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isQuerying) return;
    onAsk(inputQuery.trim());
    setInputQuery('');
    clearTranscript();
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="soc-card p-5 flex flex-col h-full bg-white">
      {/* HEADER WITH RED ROBOT ICON & TAB SWITCHER */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Bot className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              Sentinel AI Copilot
            </h2>
            <p className="text-[11px] font-mono text-[#718096]">
              Autonomous reasoning & forensic query engine
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-[#F5F5F9] p-0.5 rounded-lg border border-[#E1E5ED]">
          <button
            onClick={() => setSelectedAgentTab('copilot')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              selectedAgentTab === 'copilot'
                ? 'bg-white text-[#172033] shadow-sm border border-[#E1E5ED]'
                : 'text-[#718096] hover:text-[#172033]'
            }`}
          >
            Copilot
          </button>
          <button
            onClick={() => setSelectedAgentTab('agents')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
              selectedAgentTab === 'agents'
                ? 'bg-white text-[#172033] shadow-sm border border-[#E1E5ED]'
                : 'text-[#718096] hover:text-[#172033]'
            }`}
          >
            <span>Agents</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D60]" />
          </button>
        </div>
      </div>

      {/* QUICK-ACTION PROMPT CHIPS */}
      <div className="mb-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8995AA] mb-1.5 block">
          Suggested SOC Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              disabled={isQuerying}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F5F5F9] hover:bg-[#FFF1F0] text-[#172033] hover:text-[#C9362B] border border-[#E1E5ED] hover:border-[#FCA5A5] transition-all text-left flex items-center gap-1 group font-medium"
            >
              <span>{prompt}</span>
              <ArrowUpRight className="w-2.5 h-2.5 text-[#8995AA] group-hover:text-[#C9362B] transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA: CONVERSATION HISTORY OR AGENT CARDS */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[340px] pr-1">
        {selectedAgentTab === 'agents' ? (
          // MULTI-AGENT INVESTIGATION CARDS VIEW
          <div className="space-y-2.5">
            {investigations && investigations.length > 0 ? (
              investigations.map((agent, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-[#C9362B]" />
                      {agent.agentName}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                      {Math.round((agent.confidence || 0.9) * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-[#172033] leading-relaxed">
                    {agent.finding}
                  </p>

                  {agent.supportingEventIds && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#718096]">
                      <span>Supporting Evidence:</span>
                      {agent.supportingEventIds.map(eid => (
                        <span key={eid} className="px-1.5 py-0.2 rounded bg-white border border-[#E1E5ED] text-[#C9362B] font-bold">
                          {eid}
                        </span>
                      ))}
                    </div>
                  )}

                  {agent.uncertaintyNotes && (
                    <div className="text-[11px] p-2 rounded-lg bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] flex items-start gap-1.5">
                      <ShieldQuestion className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#D97706]" />
                      <span>{agent.uncertaintyNotes}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#8995AA]">
                Multi-agent investigation idle. Trigger a simulation to view autonomous agent findings.
              </div>
            )}
          </div>
        ) : (
          // COPILOT CHAT STREAM
          <div className="space-y-3">
            {history.map((msg, idx) => (
              <div key={idx} className="space-y-2 text-xs">
                {/* User Query */}
                <div className="flex justify-end">
                  <div className="bg-[#172033] text-white px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%] font-medium">
                    {msg.query}
                  </div>
                </div>

                {/* AI Copilot Answer */}
                <div className="flex justify-start">
                  <div className="bg-[#F5F5F9] border border-[#E1E5ED] p-3 rounded-xl rounded-tl-sm max-w-[92%] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#172033]">
                        <Bot className="w-3.5 h-3.5 text-[#C9362B]" />
                        <span>AEGISX Sentinel Agent</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                        {Math.round((msg.confidence || 0.95) * 100)}% Verified
                      </span>
                    </div>

                    <p className="text-[#172033] leading-relaxed">
                      {msg.answer}
                    </p>

                    {msg.suggestedActions && (
                      <div className="pt-2 border-t border-[#E1E5ED] flex flex-wrap gap-1">
                        {msg.suggestedActions.map((act, aIdx) => (
                          <span key={aIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E1E5ED] text-[#718096] font-semibold">
                            → {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="flex items-center gap-2 text-xs text-[#718096] p-3 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED]">
                <Loader2 className="w-4 h-4 animate-spin text-[#C9362B]" />
                <span>Sentinel Copilot is correlating multi-source telemetry...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SPEECH RECORDING PREVIEW OR ERROR */}
      {isListening && (
        <div className="my-2 p-2 rounded-lg bg-[#FFF1F0] border border-[#FCA5A5] flex items-center justify-between text-xs text-[#C9362B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C9362B] animate-ping" />
            <span>Listening to voice query... {transcript}</span>
          </div>
          <button
            onClick={stopListening}
            className="text-[10px] font-mono font-bold underline"
          >
            Done
          </button>
        </div>
      )}

      {speechError && (
        <div className="my-2 p-2 rounded-lg bg-[#FEF2F2] border border-[#F87171] text-xs text-[#991B1B] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* INPUT FORM WITH VOICE BUTTON */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-[#E1E5ED] flex items-center gap-2">
        {/* Voice Input Button */}
        {isSpeechSupported && (
          <button
            type="button"
            onClick={handleMicToggle}
            title={isListening ? "Stop voice recording" : "Ask via voice query"}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all flex-shrink-0 ${
              isListening
                ? 'bg-[#C9362B] text-white border-[#B92F26] animate-pulse'
                : 'bg-[#F5F5F9] text-[#718096] hover:text-[#172033] border-[#E1E5ED] hover:bg-[#ECEEF5]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isQuerying}
            placeholder={isListening ? "Listening..." : "Ask AEGISX about active telemetry..."}
            className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] focus:bg-white focus:border-[#C9362B] focus:ring-2 focus:ring-[#FFF1F0] text-xs text-[#172033] placeholder-[#8995AA] transition-all outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isQuerying}
            className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-[#C9362B] hover:bg-[#B92F26] disabled:bg-[#CBD5E1] text-white flex items-center justify-center transition-colors shadow-sm"
          >
            {isQuerying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
