/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, Leaf, TramFront, MapPin, Sparkles, User, Info } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "./services/geminiService";
import { Chat } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PREDEFINED_PROMPTS = [
  "I need to go from Jadavpur to Salt Lake Sector V tomorrow morning at 9 AM. What's the greenest way?",
  "I'm at BBD Bag and need to reach Howrah Station urgently.",
  "Flight at 2 PM. I'm in Garia right now. Best way to airport?",
  "It's raining heavily. How do I get from Behala to Esplanade?",
  "I'm from WBTC. Show me which corridors have the most cab traffic that could shift to buses.",
  "I just got off the Metro at Karunamoyee. I need to reach Technopolis building in Sector V.",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Nomoskar! I am **GreenPath**, your sustainable urban transportation assistant for Kolkata.\\n\\nTell me where you want to go, and I'll find you the greenest, fastest route including Metro, WBTC Bus, Ferry, E-rickshaw, or direct Cabs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { text: responseText, newChatSession } = await sendMessage(userMessage, chatSession);
      setChatSession(newChatSession);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while finding your route. Please try again or check your API key.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-900">GreenPath <span className="font-normal text-slate-500 underline decoration-emerald-400">Kolkata</span></h1>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-semibold text-emerald-700">Live Traffic</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden flex items-center justify-center text-slate-400">
            <User className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          <AnimatePresence initial={false}>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[90%] sm:max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  } gap-3`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {message.role === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border-2 border-white overflow-hidden shadow-sm">
                        <User className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                        <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`px-5 py-4 rounded-2xl border ${
                      message.role === "user"
                        ? "bg-slate-100 border-slate-200 rounded-tr-none"
                        : "bg-white border-emerald-500/20 shadow-xl shadow-emerald-900/5 rounded-tl-none"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-800 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-emerald-600 prose-strong:text-slate-900">
                        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex max-w-[80%] flex-row gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-white border border-emerald-500/20 shadow-xl shadow-emerald-900/5 rounded-tl-none flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 sm:px-8 py-6 shrink-0 shadow-sm z-10 flex flex-col gap-4">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
          {messages.length === 1 && (
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 block">Suggested Routes</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PREDEFINED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs sm:text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-emerald-200 rounded-lg px-3 py-2.5 transition-colors line-clamp-2 leading-snug focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Route Planning</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="relative flex items-center"
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-emerald-500"></div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Where do you want to go in Kolkata?"
                className="w-full pl-8 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white p-2 rounded-md transition-colors flex items-center justify-center shadow-md shadow-emerald-200"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
          
          <div className="text-center text-[10px] text-slate-400 mt-1 flex justify-center items-center gap-1.5 uppercase font-bold tracking-wider">
             <Info className="w-3 h-3" /> Verify critical routes with official timetables
          </div>
        </div>
      </footer>

      {/* System Bar */}
      <div className="h-8 bg-slate-900 text-[10px] text-slate-500 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-4">
          <span className="hidden sm:inline">AQI Kolkata: 124 (Moderate)</span>
          <span className="hidden sm:inline">•</span>
          <span>Active E-Buses: ~412</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Grid Carbon: 0.82 kg/kWh</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="uppercase tracking-widest text-slate-400">System Active</span>
        </div>
      </div>
    </div>
  );
}

