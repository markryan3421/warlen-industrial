import { Skeleton } from "../ui/skeleton";
import { TableSkeleton } from "./table-skeleton";

export const BranchesSkeleton = () => {
    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            
            {/* Branch-specific table columns */}
            <TableSkeleton rows={7} columns={5} />
        </div>
    );
}