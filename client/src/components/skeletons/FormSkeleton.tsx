interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    </div>
  );
}
