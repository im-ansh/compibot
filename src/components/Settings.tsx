import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PERSONAS = [
  { id: "helpful", name: "Helpful Assistant", prompt: "You are a helpful AI assistant. Provide clear, concise, and accurate responses." },
  { id: "creative", name: "Creative Writer", prompt: "You are a creative AI assistant. Provide imaginative, engaging, and artistic responses with vivid descriptions." },
  { id: "technical", name: "Technical Expert", prompt: "You are a technical AI assistant. Provide detailed, precise, and technical responses with code examples when relevant." },
  { id: "friendly", name: "Friendly Companion", prompt: "You are a friendly AI companion. Provide warm, conversational, and empathetic responses." },
  { id: "concise", name: "Concise Advisor", prompt: "You are a concise AI advisor. Provide brief, to-the-point responses without unnecessary elaboration." },
];

const THEME_COLORS = [
  { id: "blue", name: "Pastel Blue", hsl: "210 100% 85%" },
  { id: "pink", name: "Pastel Pink", hsl: "340 100% 85%" },
  { id: "green", name: "Pastel Green", hsl: "140 60% 75%" },
  { id: "purple", name: "Pastel Purple", hsl: "270 60% 80%" },
  { id: "yellow", name: "Pastel Yellow", hsl: "50 100% 80%" },
];

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [selectedPersona, setSelectedPersona] = useState("helpful");
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    const savedPersona = localStorage.getItem("ai_persona") || "helpful";
    const savedTheme = localStorage.getItem("app_theme") || "blue";
    const savedCustomPrompt = localStorage.getItem("custom_prompt") || "";
    
    setSelectedPersona(savedPersona);
    setSelectedTheme(savedTheme);
    setCustomPrompt(savedCustomPrompt);

    // Apply saved theme
    const theme = THEME_COLORS.find(t => t.id === savedTheme);
    if (theme) {
      document.documentElement.style.setProperty('--theme-accent', theme.hsl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("ai_persona", selectedPersona);
    localStorage.setItem("app_theme", selectedTheme);
    localStorage.setItem("custom_prompt", customPrompt);
    
    // Apply theme color
    const theme = THEME_COLORS.find(t => t.id === selectedTheme);
    if (theme) {
      document.documentElement.style.setProperty('--theme-accent', theme.hsl);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Persona */}
          <div className="space-y-3">
            <Label className="text-lg font-medium">AI Persona</Label>
            <RadioGroup value={selectedPersona} onValueChange={setSelectedPersona}>
              {PERSONAS.map((persona) => (
                <div key={persona.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={persona.id} id={persona.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={persona.id} className="font-medium cursor-pointer">
                      {persona.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{persona.prompt}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <Label className="text-lg font-medium">Button Theme</Label>
            <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
              <div className="grid grid-cols-2 gap-3">
                {THEME_COLORS.map((theme) => (
                  <div key={theme.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={theme.id} id={theme.id} />
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-6 h-6 rounded-full border" 
                        style={{ backgroundColor: `hsl(${theme.hsl})` }}
                      />
                      <Label htmlFor={theme.id} className="cursor-pointer">{theme.name}</Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label htmlFor="custom-prompt" className="text-lg font-medium">
              Custom Prompt
            </Label>
            <p className="text-sm text-muted-foreground">
              This prompt will be sent with every message to customize the AI's behavior.
            </p>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Always respond in a poetic style..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} style={{ backgroundColor: `hsl(var(--theme-accent))` }}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PERSONAS, THEME_COLORS };
