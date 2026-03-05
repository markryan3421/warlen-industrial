import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

interface PaginationProps {
    pagination: PaginationData;
    perPage: string;
    onPerPageChange: (value: string) => void;
    totalCount: number;
    filteredCount: number;
    search: string;
    resourceName?: string;
}

export const Pagination = ({
    pagination,
    perPage,
    onPerPageChange,
    totalCount,
    filteredCount,
    search,
    resourceName = "item",
}: PaginationProps) => {

    const windowSize = 5;
    const previousLink = pagination.links[0];
    const nextLink = pagination.links[pagination.links.length - 1];
    const pageLinks = pagination.links.slice(1, -1);
    const currentIndex = pageLinks.findIndex(link => link.active);
    const start = Math.floor(currentIndex / windowSize) * windowSize;
    const visiblePages = pageLinks.slice(start, start + windowSize);

    // ── Info text ─────────────────────────────────────────────────────────────
    const infoText = search ? (
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center sm:text-left">
            Showing{" "}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{filteredCount}</span>
            {" "}{resourceName}{filteredCount !== 1 && "s"} out of{" "}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{totalCount}</span>
            {" "}{resourceName}{totalCount !== 1 && "s"}
        </p>
    ) : (
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center sm:text-left">
            Showing{" "}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{pagination.from}</span>
            {" "}–{" "}
            <span className="font-semibold text-stone-700 dark:text-stone-200">{pagination.to}</span>
            {" "}of{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{pagination.total}</span>
            {" "}{resourceName}{totalCount !== 1 && "s"}
        </p>
    );

    return (
        <div className="px-4 pt-4 pb-2 font-sans">

            {/* ══════════════════════════════════════════════════════════════════
                MOBILE  (below sm — stacked vertically, centered)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center gap-3 sm:hidden">

                {/* Page number buttons */}
                <div className="flex items-center gap-1">
                    <PrevButton link={previousLink} />
                    {visiblePages.map((link, i) => (
                        <PageButton key={i} link={link} />
                    ))}
                    <NextButton link={nextLink} />
                </div>

                {/* Info + per-page on the same row */}
                <div className="flex items-center justify-between w-full gap-3">
                    {infoText}
                    <PerPageSelect value={perPage} onChange={onPerPageChange} />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TABLET / DESKTOP  (sm and above — single row, space-between)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="hidden sm:flex items-center justify-between gap-4">

                {/* Left: info text */}
                {infoText}

                {/* Center: page number buttons */}
                <div className="flex items-center gap-1">
                    <PrevButton link={previousLink} />
                    {visiblePages.map((link, i) => (
                        <PageButton key={i} link={link} />
                    ))}
                    <NextButton link={nextLink} />
                </div>

                {/* Right: rows per page */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        Rows per page
                    </span>
                    <PerPageSelect value={perPage} onChange={onPerPageChange} />
                </div>
            </div>

        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Previous (‹) button */
function PrevButton({ link }: { link: LinkProps }) {
    if (!link?.url) {
        return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed">
                <ChevronLeft size={14} />
            </span>
        );
    }
    return (
        <Link
            href={link.url}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
            <ChevronLeft size={14} />
        </Link>
    );
}

/** Next (›) button */
function NextButton({ link }: { link: LinkProps }) {
    if (!link?.url) {
        return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed">
                <ChevronRight size={14} />
            </span>
        );
    }
    return (
        <Link
            href={link.url}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
            <ChevronRight size={14} />
        </Link>
    );
}

/** Numbered page button */
function PageButton({ link }: { link: LinkProps }) {
    const base = "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[12px] font-medium transition-colors";

    if (link.active) {
        return (
            <span className={`${base} bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white cursor-default`}>
                {link.label}
            </span>
        );
    }

    if (!link.url) {
        return (
            <span className={`${base} border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed`}>
                {link.label}
            </span>
        );
    }

    return (
        <Link
            href={link.url}
            className={`${base} border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400`}
        >
            {link.label}
        </Link>
    );
}

/** Rows-per-page select */
function PerPageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
                <SelectItem value="-1">All</SelectItem>
            </SelectContent>
        </Select>
    );
}