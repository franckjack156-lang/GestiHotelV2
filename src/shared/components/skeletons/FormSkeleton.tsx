/**
 * Skeleton pour les formulaires
 */
interface FormSkeletonProps {
  fields?: number;
}

export const FormSkeleton = ({ fields = 5 }: FormSkeletonProps) => {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
      </div>
    </div>
  );
};
