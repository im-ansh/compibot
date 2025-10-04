import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type AIModel = "lightweight" | "pro" | "giga" | "alpha" | "engineer" | "co-founder";

export type CoFounderMode = "user" | "founder" | "idea";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  coFounderMode?: CoFounderMode;
  onCoFounderModeChange?: (mode: CoFounderMode) => void;
}

const ModelSelector = ({ selectedModel, onModelChange, coFounderMode, onCoFounderModeChange }: ModelSelectorProps) => {
  const modelLabels: Record<AIModel, string> = {
    lightweight: "Lightweight",
    pro: "Pro",
    giga: "Giga",
    alpha: "Alpha",
    engineer: "Engineer",
    "co-founder": "Co-Founder",
  };

  const modeLabels: Record<CoFounderMode, string> = {
    user: "User Mode",
    founder: "Founder Mode",
    idea: "Idea Mode",
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {modelLabels[selectedModel]}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onModelChange("lightweight")}>
            Lightweight - Quick responses
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModelChange("pro")}>
            Pro - Detailed reasoning
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModelChange("giga")}>
            Giga - 4 combined responses
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModelChange("alpha")}>
            Alpha - AI-enhanced prompts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModelChange("engineer")}>
            Engineer - Code-only responses
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModelChange("co-founder")}>
            Co-Founder - For SaaS founders
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedModel === "co-founder" && onCoFounderModeChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {coFounderMode ? modeLabels[coFounderMode] : "Select Mode"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onCoFounderModeChange("user")}>
              User Mode - Screen analysis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCoFounderModeChange("founder")}>
              Founder Mode - Idea discussion
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCoFounderModeChange("idea")}>
              Idea Mode - Feature generation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ModelSelector;
