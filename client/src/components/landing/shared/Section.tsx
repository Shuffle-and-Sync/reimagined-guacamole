import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  background?: "default" | "light" | "gradient";
}

/**
 * Reusable section wrapper component for landing page sections.
 * Provides consistent spacing and background options.
 */
export function Section({
  id,
  className = "",
  children,
  background = "default",
}: SectionProps) {
  const bgClass = {
    default: "bg-background",
    light: "bg-muted/20",
    gradient:
      "bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20",
  }[background];

  return (
    <section id={id} className={cn("py-20", bgClass, className)}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
