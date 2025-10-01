import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SettingsProps {
  onClose: () => void;
}

const PERSONAS = [
  { id: "helpful", name: "Helpful Assistant", prompt: "You are a helpful AI assistant. Provide clear, concise, and accurate responses." },
  { id: "creative", name: "Creative Writer", prompt: "You are a creative writing assistant. Provide imaginative, engaging, and artistic responses." },
  { id: "technical", name: "Technical Expert", prompt: "You are a technical expert. Provide detailed, precise, and technically accurate responses with code examples when relevant." },
  { id: "casual", name: "Casual Friend", prompt: "You are a friendly and casual AI companion. Keep responses warm, conversational, and easy to understand." },
  { id: "professional", name: "Professional Advisor", prompt: "You are a professional business advisor. Provide formal, structured, and strategic responses." },
];

const THEME_COLORS = [
  { id: "lavender", name: "Lavender", color: "hsl(270, 60%, 85%)" },
  { id: "mint", name: "Mint", color: "hsl(150, 60%, 85%)" },
  { id: "peach", name: "Peach", color: "hsl(20, 80%, 85%)" },
  { id: "sky", name: "Sky", color: "hsl(200, 70%, 85%)" },
  { id: "rose", name: "Rose", color: "hsl(340, 70%, 85%)" },
];

const Settings = ({ onClose }: SettingsProps) => {
  const [selectedPersona, setSelectedPersona] = useState(
    localStorage.getItem("compibot_persona") || "helpful"
  );
  const [customPrompt, setCustomPrompt] = useState(
    localStorage.getItem("compibot_custom_prompt") || ""
  );
  const [selectedTheme, setSelectedTheme] = useState(
    localStorage.getItem("compibot_theme") || "lavender"
  );

  const handleSave = () => {
    localStorage.setItem("compibot_persona", selectedPersona);
    localStorage.setItem("compibot_custom_prompt", customPrompt);
    localStorage.setItem("compibot_theme", selectedTheme);
    
    const themeColor = THEME_COLORS.find(t => t.id === selectedTheme)?.color || THEME_COLORS[0].color;
    document.documentElement.style.setProperty("--theme-accent", themeColor);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Persona */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">AI Persona</Label>
            <RadioGroup value={selectedPersona} onValueChange={setSelectedPersona}>
              {PERSONAS.map((persona) => (
                <div key={persona.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={persona.id} id={persona.id} />
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

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label htmlFor="custom-prompt" className="text-base font-semibold">
              Custom System Prompt
            </Label>
            <p className="text-sm text-muted-foreground">
              This will be added to every conversation. Leave empty to use only the persona prompt.
            </p>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter custom instructions for the AI..."
              className="min-h-[100px]"
            />
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Button Theme</Label>
            <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
              {THEME_COLORS.map((theme) => (
                <div key={theme.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={theme.id} id={theme.id} />
                  <Label htmlFor={theme.id} className="font-medium cursor-pointer flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} className="bg-black text-white hover:bg-black/90">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;