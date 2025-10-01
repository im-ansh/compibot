import { MessageSquare, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  onDeleteChat: (id: string) => void;
}

const ChatSidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }: ChatSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-64 border-r border-border bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <Button onClick={onNewChat} className="w-full bg-black text-white hover:bg-black/90">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button 
          onClick={() => navigate("/settings")}
          variant="outline"
          className="w-full justify-start"
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group w-full flex items-center gap-2 p-3 rounded-lg mb-1 transition-colors ${
                currentChatId === chat.id
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              }`}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
