/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, Leaf, TramFront, MapPin, Sparkles, User, Info, Navigation, Droplet, Activity } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "./services/geminiService";
import { Chat } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import AppMap, { RouteData } from "./components/Map";

interface Message {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  routes?: RouteData[];
}

const PREDEFINED_PROMPTS = [
  "I need to go from Jadavpur to Salt Lake Sector V tomorrow morning at 9 AM. What's the greenest way?",
  "I'm at BBD Bag and need to reach Howrah.",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Nomoskar! I am **GreenPath**, your sustainable urban transportation assistant for Kolkata.\\n\\nTell me where you want to go, and I'll find you the greenest route.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [activeRoutes, setActiveRoutes] = useState<RouteData[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  
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
    setMessages((prev) => [...prev, { role: "user", content: userMessage, displayContent: userMessage }]);
    setIsLoading(true);

    try {
      const { text: responseText, newChatSession } = await sendMessage(userMessage, chatSession);
      setChatSession(newChatSession);
      
      // Parse JSON
      let displayContent = responseText;
      let routes: RouteData[] = [];
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.routes && Array.isArray(parsed.routes)) {
            routes = parsed.routes;
            setActiveRoutes(routes);
          }
          displayContent = responseText.replace(jsonMatch[0], "").trim();
        } catch (e) {
          console.error("Could not parse JSON", e);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText, displayContent, routes },
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
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-900">GreenPath <span className="font-normal text-slate-500 underline decoration-emerald-400">Kolkata</span></h1>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-semibold text-emerald-700">1,420 GreenCoins</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden flex items-center justify-center font-bold text-slate-400">
            JD
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <aside className="w-full md:w-96 lg:w-[420px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl shadow-slate-200">
          
          {/* User Impact Tracker - Top of Sidebar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 block">Your Monthly Impact</label>
            <div className="bg-emerald-900 rounded-xl p-4 text-white relative overflow-hidden shadow-sm">
              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <p className="text-xs opacity-80 mb-1">CO₂ Avoided</p>
                  <p className="text-2xl font-bold">12.4 <span className="text-sm font-normal opacity-70">kg</span></p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-emerald-300 mb-2">
                    <Leaf className="w-4 h-4 fill-emerald-300" />
                  </div>
                  <p className="text-[10px] text-emerald-100/70">Top 15% Commuters</p>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-emerald-800 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-emerald-400 w-3/4"></div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-800/30 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Chat Area */}
          <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-white">
            <div className="w-full space-y-6">
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
                      className={`flex max-w-[95%] sm:max-w-[90%] ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      } gap-3`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        {message.role === "user" ? (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border border-white shadow-sm overflow-hidden text-xs font-bold">
                            JD
                          </div>
                        ) : (
                          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45"></div>
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-3.5 rounded-2xl border ${
                          message.role === "user"
                            ? "bg-slate-100 border-slate-200 rounded-tr-none"
                            : "bg-white border-emerald-500/20 shadow-xl shadow-emerald-900/5 rounded-tl-none"
                        }`}
                      >
                        {message.role === "user" ? (
                          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{message.displayContent || message.content}</p>
                        ) : (
                          <div className="prose prose-sm prose-slate max-w-none text-slate-800 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-emerald-600 prose-strong:text-slate-900">
                            <Markdown remarkPlugins={[remarkGfm]}>{message.displayContent || message.content}</Markdown>
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
                        <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                        </div>
                      </div>
                      <div className="px-5 py-4 rounded-2xl bg-white border border-emerald-500/20 shadow-xl shadow-emerald-900/5 rounded-tl-none flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Input Area */}
          <footer className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 shadow-sm">
            <div className="w-full flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {messages.length === 1 && PREDEFINED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap text-left text-[11px] font-medium text-slate-600 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-full px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center"
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border-2 border-emerald-500"></div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Where do you want to go in Kolkata?"
                  className="w-full pl-7 pr-12 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white p-1.5 rounded-md transition-colors flex items-center justify-center shadow-md shadow-emerald-200"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </footer>
        </aside>

        {/* Main Map Area */}
        <section className="flex-1 relative bg-slate-100 flex flex-col">
          <AppMap routes={activeRoutes} selectedRouteId={selectedRouteId} />
          
          {/* Map Overlay Stats / Search / Tools */}
          <div className="absolute top-6 left-6 right-6 pointer-events-none flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-900/5 rounded-2xl p-4 w-72 pointer-events-auto">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Traffic Conditions</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Howrah Bridge</p>
                    <p className="text-[10px] text-red-500 font-medium">Heavy Congestion (Avoid)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <TramFront className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Green Line Metro</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Running Smoothly</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative pointer-events-auto flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> {activeRoutes.length > 0 ? `${activeRoutes.length} Route(s) mapped` : 'Map ready'}
                </div>
                <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>

              {/* Selectable Route Cards Overlay */}
              {activeRoutes.length > 0 && (
                <div className="w-80 mt-2 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                  {activeRoutes.map((route) => (
                    <div 
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`cursor-pointer transition-all p-3 rounded-xl border-2 backdrop-blur-md 
                        ${selectedRouteId === route.id ? 'bg-white border-emerald-500 shadow-xl' : 'bg-white/80 border-transparent hover:bg-white border-slate-200 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-slate-900" style={{ color: selectedRouteId === route.id ? route.color : undefined }}>{route.name}</h4>
                        <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {route.time}
                        </div>
                      </div>
                      <div className="flex justify-between items-end text-xs">
                        <div className="text-slate-500 font-medium">Est. {route.cost}</div>
                        {selectedRouteId === route.id && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); setShowStatsDialog(true); }}
                             className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                           >
                             View Stats
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Dialog Modal */}
          <AnimatePresence>
            {showStatsDialog && selectedRouteId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 pointer-events-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                  {/* ... Dialog Content ... */}
                  {(() => {
                    const r = activeRoutes.find(r => r.id === selectedRouteId);
                    if (!r) return null;
                    return (
                      <>
                        <div className="p-6 border-b border-slate-100" style={{ backgroundColor: r.color + '10' }}>
                          <h2 className="text-2xl font-bold text-slate-900 mb-1">{r.name}</h2>
                          <p className="text-sm text-slate-500">{r.waypoints.length} waypoints planned</p>
                        </div>
                        <div className="p-6 space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Estimated Time</p>
                               <p className="text-xl font-bold text-slate-800">{r.time || 'N/A'}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Estimated Cost</p>
                               <p className="text-xl font-bold text-slate-800">{r.cost || 'N/A'}</p>
                             </div>
                           </div>

                           <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                             <div className="flex justify-between items-center mb-2">
                               <p className="text-sm font-bold text-emerald-900 flex items-center gap-1.5"><Leaf className="w-4 h-4" /> Sustainability Score</p>
                               <span className="text-xl font-black text-emerald-600">{r.greenScore || 0}<span className="text-sm text-emerald-400">/100</span></span>
                             </div>
                             <p className="text-xs text-emerald-700 leading-relaxed">{r.sustainability || 'No specific impact data available.'}</p>
                           </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button 
                            onClick={() => setShowStatsDialog(false)}
                            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* System Bar */}
      <div className="h-8 bg-slate-900 text-[10px] text-slate-500 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-20 relative">
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

