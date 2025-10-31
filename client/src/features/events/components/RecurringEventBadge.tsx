import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecurringEventBadgeProps {
  pattern: "daily" | "weekly" | "monthly";
  endDate?: Date | null;
}

export function RecurringEventBadge({
  pattern,
  endDate,
}: RecurringEventBadgeProps) {
  const getPatternText = () => {
    switch (pattern) {
      case "daily":
        return "Repeats daily";
      case "weekly":
        return "Repeats weekly";
      case "monthly":
        return "Repeats monthly";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1">
            <Repeat className="h-3 w-3" />
            {pattern}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getPatternText()}</p>
          {endDate && (
            <p className="text-xs">Until {format(endDate, "MMM d, yyyy")}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
