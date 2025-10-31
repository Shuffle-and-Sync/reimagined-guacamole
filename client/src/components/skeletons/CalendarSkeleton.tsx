export function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Calendar header */}
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
