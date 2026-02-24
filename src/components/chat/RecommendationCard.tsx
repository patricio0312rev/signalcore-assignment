import { Award, CheckCircle2 } from 'lucide-react';

interface RecommendationCardProps {
  vendorName: string;
  reasoning: string[];
}

export function RecommendationCard({ vendorName, reasoning }: RecommendationCardProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Award className="h-4 w-4" />
        <span>Recommended: {vendorName}</span>
      </div>
      {reasoning.length > 0 && (
        <ul className="mt-2 space-y-1">
          {reasoning.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
