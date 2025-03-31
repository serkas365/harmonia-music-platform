import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const LoadingSkeleton = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container p-4 mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-60 mt-2" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Skeleton className="h-10 w-full md:w-1/2" />
          <Skeleton className="h-10 w-full md:w-[180px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-background-elevated rounded-lg p-3 flex items-center animate-pulse">
              <Skeleton className="w-14 h-14 rounded mr-3 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;