import { useState, useEffect, useRef } from "react";
import { Menu, Plus, SlidersHorizontal, ArrowUp, Square, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ModelSelector, { AIModel } from "@/components/ModelSelector";
import ChatSidebar, { ChatHistory } from "@/components/ChatSidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import { sendMessage, sendGigaMessage, Message } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Chat = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<AIModel>("lightweight");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserEmail(session.user.email || null);
      loadChats();
    };
    checkAuth();

    // Apply saved theme
    const savedTheme = localStorage.getItem("app_theme") || "black";
    const themeColors = [
      { id: "black", hsl: "0 0% 0%" },
      { id: "blue", hsl: "210 100% 85%" },
      { id: "pink", hsl: "340 100% 85%" },
      { id: "green", hsl: "140 60% 75%" },
      { id: "purple", hsl: "270 60% 80%" },
      { id: "yellow", hsl: "50 100% 80%" },
    ];
    const theme = themeColors.find(t => t.id === savedTheme);
    if (theme) {
      document.documentElement.style.setProperty('--theme-accent', theme.hsl);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserEmail(session.user.email || null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = () => {
    const stored = localStorage.getItem("chat_history");
    if (stored) {
      setChats(JSON.parse(stored));
    }
  };

  const saveChat = (chatId: string, chatMessages: Message[], title: string) => {
    const stored = localStorage.getItem("chat_history");
    const allChats: ChatHistory[] = stored ? JSON.parse(stored) : [];
    const existingIndex = allChats.findIndex(c => c.id === chatId);
    
    const chatData = {
      id: chatId,
      title,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      allChats[existingIndex] = chatData;
    } else {
      allChats.unshift(chatData);
    }

    localStorage.setItem("chat_history", JSON.stringify(allChats));
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(chatMessages));
    setChats(allChats);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChat(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    const stored = localStorage.getItem(`chat_${chatId}`);
    if (stored) {
      setMessages(JSON.parse(stored));
      setActiveChat(chatId);
      if (isMobile) setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    const stored = localStorage.getItem("chat_history");
    if (stored) {
      const allChats: ChatHistory[] = JSON.parse(stored);
      const filtered = allChats.filter(c => c.id !== chatId);
      localStorage.setItem("chat_history", JSON.stringify(filtered));
      localStorage.removeItem(`chat_${chatId}`);
      setChats(filtered);
      if (activeChat === chatId) {
        handleNewChat();
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Maximum size is 20MB",
          variant: "destructive"
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (isEdit = false, editIndex?: number) => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const inputText = input;
    const imagesToSend = [...selectedImages];
    
    // Clear input and images immediately
    setInput("");
    setSelectedImages([]);
    setEditingMessageIndex(null);

    const newUserMessage: Message = {
      role: "user",
      parts: [
        { text: inputText },
        ...imagesToSend.map(img => ({
          inline_data: {
            mime_type: img.split(';')[0].split(':')[1],
            data: img.split(',')[1]
          }
        }))
      ]
    };

    let updatedMessages: Message[];
    
    if (isEdit && editIndex !== undefined) {
      // Replace the edited message and remove all messages after it
      updatedMessages = [...messages.slice(0, editIndex), newUserMessage];
    } else {
      updatedMessages = [...messages, newUserMessage];
    }

    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let response: string | string[];
      
      if (selectedModel === "giga") {
        response = await sendGigaMessage(updatedMessages, userEmail);
        
        const responses = Array.isArray(response) ? response : [response];
        const parsedResponses = responses.map(r => {
          try {
            return JSON.parse(r);
          } catch {
            return { text: r, images: [] };
          }
        });

        const combinedText = parsedResponses.map((r, i) => 
          `**Response ${i + 1}:**\n${r.text}`
        ).join("\n\n---\n\n");

        const allImages = parsedResponses.flatMap(r => r.images || []);

        const assistantMessage: Message = {
          role: "model",
          parts: [{ text: combinedText }],
          images: allImages
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save chat with first user message
        if (updatedMessages.length === 1 || (isEdit && editIndex === 0)) {
          const chatId = activeChat || Date.now().toString();
          setActiveChat(chatId);
          const title = newUserMessage.parts.find(p => 'text' in p)?.text?.slice(0, 30) + "..." || "New Chat";
          saveChat(chatId, finalMessages, title);
        } else if (activeChat) {
          const title = chats.find(c => c.id === activeChat)?.title || "Chat";
          saveChat(activeChat, finalMessages, title);
        }
      } else {
        response = await sendMessage(updatedMessages, selectedModel, userEmail);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(response);
        } catch {
          parsedResponse = { text: response, images: [] };
        }

        const assistantMessage: Message = {
          role: "model",
          parts: [{ text: parsedResponse.text }],
          images: parsedResponse.images
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save chat with first user message
        if (updatedMessages.length === 1 || (isEdit && editIndex === 0)) {
          const chatId = activeChat || Date.now().toString();
          setActiveChat(chatId);
          const title = newUserMessage.parts.find(p => 'text' in p)?.text?.slice(0, 30) + "..." || "New Chat";
          saveChat(chatId, finalMessages, title);
        } else if (activeChat) {
          const title = chats.find(c => c.id === activeChat)?.title || "Chat";
          saveChat(activeChat, finalMessages, title);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (index: number, newContent: string) => {
    setEditingMessageIndex(index);
    setInput(newContent);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          currentChatId={activeChat || ""}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
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
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <WelcomeMessage />
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role === "user" ? "user" : "assistant"}
              content={msg.parts.find(p => 'text' in p)?.text || ""}
              images={msg.images}
              onEdit={msg.role === "user" ? (newContent) => handleEditMessage(idx, newContent) : undefined}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-secondary rounded-2xl px-4 py-3">
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
                      src={img} 
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
                className="h-10 w-10 rounded-full shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full shrink-0"
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
                    if (editingMessageIndex !== null) {
                      handleSend(true, editingMessageIndex);
                    } else {
                      handleSend();
                    }
                  }
                }}
                placeholder="Message Compibot..."
                className="flex-1 min-h-[40px] max-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2"
                rows={1}
              />

              <Button
                size="icon"
                className="h-10 w-10 rounded-full shrink-0"
                onClick={() => editingMessageIndex !== null ? handleSend(true, editingMessageIndex) : handleSend()}
                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                style={!isLoading && (input.trim() || selectedImages.length > 0) ? {
                  backgroundColor: `hsl(var(--theme-accent))`,
                  color: 'white'
                } : undefined}
              >
                {isLoading ? <Square className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
