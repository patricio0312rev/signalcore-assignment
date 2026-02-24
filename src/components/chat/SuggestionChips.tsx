import { Lightbulb } from 'lucide-react';

interface SuggestionChipsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'We need full data sovereignty',
  "We're fully committed to LangChain",
  'Budget is our main constraint',
  'Best evaluation framework?',
  'We need OpenTelemetry support',
  'We run multi-step agents',
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lightbulb className="h-3 w-3" />
        <span>Try asking about</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            data-testid="suggestion-chip"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
