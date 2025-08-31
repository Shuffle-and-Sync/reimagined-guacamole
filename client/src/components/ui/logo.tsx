export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-primary via-secondary to-accent rounded-lg flex items-center justify-center ${className}`}>
      <i className="fas fa-cards-blank text-white text-lg"></i>
    </div>
  );
}
