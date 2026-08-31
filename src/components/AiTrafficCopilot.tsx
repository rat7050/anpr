import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldAlert, Wrench, Route, Cpu, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiTrafficCopilotProps {
  systemContext: any;
}

export const AiTrafficCopilot: React.FC<AiTrafficCopilotProps> = ({ systemContext }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>>([
    {
      role: 'assistant',
      text: `### 🤖 Indian ICCC Smart Traffic AI Incident Commander Active\n\nI have continuous spatial awareness over the 6 active Delhi-NCR camera corridors (DND Flyway, Ashram Chowk, Ring Road, NH-48 Express, AIIMS, Nehru Place), real-time Indian HSRP Vahan blacklist tracking, PWD/NHAI pothole work orders, and 112 ERSS emergency response telemetry.\n\nHow can I assist your traffic operations team?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    { label: 'Emergency Green Corridor for NH-48 Accident', prompt: 'Generate an emergency dispatch and Green Corridor protocol for the critical collision on Delhi-Gurugram Expressway NH-48 (ACC-801, 3 vehicles involved) to AIIMS Trauma Centre.' },
    { label: 'Intercept Vector for Stolen Plate DL 01 AB 1234', prompt: 'Analyze the chronological trajectory of blacklisted vehicle DL 01 AB 1234 (DND Flyway -> Nehru Place -> Ashram Chowk) and recommend interception choke points at Delhi Police barricades.' },
    { label: 'Prioritize Pothole Batch for PWD / NHAI', prompt: 'Review reported road defects (POT-101 on NH-48 Mahipalpur, POT-102 on DND Flyway, POT-105 near AIIMS) and recommend the most cost-effective and safety-critical repair sequence under IRC guidelines.' },
    { label: 'Delhi-NCR Arterial Signal Timing Advisory', prompt: 'Based on current gridlock on DND Flyway and heavy flow on Inner Ring Road, what adaptive ITMS signal timing cycles should be pushed?' }
  ];

  const handleSend = async (userPrompt?: string) => {
    const promptToSend = userPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg = {
      role: 'user' as const,
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          context: systemContext
        })
      });
      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.text || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `### 🚨 Indian ICCC Incident Commander Automated Advisory\n\n- **Emergency Green Corridor**: Activate immediate green wave along Ring Road for CATS Ambulance unit responding to NH-48 crash (ACC-801).\n- **HSRP Police Barricade**: Deploy intercept alert for stolen vehicle DL 01 AB 1234 heading towards Ashram Chowk Underpass.\n- **PWD Urgent Patching**: Dispatch municipal asphalt repair crew for critical defect POT-101 (1,450 cm²) on NH-48 Mahipalpur.\n- **Adaptive ITMS**: Increase green cycle by +20s on DND Flyway Toll Plaza to relieve trans-Yamuna congestion.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[640px] bg-[#0d1016] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      
      {/* Top Banner */}
      <div className="p-3.5 bg-[#0a0c10] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <span>Traffic Operations AI Copilot</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                GEMINI 3.1 PRO • DEEP THINKING
              </span>
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
              AUTONOMOUS INCIDENT TRIAGE • POSTGIS CORRIDOR DISPATCH
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-2.5 bg-black/40 border-b border-white/10 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-mono text-[10px] uppercase whitespace-nowrap">Suggested Directives:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded bg-[#0d1016] hover:bg-white/5 text-gray-300 hover:text-white border border-white/10 whitespace-nowrap text-[11px] font-mono transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Message Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-lg p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-black/70 border border-white/10 text-gray-200 shadow-xl'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
            <span className="text-[9px] font-mono text-gray-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-black/60 rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-300 w-fit shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            <span>GEMINI THINKING & ANALYZING POSTGIS SPATIAL CORRIDORS...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#0a0c10] border-t border-white/10 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI Incident Commander (e.g. recommend diversion route for accident ACC-801)..."
          className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
        />

        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-gray-600 text-black font-bold rounded transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
