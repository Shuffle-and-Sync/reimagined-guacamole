export function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {/* Modal header */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>

      {/* Modal content */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>

      {/* Modal footer */}
      <div className="flex justify-end space-x-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    </div>
  );
}
