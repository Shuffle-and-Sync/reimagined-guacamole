export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Hexagonal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-300 rounded-lg transform rotate-12 opacity-80"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-lg flex items-center justify-center border-2 border-yellow-400 shadow-lg">
        {/* Ampersand symbol */}
        <div className="text-white font-bold text-lg">&</div>
      </div>
    </div>
  );
}
