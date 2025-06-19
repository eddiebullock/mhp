'use client';
import React, { useState, useRef } from 'react';
import PaperCitation from './PaperCitation';
import CrisisAlert from './CrisisAlert';

export default function MentalHealthChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [crisis, setCrisis] = useState(null);
  const [searchTerms, setSearchTerms] = useState([]);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { role: 'user', content: input }]);
    setLoading(true);
    setTyping(true);
    setInput('');
    try {
      const res = await fetch('/api/mental-health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      setSearchTerms(data.searchTermsUsed || []);
      if (data.crisisDetected) {
        setCrisis(data.crisisResources);
        setMessages(msgs => [...msgs, { role: 'assistant', content: data.response }]);
      } else {
        setCrisis(null);
        setMessages(msgs => [
          ...msgs,
          {
            role: 'assistant',
            content: data.response,
            papers: data.papers || []
          }
        ]);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
    setTyping(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mental Health Research Chatbot</h2>
      <div className="mb-2 text-xs text-gray-500">Search terms used: {searchTerms.join(', ')}</div>
      <div className="border rounded p-4 h-96 overflow-y-auto bg-white mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded ${msg.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>{msg.content}</div>
            {msg.papers && msg.papers.length > 0 && (
              <div className="mt-2">
                <details>
                  <summary className="cursor-pointer text-sm text-blue-700">Show research citations</summary>
                  {msg.papers.map((p, j) => <PaperCitation key={j} paper={p} />)}
                </details>
              </div>
            )}
          </div>
        ))}
        {typing && <div className="text-gray-400">Assistant is typing...</div>}
      </div>
      {crisis && <CrisisAlert resources={crisis} />}
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a mental health question..."
          disabled={loading}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
} 