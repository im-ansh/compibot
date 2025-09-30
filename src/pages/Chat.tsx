import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowUp, ImagePlus, Mic, LogOut, Square, Menu, Plus, SlidersHorizontal } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ModelSelector, { AIModel } from "@/components/ModelSelector";
import ChatSidebar, { ChatHistory } from "@/components/ChatSidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import { sendMessage, sendGigaMessage, Message } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [gigaResponses, setGigaResponses] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      loadChats();
      if (!currentChatId) {
        createNewChat();
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
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
    const newChat: StoredChat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      timestamp: Date.now(),
    };
    
    const storedChats = localStorage.getItem("compibot_chats");
    const allChats = storedChats ? JSON.parse(storedChats) : [];
    allChats.unshift(newChat);
    localStorage.setItem("compibot_chats", JSON.stringify(allChats));
    
    setCurrentChatId(newChatId);
    setMessages([]);
    setGigaResponses([]);
    loadChats();
  };

  const saveCurrentChat = (newMessages: ChatMessage[]) => {
    const storedChats = localStorage.getItem("compibot_chats");
    const allChats: StoredChat[] = storedChats ? JSON.parse(storedChats) : [];
    
    const chatIndex = allChats.findIndex(c => c.id === currentChatId);
    if (chatIndex !== -1) {
      allChats[chatIndex].messages = newMessages;
      if (newMessages.length > 0 && allChats[chatIndex].title === "New Chat") {
        allChats[chatIndex].title = newMessages[0].content.slice(0, 50) + "...";
      }
      localStorage.setItem("compibot_chats", JSON.stringify(allChats));
      loadChats();
    }
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

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
      
      geminiMessages.push({
        role: "user",
        parts: [{ text: input }]
      });

      if (selectedModel === "giga") {
        const responses = await sendGigaMessage(geminiMessages);
        setGigaResponses(responses);
      } else {
        const response = await sendMessage(geminiMessages, selectedModel);
        const assistantMessage: ChatMessage = { role: "assistant", content: response };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveCurrentChat(updatedMessages);
      }
    } catch (error) {
      toast({ title: "Failed to get response", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // For now, just show a message - full speech-to-text would need additional API
        toast({ title: "Speech-to-text coming soon!" });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 5000);
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
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
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
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
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            
            <div className="relative flex items-center gap-2 bg-background border border-input rounded-[2rem] p-2 shadow-sm">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
                onClick={createNewChat}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
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
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-secondary"
                onClick={startRecording}
                disabled={isRecording}
              >
                <Mic className={`h-5 w-5 ${isRecording ? "text-red-500" : ""}`} />
              </Button>
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
                  className="h-10 w-10 rounded-full flex-shrink-0 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                  onClick={handleSend} 
                  disabled={!input.trim()}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
