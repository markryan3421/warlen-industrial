interface TableSkeletonProps {
    columns: Array<{
        label: string;
        key: string;
        className?: string;
    }>;
    rows?: number;
    title?: string;
    animationDuration?: number; // in milliseconds
}

export const TableSkeleton = ({ 
    columns, 
    rows = 5,
    title = "Loading...",
    animationDuration = 1500 // Default to 1.5 seconds for smoother animation
}: TableSkeletonProps) => {
    const animationStyle = {
        animation: `pulse ${animationDuration}ms cubic-bezier(0.4, 0, 0.6, 1) infinite`
    };

    return (
        <div className="w-full font-sans">
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                
                {/* Header bar - Matches CustomTable header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-[#1d4791] dark:bg-[#1d4791]">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 bg-white/30 rounded" style={animationStyle} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="h-4 w-32 bg-white/30 rounded" style={animationStyle} />
                        <div className="h-3 w-24 bg-white/20 rounded mt-1" style={animationStyle} />
                    </div>
                </div>

                {/* Column Headers - Matches CustomTable header style */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
                                {/* # column */}
                                <th className="w-14 px-5 py-3 text-center">
                                    <div className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto" style={animationStyle} />
                                </th>
                                
                                {columns.map((col, index) => (
                                    <th
                                        key={`skeleton-header-${index}`}
                                        className={`px-4 py-3 text-left ${col.className || ''}`}
                                    >
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" style={animationStyle} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        
                        {/* Table Rows Skeleton */}
                        <tbody>
                            {Array.from({ length: rows }).map((_, rowIndex) => (
                                <tr
                                    key={`skeleton-row-${rowIndex}`}
                                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 bg-white dark:bg-slate-900"
                                >
                                    {/* Row index */}
                                    <td className="px-5 py-3.5 text-center align-middle">
                                        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" style={animationStyle} />
                                    </td>
                                    
                                    {/* Data cells */}
                                    {columns.map((_, colIndex) => (
                                        <td
                                            key={`skeleton-cell-${rowIndex}-${colIndex}`}
                                            className="px-4 py-3.5 align-middle"
                                        >
                                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" style={animationStyle} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile/Tablet skeleton views */}
                <div className="block lg:hidden">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            key={`mobile-skeleton-${rowIndex}`}
                            className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-lg" style={animationStyle} />
                                <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-lg" style={animationStyle} />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {columns.slice(0, 4).map((col, colIndex) => (
                                    <div key={`mobile-field-${rowIndex}-${colIndex}`}>
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1" style={animationStyle} />
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" style={animationStyle} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer skeleton */}
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" style={animationStyle} />
                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" style={animationStyle} />
                    </div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" style={animationStyle} />
                </div>
            </div>
        </div>
    );
};