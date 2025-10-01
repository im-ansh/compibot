import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

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

export default function Settings() {
  const navigate = useNavigate();
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
    
    toast({ title: "Settings saved successfully" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border p-4 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src="/compibot-icon.png" alt="Compibot" className="h-8 w-8" />
        <h1 className="font-serif text-2xl">Settings</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* AI Persona */}
        <div className="space-y-4">
          <div>
            <Label className="text-xl font-semibold">AI Persona</Label>
            <p className="text-sm text-muted-foreground mt-1">Choose how your AI assistant behaves</p>
          </div>
          <RadioGroup value={selectedPersona} onValueChange={setSelectedPersona}>
            {PERSONAS.map((persona) => (
              <div key={persona.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={persona.id} id={persona.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={persona.id} className="font-medium cursor-pointer text-base">
                    {persona.name}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{persona.prompt}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Theme Color */}
        <div className="space-y-4">
          <div>
            <Label className="text-xl font-semibold">Button Theme</Label>
            <p className="text-sm text-muted-foreground mt-1">Choose your preferred color theme</p>
          </div>
          <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_COLORS.map((theme) => (
                <div key={theme.id} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={theme.id} id={theme.id} />
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-8 h-8 rounded-full border-2" 
                      style={{ backgroundColor: `hsl(${theme.hsl})` }}
                    />
                    <Label htmlFor={theme.id} className="cursor-pointer font-medium">{theme.name}</Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="custom-prompt" className="text-xl font-semibold">
              Custom Prompt
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              This prompt will be sent with every message to customize the AI's behavior further.
            </p>
          </div>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Always respond in a poetic style, include emoji in responses, etc..."
            className="min-h-[120px]"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-black text-white hover:bg-black/90">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PERSONAS, THEME_COLORS };
