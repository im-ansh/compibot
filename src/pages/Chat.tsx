import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowUp, LogOut, Square, Menu, Plus, SlidersHorizontal, X } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ModelSelector, { AIModel } from "@/components/ModelSelector";
import ChatSidebar, { ChatHistory } from "@/components/ChatSidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import Settings from "@/components/Settings";
import { sendMessage, sendGigaMessage, sendAlphaMessage, Message } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface StoredChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

const Chat = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<AIModel>("lightweight");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [gigaResponses, setGigaResponses] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Array<{ data: string; mimeType: string }>>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || null);

      loadChats();
      
      // Create initial chat ID if none exists
      if (!currentChatId) {
        setCurrentChatId(Date.now().toString());
      }
      
      // Apply saved theme
      const savedTheme = localStorage.getItem("compibot_theme") || "black";
      const themeColors: Record<string, string> = {
        black: "hsl(0, 0%, 0%)",
        lavender: "hsl(270, 60%, 85%)",
        mint: "hsl(150, 60%, 85%)",
        peach: "hsl(20, 80%, 85%)",
        sky: "hsl(200, 70%, 85%)",
        rose: "hsl(340, 70%, 85%)",
      };
      document.documentElement.style.setProperty("--theme-accent", themeColors[savedTheme] || themeColors.black);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserEmail(session.user.email || null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, gigaResponses]);

  const loadChats = () => {
    const storedChats = localStorage.getItem("compibot_chats");
    if (storedChats) {
      const parsedChats: StoredChat[] = JSON.parse(storedChats);
      setChats(parsedChats.map(c => ({ id: c.id, title: c.title, timestamp: c.timestamp })));
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
    setGigaResponses([]);
  };

  const saveCurrentChat = (newMessages: ChatMessage[]) => {
    if (!currentChatId || newMessages.length === 0) return;
    
    const storedChats = localStorage.getItem("compibot_chats");
    const allChats: StoredChat[] = storedChats ? JSON.parse(storedChats) : [];
    
    const chatIndex = allChats.findIndex(c => c.id === currentChatId);
    if (chatIndex !== -1) {
      allChats[chatIndex].messages = newMessages;
      if (newMessages.length > 0 && allChats[chatIndex].title === "New Chat") {
        allChats[chatIndex].title = newMessages[0].content.slice(0, 50) + "...";
      }
    } else {
      // Create new chat entry only when first message is sent
      const newChat: StoredChat = {
        id: currentChatId,
        title: newMessages[0]?.content.slice(0, 50) + "..." || "New Chat",
        messages: newMessages,
        timestamp: Date.now(),
      };
      allChats.unshift(newChat);
    }
    
    localStorage.setItem("compibot_chats", JSON.stringify(allChats));
    loadChats();
  };

  const selectChat = (chatId: string) => {
    const storedChats = localStorage.getItem("compibot_chats");
    if (storedChats) {
      const allChats: StoredChat[] = JSON.parse(storedChats);
      const chat = allChats.find(c => c.id === chatId);
      if (chat) {
        setCurrentChatId(chatId);
        setMessages(chat.messages);
        setGigaResponses([]);
      }
    }
  };

  const deleteChat = (chatId: string) => {
    const storedChats = localStorage.getItem("compibot_chats");
    if (storedChats) {
      const allChats: StoredChat[] = JSON.parse(storedChats);
      const filteredChats = allChats.filter(c => c.id !== chatId);
      localStorage.setItem("compibot_chats", JSON.stringify(filteredChats));
      loadChats();
      
      if (currentChatId === chatId) {
        if (filteredChats.length > 0) {
          selectChat(filteredChats[0].id);
        } else {
          createNewChat();
        }
      }
    }
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    const updatedMessages = messages.slice(0, index);
    updatedMessages.push({ role: "user", content: newContent });
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setGigaResponses([]);

    try {
      const geminiMessages: Message[] = updatedMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      const persona = localStorage.getItem("compibot_persona") || "helpful";
      const customPrompt = localStorage.getItem("compibot_custom_prompt") || "";

      if (selectedModel === "giga") {
        const responses = await sendGigaMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        setGigaResponses(responses);
      } else if (selectedModel === "alpha") {
        const response = await sendAlphaMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        const assistantMessage: ChatMessage = { role: "assistant", content: response };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveCurrentChat(finalMessages);
      } else {
        const response = await sendMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        const assistantMessage: ChatMessage = { role: "assistant", content: response };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveCurrentChat(finalMessages);
      }
    } catch (error) {
      toast({ title: "Failed to get response", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setGigaResponses([]);

    try {
      const geminiMessages: Message[] = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));
      
      const currentMessageParts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];
      
      if (input.trim()) {
        currentMessageParts.push({ text: input });
      }
      
      selectedImages.forEach(img => {
        currentMessageParts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.data
          }
        });
      });

      geminiMessages.push({
        role: "user",
        parts: currentMessageParts
      });

      const persona = localStorage.getItem("compibot_persona") || "helpful";
      const customPrompt = localStorage.getItem("compibot_custom_prompt") || "";

      if (selectedModel === "giga") {
        const responses = await sendGigaMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        setGigaResponses(responses);
      } else if (selectedModel === "alpha") {
        const response = await sendAlphaMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        const assistantMessage: ChatMessage = { role: "assistant", content: response };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveCurrentChat(updatedMessages);
      } else {
        const response = await sendMessage(geminiMessages, selectedModel, userEmail, persona, customPrompt);
        const assistantMessage: ChatMessage = { role: "assistant", content: response };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveCurrentChat(updatedMessages);
      }
      
      setSelectedImages([]);
    } catch (error) {
      toast({ title: "Failed to get response", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Maximum size is 20MB", variant: "destructive" });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const data = base64.split(',')[1];
        setSelectedImages(prev => [...prev, { data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const selectGigaResponse = (response: string) => {
    const assistantMessage: ChatMessage = { role: "assistant", content: response };
    const updatedMessages = [...messages, assistantMessage];
    setMessages(updatedMessages);
    saveCurrentChat(updatedMessages);
    setGigaResponses([]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative'
      }`}>
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={(id) => {
            selectChat(id);
            if (isMobile) setSidebarOpen(false);
          }}
          onNewChat={() => {
            createNewChat();
            if (isMobile) setSidebarOpen(false);
          }}
          onDeleteChat={deleteChat}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <img src="/compibot-icon.png" alt="Compibot" className="h-8 w-8" />
            <h1 className="font-serif text-2xl">Compibot</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && gigaResponses.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <WelcomeMessage />
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <ChatMessage 
              key={idx} 
              role={msg.role} 
              content={msg.content}
              imageUrl={msg.imageUrl}
              onEdit={msg.role === "user" ? (newContent) => handleEditMessage(idx, newContent) : undefined}
            />
          ))}

          {gigaResponses.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Select your preferred response:
              </p>
              {gigaResponses.map((response, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <ChatMessage role="assistant" content={response} />
                  <Button
                    onClick={() => selectGigaResponse(response)}
                    className="mt-2 bg-black text-white hover:bg-black/90"
                  >
                    Select Response {idx + 1}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-secondary rounded-lg px-4 py-3">
                <p className="text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4 bg-background flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {showModelSelector && (
              <div className="mb-2">
                <ModelSelector selectedModel={selectedModel} onModelChange={(model) => {
                  setSelectedModel(model);
                  setShowModelSelector(false);
                }} />
              </div>
            )}
            
            {selectedImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={`data:${img.mimeType};base64,${img.data}`} 
                      alt="Selected" 
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative flex items-center gap-2 bg-background border border-input rounded-[2rem] p-2 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
                onClick={() => setShowModelSelector(!showModelSelector)}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Compibot..."
                className="flex-1 min-h-[40px] max-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2"
                rows={1}
              />
              
              {loading ? (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
                  onClick={() => setLoading(false)}
                >
                  <Square className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  className="h-10 w-10 rounded-full flex-shrink-0 disabled:opacity-50"
                  style={{ backgroundColor: "var(--theme-accent)", color: "#000" }}
                  onClick={handleSend} 
                  disabled={!input.trim() && selectedImages.length === 0}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Chat;