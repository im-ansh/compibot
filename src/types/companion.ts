export interface CompanionEvent {
  id: string;
  type: "reminder" | "alarm" | "event";
  title: string;
  date: Date;
  time?: string;
  description?: string;
  completed: boolean;
}

export interface CompanionModeState {
  enabled: boolean;
  events: CompanionEvent[];
}
