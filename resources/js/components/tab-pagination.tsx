import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface PaginationData {
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface TabPaginationProps {
    pagination: PaginationData;
    perPage: string;
    onPerPageChange?: (value: string) => void;
    activeTab: string;
    searchTerm?: string;
    totalCount: number;
    filteredCount: number;
    resourceName?: string;
    className?: string;
}

export const TabPagination = ({
    pagination,
    perPage,
    onPerPageChange,
    activeTab,
    searchTerm = '',
    totalCount,
    filteredCount,
    resourceName = 'items',
    className = '',
}: TabPaginationProps) => {
    
    // Use the current_page directly from server
    const currentPage = pagination.current_page || 1;
    const lastPage = pagination.last_page || 1;
    
    // Helper function to build URL with preserved parameters
    const buildUrl = (page: number | null, newPerPage?: string) => {
        const params = new URLSearchParams();
        
        // Always preserve the active tab
        params.append('tab', activeTab);
        
        // Set per page (use new value if provided, otherwise current)
        params.append('perPage', newPerPage || perPage);
        
        // Set page
        if (page && page > 0) {
            params.append('page', page.toString());
        }
        
        // Preserve search term if exists
        if (searchTerm && searchTerm.trim()) {
            params.append('search', searchTerm.trim());
        }
        
        return `/attendances?${params.toString()}`;
    };
    
    // Handle page navigation
    const navigateToPage = (page: number) => {
        if (page < 1 || page > lastPage) return;
        if (page === currentPage) return;
        
        const url = buildUrl(page);
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    // Handle per page change
    const handlePerPageChange = (value: string) => {
        // Reset to page 1 when changing items per page
        const url = buildUrl(1, value);
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
        });
        
        if (onPerPageChange) {
            onPerPageChange(value);
        }
    };
    
    // Get visible page numbers (show 5 pages at a time)
    const getVisiblePages = () => {
        const windowSize = 5;
        
        let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
        const end = Math.min(lastPage, start + windowSize - 1);
        
        if (end - start + 1 < windowSize) {
            start = Math.max(1, end - windowSize + 1);
        }
        
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };
    
    const visiblePages = getVisiblePages();
    const showFirstEllipsis = visiblePages[0] > 1;
    const showLastEllipsis = visiblePages[visiblePages.length - 1] < lastPage;
    
    // Info text
    const infoText = searchTerm ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">
            Showing <span className="font-semibold text-stone-700 dark:text-stone-200">{filteredCount}</span>
            {' '}{resourceName}{filteredCount !== 1 ? 's' : ''} out of{' '}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{totalCount}</span>
            {' '}total {resourceName}{totalCount !== 1 ? 's' : ''}
            {searchTerm && (
                <span className="ml-1 text-blue-600 dark:text-blue-400">
                    (filtered by "{searchTerm}")
                </span>
            )}
        </p>
    ) : (
        <p className="text-xs text-stone-500 dark:text-stone-400">
            Showing{' '}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{pagination.from || 0}</span>
            {' – '}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{pagination.to || 0}</span>
            {' of '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{pagination.total || 0}</span>
            {' '}{resourceName}{pagination.total !== 1 ? 's' : ''}
        </p>
    );
    
    // Don't show pagination if only one page or no data
    if (lastPage <= 1 && pagination.total <= parseInt(perPage)) {
        return (
            <div className={`px-4 py-3 ${className}`}>
                <div className="flex items-center justify-between">
                    {infoText}
                    <PerPageSelect 
                        value={perPage} 
                        onChange={handlePerPageChange}
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div className={`px-4 py-3 font-sans ${className}`}>
            {/* Mobile View (stacked) */}
            <div className="flex flex-col items-center gap-3 sm:hidden">
                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    <FirstButton 
                        onClick={() => navigateToPage(1)} 
                        disabled={currentPage === 1}
                    />
                    <PrevButton 
                        onClick={() => navigateToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                    />
                    
                    {showFirstEllipsis && (
                        <>
                            <PageButton 
                                page={1} 
                                currentPage={currentPage}
                                onClick={() => navigateToPage(1)}
                            />
                            <Ellipsis />
                        </>
                    )}
                    
                    {visiblePages.map(page => (
                        <PageButton 
                            key={page}
                            page={page} 
                            currentPage={currentPage}
                            onClick={() => navigateToPage(page)}
                        />
                    ))}
                    
                    {showLastEllipsis && (
                        <>
                            <Ellipsis />
                            <PageButton 
                                page={lastPage} 
                                currentPage={currentPage}
                                onClick={() => navigateToPage(lastPage)}
                            />
                        </>
                    )}
                    
                    <NextButton 
                        onClick={() => navigateToPage(currentPage + 1)} 
                        disabled={currentPage === lastPage}
                    />
                    <LastButton 
                        onClick={() => navigateToPage(lastPage)} 
                        disabled={currentPage === lastPage}
                    />
                </div>
                
                {/* Info and Per Page */}
                <div className="flex items-center justify-between w-full gap-3">
                    {infoText}
                    <PerPageSelect 
                        value={perPage} 
                        onChange={handlePerPageChange}
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                    />
                </div>
            </div>
            
            {/* Desktop View (horizontal) */}
            <div className="hidden sm:flex items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    {infoText}
                </div>
                
                {/* Center: Page Navigation */}
                <div className="flex items-center gap-1">
                    <FirstButton 
                        onClick={() => navigateToPage(1)} 
                        disabled={currentPage === 1}
                    />
                    <PrevButton 
                        onClick={() => navigateToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                    />
                    
                    {showFirstEllipsis && (
                        <>
                            <PageButton 
                                page={1} 
                                currentPage={currentPage}
                                onClick={() => navigateToPage(1)}
                            />
                            <Ellipsis />
                        </>
                    )}
                    
                    {visiblePages.map(page => (
                        <PageButton 
                            key={page}
                            page={page} 
                            currentPage={currentPage}
                            onClick={() => navigateToPage(page)}
                        />
                    ))}
                    
                    {showLastEllipsis && (
                        <>
                            <Ellipsis />
                            <PageButton 
                                page={lastPage} 
                                currentPage={currentPage}
                                onClick={() => navigateToPage(lastPage)}
                            />
                        </>
                    )}
                    
                    <NextButton 
                        onClick={() => navigateToPage(currentPage + 1)} 
                        disabled={currentPage === lastPage}
                    />
                    <LastButton 
                        onClick={() => navigateToPage(lastPage)} 
                        disabled={currentPage === lastPage}
                    />
                </div>
                
                {/* Right: Per Page Select */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                            Rows per page
                        </span>
                        <PerPageSelect 
                            value={perPage} 
                            onChange={handlePerPageChange}
                            activeTab={activeTab}
                            searchTerm={searchTerm}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ButtonProps {
    onClick: () => void;
    disabled: boolean;
    children?: React.ReactNode;
}

const FirstButton = ({ onClick, disabled }: ButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            disabled 
                ? 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
        <ChevronsLeft size={14} />
    </button>
);

const PrevButton = ({ onClick, disabled }: ButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            disabled 
                ? 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
        <ChevronLeft size={14} />
    </button>
);

const NextButton = ({ onClick, disabled }: ButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            disabled 
                ? 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
        <ChevronRight size={14} />
    </button>
);

const LastButton = ({ onClick, disabled }: ButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            disabled 
                ? 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
        <ChevronsRight size={14} />
    </button>
);

interface PageButtonProps {
    page: number;
    currentPage: number;
    onClick: () => void;
}

const PageButton = ({ page, currentPage, onClick }: PageButtonProps) => {
    const isActive = page === currentPage;
    
    const baseClass = "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[12px] font-medium transition-colors";
    
    if (isActive) {
        return (
            <span className={`${baseClass} bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white cursor-default`}>
                {page}
            </span>
        );
    }
    
    return (
        <button
            onClick={onClick}
            className={`${baseClass} border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400`}
        >
            {page}
        </button>
    );
};

const Ellipsis = () => (
    <span className="inline-flex items-center justify-center w-8 h-8 text-stone-400 dark:text-stone-500">
        ...
    </span>
);

interface PerPageSelectProps {
    value: string;
    onChange: (value: string) => void;
    activeTab: string;
    searchTerm: string;
}

const PerPageSelect = ({ value, onChange, activeTab, searchTerm }: PerPageSelectProps) => {
    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="h-8 w-[72px] text-xs border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:ring-blue-500">
                <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent className="text-xs">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
            </SelectContent>
        </Select>
    );
};