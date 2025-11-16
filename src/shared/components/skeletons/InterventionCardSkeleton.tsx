/**
 * Skeleton pour InterventionCard
 */
export const InterventionCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
};
