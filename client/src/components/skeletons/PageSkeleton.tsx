export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 animate-pulse">
        {/* Page header */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />

        {/* Main content */}
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}
