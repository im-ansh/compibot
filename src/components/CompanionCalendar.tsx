import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CompanionEvent } from "@/types/companion";
import { format, isSameDay } from "date-fns";
import { Bell, Clock, Calendar as CalendarIcon, Check } from "lucide-react";

interface CompanionCalendarProps {
  events: CompanionEvent[];
  onToggleComplete: (eventId: string) => void;
}

const CompanionCalendar = ({ events, onToggleComplete }: CompanionCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const eventsOnSelectedDate = selectedDate 
    ? events.filter(event => isSameDay(new Date(event.date), selectedDate))
    : [];

  const datesWithEvents = events.map(event => new Date(event.date));

  const getEventIcon = (type: CompanionEvent["type"]) => {
    switch (type) {
      case "alarm": return <Clock className="h-3 w-3" />;
      case "reminder": return <Bell className="h-3 w-3" />;
      case "event": return <CalendarIcon className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-3 space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        modifiers={{ hasEvent: datesWithEvents }}
        modifiersStyles={{
          hasEvent: { fontWeight: "bold", textDecoration: "underline" }
        }}
        className="rounded-md border"
      />
      
      {selectedDate && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          {eventsOnSelectedDate.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events scheduled</p>
          ) : (
            <div className="space-y-2">
              {eventsOnSelectedDate.map(event => (
                <div 
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <button
                    onClick={() => onToggleComplete(event.id)}
                    className="mt-0.5"
                  >
                    {event.completed ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className={`text-sm font-medium ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {event.title}
                      </span>
                    </div>
                    {event.time && (
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    )}
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {event.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanionCalendar;
