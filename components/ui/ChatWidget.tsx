"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface MessageData {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  actions?: { href: string; label: string }[];
}

interface Context {
  boats: { name: string; name_en?: string; description?: string; description_en?: string; capacity?: number }[];
  tours: { name: string; name_en?: string; description?: string; description_en?: string }[];
  faqs: { question: string; answer: string }[];
}

const QUICK_SUGGESTIONS = {
  tr: ["Rezervasyon nasıl yapılır?", "Turlar ne kadar sürer?", "Ne getirmeliyim?"],
  en: ["How do I make a reservation?", "How long are the tours?", "What should I bring?"],
};

const INTENT_RULES: { pattern: RegExp; href: string }[] = [
  { pattern: /\/rezervasyon|rezervasyon yap|rezervasyon sayfas|book a|make a reserv/i, href: "/rezervasyon" },
  { pattern: /\/iletisim|iletişim sayfas|bize ulaş|contact us|contact page/i, href: "/iletisim" },
  { pattern: /\/sss|sss sayfas|sık sorulan|faq page/i, href: "/sss" },
  { pattern: /\/hakkimizda|hakkımızda sayfas|about us page/i, href: "/hakkimizda" },
];

const ACTION_LABELS: Record<string, { tr: string; en: string }> = {
  "/rezervasyon": { tr: "Rezervasyon Yap →", en: "Make Reservation →" },
  "/iletisim": { tr: "İletişime Geç →", en: "Contact Us →" },
  "/sss": { tr: "Sık Sorulan Sorular →", en: "View FAQ →" },
  "/hakkimizda": { tr: "Hakkımızda →", en: "About Us →" },
};

function detectActions(text: string, isEn: boolean) {
  const found = new Set<string>();
  INTENT_RULES.forEach(({ pattern, href }) => {
    if (pattern.test(text)) found.add(href);
  });
  return Array.from(found).map((href) => ({
    href,
    label: isEn ? ACTION_LABELS[href].en : ACTION_LABELS[href].tr,
  }));
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<Context | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const isEn = language === "en";

  if (
    pathname?.startsWith('/admin-sefa3986') ||
    pathname?.startsWith('/kampanya-kodlar-3313') ||
    pathname?.startsWith('/tamay-3313')
  ) return null;

  const greeting = isEn
    ? "Hello! I'm the Balık Sefası assistant. Ask me about our boats, tours, pricing or reservations."
    : "Merhaba! Ben Balık Sefası asistanıyım. Tekneler, turlar, fiyatlar veya rezervasyon hakkında sorabilirsiniz.";

  // Fetch Firestore context on first open
  useEffect(() => {
    if (!isOpen || context) return;

    Promise.all([
      getDocs(collection(db, "boats")),
      getDocs(collection(db, "tours")),
      getDocs(collection(db, "faq")),
    ])
      .then(([boatSnap, tourSnap, faqSnap]) => {
        const boats = boatSnap.docs.map((d) => ({
          name: d.data().name || "",
          name_en: d.data().name_en,
          description: d.data().description || "",
          description_en: d.data().description_en,
          capacity: d.data().capacity,
        }));
        const tours = tourSnap.docs.map((d) => ({
          name: d.data().name || "",
          name_en: d.data().name_en,
          description: d.data().description || "",
          description_en: d.data().description_en,
        }));
        const faqs = faqSnap.docs
          .sort((a, b) => (a.data().order || 0) - (b.data().order || 0))
          .map((d) => ({ question: d.data().question || "", answer: d.data().answer || "" }))
          .filter((f) => f.question && f.answer);
        setContext({ boats, tours, faqs });
      })
      .catch(() => setContext({ boats: [], tours: [], faqs: [] }));
  }, [isOpen, context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: MessageData = { role: "user", content: trimmed };
      const history = [...messages, userMsg];
      const apiHistory = history.map((m) => ({ role: m.role, content: m.content }));

      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);

      let accumulated = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiHistory, context, language }),
        });

        if (!res.ok || !res.body) throw new Error("API error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snap = accumulated;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: snap };
            return updated;
          });
        }

        // Apply intent actions after streaming done
        const actions = detectActions(accumulated, isEn);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated, actions };
          return updated;
        });

        if (!isOpen) setHasNewMessage(true);

        // Fetch follow-up suggestions in background
        const finalContent = accumulated;
        fetch("/api/chat/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastAssistantMessage: finalContent, language }),
        })
          .then((r) => r.json())
          .then(({ suggestions }) => {
            if (suggestions?.length) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant" && last.content === finalContent) {
                  updated[updated.length - 1] = { ...last, suggestions };
                }
                return updated;
              });
            }
          })
          .catch(() => {});
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: isEn
              ? "Sorry, something went wrong. Please try again."
              : "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, context, language, isLoading, isOpen, isEn]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickSuggestions = isEn ? QUICK_SUGGESTIONS.en : QUICK_SUGGESTIONS.tr;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border border-[#6B9BC3]/20"
              style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0D2847] to-[#1B3A5C]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#00A9A5]/20 border border-[#00A9A5]/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#00A9A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">
                      {isEn ? "Balık Sefası Assistant" : "Balık Sefası Asistan"}
                    </p>
                    <p className="text-[#00C9C5] text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#00C9C5] rounded-full inline-block" />
                      {isEn ? "Online" : "Çevrimiçi"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Kapat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div
                className="h-[400px] overflow-y-auto px-4 py-3 flex flex-col gap-3"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#6B9BC350 transparent" }}
              >
                <AssistantBubble content={greeting} />

                {/* Initial quick suggestions */}
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-8">
                    {quickSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={isLoading}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-[#00A9A5]/40 text-[#0D6E6B] bg-[#00A9A5]/5 hover:bg-[#00A9A5]/15 transition-colors disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isLast = i === messages.length - 1;
                  const isTyping = msg.role === "assistant" && msg.content === "" && isLoading && isLast;

                  if (msg.role === "user") {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[82%] px-3 py-2 rounded-2xl rounded-br-none bg-gradient-to-br from-[#00A9A5] to-[#0D7A77] text-white text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <AssistantBubble
                        content={isTyping ? null : msg.content}
                        isTyping={isTyping}
                      />

                      {/* Intent action buttons */}
                      {!isTyping && msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-8">
                          {msg.actions.map((action) => (
                            <button
                              key={action.href}
                              onClick={() => {
                                setIsOpen(false);
                                router.push(action.href);
                              }}
                              className="text-[11px] px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00A9A5] to-[#0D7A77] text-white font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-[#00A9A5]/20"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* AI-generated follow-up suggestions */}
                      {!isTyping && isLast && msg.suggestions && msg.suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-8"
                        >
                          <p className="text-[10px] text-[#6B9BC3]/70 mb-1.5">
                            {isEn ? "You might also ask:" : "Bunları da sorabilirsin:"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                disabled={isLoading}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-[#6B9BC3]/35 text-[#1B3A5C] bg-[#6B9BC3]/5 hover:bg-[#6B9BC3]/15 transition-colors disabled:opacity-40"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[#6B9BC3]/15 p-3 flex items-end gap-2 bg-white/60">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isEn ? "Type a message… (Enter to send)" : "Mesajınızı yazın… (Enter ile gönderin)"}
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-xl border border-[#6B9BC3]/30 bg-white px-3 py-2 text-sm text-[#0D2847] placeholder-[#6B9BC3]/50 focus:outline-none focus:border-[#00A9A5]/60 focus:ring-1 focus:ring-[#00A9A5]/20 transition-all disabled:opacity-50"
                  style={{ scrollbarWidth: "none", minHeight: "38px" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#00A9A5] to-[#0D6E6B] text-white flex items-center justify-center disabled:opacity-35 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#00A9A5]/25"
                  aria-label="Gönder"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen((p) => !p)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-5 right-4 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A9A5] to-[#0D4A5C] shadow-lg shadow-[#00A9A5]/35 flex items-center justify-center text-white"
        aria-label={isOpen ? "Sohbeti kapat" : "Sohbet aç"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </motion.svg>
          )}
        </AnimatePresence>
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
        )}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-[#00A9A5]/50 animate-ping pointer-events-none" />
        )}
      </motion.button>
    </>
  );
}

function AssistantBubble({ content, isTyping }: { content: string | null; isTyping?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-[#0D2847] flex-shrink-0 flex items-center justify-center mb-0.5">
        <svg className="w-3 h-3 text-[#00A9A5]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" />
        </svg>
      </div>
      <div className="max-w-[82%] px-3 py-2 rounded-2xl rounded-bl-none bg-[#F0F7FF] text-[#0D2847] text-sm leading-relaxed">
        {isTyping ? (
          <span className="flex gap-1 items-center py-0.5 px-1">
            <span className="w-1.5 h-1.5 bg-[#6B9BC3] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-[#6B9BC3] rounded-full animate-bounce" style={{ animationDelay: "160ms" }} />
            <span className="w-1.5 h-1.5 bg-[#6B9BC3] rounded-full animate-bounce" style={{ animationDelay: "320ms" }} />
          </span>
        ) : (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
      </div>
    </div>
  );
}
