import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: number;
}

interface ChatSidebarProps {
  chats: ChatHistory[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const ChatSidebar = ({ chats, currentChatId, onSelectChat, onNewChat }: ChatSidebarProps) => {
  return (
    <div className="w-64 border-r border-border bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <Button onClick={onNewChat} className="w-full bg-black text-white hover:bg-black/90">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-2 transition-colors ${
              currentChatId === chat.id
                ? "bg-secondary"
                : "hover:bg-secondary/50"
            }`}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">{chat.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
