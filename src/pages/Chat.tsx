import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowUp, ImagePlus, Mic, LogOut } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ModelSelector, { AIModel } from "@/components/ModelSelector";
import ChatSidebar, { ChatHistory } from "@/components/ChatSidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import { sendMessage, sendGigaMessage, Message } from "@/lib/gemini";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = localStorage.getItem("compibot_user");
    if (!user) {
      navigate("/auth");
    }

    loadChats();
    if (!currentChatId) {
      createNewChat();
    }
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

  const handleLogout = () => {
    localStorage.removeItem("compibot_user");
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
    <div className="flex h-screen bg-white">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/compibot-icon.png" alt="Compibot" className="h-8 w-8" />
            <h1 className="font-serif text-2xl font-bold">Compibot</h1>
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

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            <Button variant="outline" size="icon">
              <ImagePlus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={startRecording}
                size="icon"
                variant="outline"
                disabled={isRecording}
              >
                <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
              </Button>
              <Button
                onClick={handleSend}
                size="icon"
                disabled={loading || !input.trim()}
                className="bg-black text-white hover:bg-black/90"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
