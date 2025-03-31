import { Loader2 } from "lucide-react";

const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  );
};

export default LoadingSkeleton;