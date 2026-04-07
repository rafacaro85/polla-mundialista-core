'use client';

import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

const ProfeAvatar3D = lazy(() => import('./ProfeAvatar3D'));

import { useSystemConfig } from '@/hooks/useSystemConfig';

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

  const config = useSystemConfig();

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-profe-chat', handleOpenChat);
    return () => window.removeEventListener('open-profe-chat', handleOpenChat);
  }, []);

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
      {/* Botón Flotante WhatsApp */}
      {!isOpen && (
        <a
          href={config?.socials?.whatsapp || "https://wa.me/573045414087"}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-[#25D366] rounded-full shadow-lg shadow-[#25D366]/30 flex items-center justify-center text-white hover:bg-[#128C7E] hover:scale-105 transition-all z-[60] group"
          aria-label="Hablar por WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" height="28" width="28">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          <span className="absolute -top-10 right-0 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-lg">
            Soporte WhatsApp
          </span>
        </a>
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

          {/* AVATAR 3D DE EL PROFE */}
          <div className="h-52 bg-gradient-to-b from-slate-800/80 to-slate-900 border-b border-slate-700/50 relative overflow-hidden shrink-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                  <span className="text-slate-500 text-xs">Cargando avatar...</span>
                </div>
              </div>
            }>
              <ProfeAvatar3D isTalking={isLoading} />
            </Suspense>
            {/* Gradiente inferior para transición suave al chat */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
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
