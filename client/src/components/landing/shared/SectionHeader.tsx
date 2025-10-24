import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  titleClassName?: string;
}

/**
 * Reusable section header component for landing page sections.
 * Provides consistent typography and spacing for section titles.
 */
export function SectionHeader({
  title,
  subtitle,
  centered = true,
  className = "",
  titleClassName = "",
}: SectionHeaderProps) {
  const alignment = centered ? "text-center" : "text-left";

  return (
    <div className={cn("mb-12", alignment, className)}>
      <h2 className={cn("text-4xl lg:text-5xl font-bold mb-4", titleClassName)}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
