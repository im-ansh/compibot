import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type AIModel = "lightweight" | "pro" | "giga";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const modelLabels: Record<AIModel, string> = {
    lightweight: "Lightweight",
    pro: "Pro",
    giga: "Giga",
  };

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
