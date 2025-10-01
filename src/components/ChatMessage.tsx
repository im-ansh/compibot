import ReactMarkdown from "react-markdown";
import { Copy, Check, Edit2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onEdit?: (newContent: string) => void;
}

const ChatMessage = ({ role, content, onEdit }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(editedContent);
      setIsEditing(false);
    }
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-black text-white rounded-2xl px-4 py-3 max-w-[80%] group relative">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-white/10 text-white rounded p-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-white text-black hover:bg-white/90 h-7 px-3"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(content);
                  }}
                  className="text-white hover:bg-white/10 h-7 px-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{content}</p>
              {onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-secondary rounded-2xl px-4 py-3 max-w-[80%] relative group">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <button
          onClick={handleCopy}
          className="absolute -bottom-6 right-0 flex items-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary rounded text-xs text-muted-foreground"
          title="Copy response"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatMessage;