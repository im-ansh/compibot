import { MessageSquare, Plus, Trash2, Settings as SettingsIcon, ChevronDown, ChevronRight, FolderPlus, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: number;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  timestamp: number;
}

interface ChatSidebarProps {
  chats: ChatHistory[];
  projects: Project[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onAddChatToProject: (chatId: string, projectId: string) => void;
}

const ChatSidebar = ({ chats, projects, currentChatId, onSelectChat, onNewChat, onDeleteChat, onOpenSettings, onCreateProject, onDeleteProject, onAddChatToProject }: ChatSidebarProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showProjectSelector, setShowProjectSelector] = useState<string | null>(null);
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const orphanChats = chats.filter(chat => !chat.projectId);
  
  return (
    <div className="w-64 border-r border-border bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <Button onClick={onNewChat} className="w-full bg-black text-white hover:bg-black/90">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button onClick={onCreateProject} variant="outline" className="w-full">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {/* Projects with their chats */}
        {projects.map((project) => {
          const projectChats = chats.filter(chat => chat.projectId === project.id);
          const isExpanded = expandedProjects.has(project.id);
          
          return (
            <div key={project.id} className="mb-2">
              <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50">
                <button
                  onClick={() => toggleProject(project.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate text-sm font-semibold">{project.name}</span>
                  <span className="text-xs text-muted-foreground">({projectChats.length})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
              
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {projectChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        currentChatId === chat.id
                          ? "bg-secondary"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <button
                        onClick={() => onSelectChat(chat.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <MessageSquare className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">{chat.title}</span>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 hover:bg-destructive/10 rounded transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Orphan chats (not in any project) */}
        {orphanChats.length > 0 && (
          <div className="mt-4 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Uncategorized</div>
            {orphanChats.map((chat) => (
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
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProjectSelector(chat.id);
                    }}
                    className="p-1 hover:bg-primary/10 rounded transition-opacity"
                    title="Add to project"
                  >
                    <FolderInput className="h-4 w-4" />
                  </button>
                  {showProjectSelector === chat.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProjectSelector(null)}
                      />
                      <div className="absolute right-0 top-8 z-50 bg-white border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
                        <div className="text-xs font-semibold mb-2 px-2">Select Project</div>
                        {projects.length === 0 ? (
                          <div className="text-xs text-muted-foreground px-2 py-1">
                            No projects yet
                          </div>
                        ) : (
                          projects.map((project) => (
                            <button
                              key={project.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddChatToProject(chat.id, project.id);
                                setShowProjectSelector(null);
                              }}
                              className="w-full text-left px-2 py-1.5 text-sm hover:bg-secondary rounded transition-colors"
                            >
                              {project.name}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="p-1 hover:bg-destructive/10 rounded transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Button onClick={onOpenSettings} variant="outline" className="w-full">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
