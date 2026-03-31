'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ProfeChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Reemplaza NEXT_PUBLIC_API_URL con tu variable real de entorno o url base
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/chat-assistant/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Error al contactar a El Profe:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Uf, mi llave, me quedé sin señal. Intenta de nuevo porfa.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white hover:bg-emerald-400 hover:scale-105 transition-all z-[60] group"
          aria-label="Hablar con El Profe"
        >
          <MessageCircle size={28} />
          {/* Tooltip on hover */}
          <span className="absolute -top-10 right-0 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-lg">
            ¡Dudas! Pregúntale al Profe
          </span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-[90vw] max-w-sm sm:w-96 min-h-[450px] h-[70vh] max-h-[700px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-[60] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          
          {/* HEADER (BARRAS DE CONTROL) */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <h3 className="text-emerald-500 font-russo font-bold flex items-center gap-2 tracking-wide uppercase text-sm">
              <Bot size={18} /> Asistente Profe
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* ÁREA SUPERIOR: RESERVADA PARA EL AVATAR ANIMADO */}
          {/* Instrucción: Aquí puedes inyectar luego un <video> o <img> animado */}
          <div className="h-32 bg-slate-800/50 flex flex-col items-center justify-center border-b border-slate-700/50 relative overflow-hidden shrink-0">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-2 animate-pulse shadow-lg shadow-slate-900">
              <span className="text-slate-500 text-[10px] uppercase font-bold text-center leading-tight">Espacio<br/>Avatar</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">Avatar Animado de El Profe Aquí</span>
            
            {/* Efecto de fondo sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
          </div>

          {/* ÁREA CENTRAL: MENSAJES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-6 flex flex-col items-center">
                <Bot size={40} className="text-slate-700 mb-3" />
                <p className="text-sm font-medium">¡Hola mi llave!</p>
                <p className="text-xs mt-1 max-w-[200px] mx-auto opacity-70">
                  Soy El Profe, tu asistente experto en La Polla Virtual. ¿En qué te ayudo hoy?
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-slate-950 rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="bg-slate-800 border border-slate-700 text-emerald-500 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium text-slate-400">El Profe está escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ÁREA INFERIOR: INPUT */}
          <div className="p-3 bg-slate-950/80 backdrop-blur border-t border-slate-800 shrink-0">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-2 py-1.5 focus-within:border-emerald-500/50 transition-colors shadow-inner"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 bg-transparent text-white text-sm px-3 py-1 outline-none placeholder:text-slate-500 min-w-0"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-400 transition-colors shrink-0"
                aria-label="Enviar"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-2">
                <span className="text-[9px] text-slate-600 font-medium uppercase tracking-wider">Powered by IA</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
