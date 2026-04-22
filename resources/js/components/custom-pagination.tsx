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
	current_page?: number;
}

interface PaginationProps {
	pagination: PaginationData;
	perPage: string;
	onPerPageChange: (value: string) => void;
	totalCount: number;
	filteredCount: number;
	search: string;
	resourceName?: string;
	onPageChange?: (page: number) => void;
}

export const CustomPagination = ({
	pagination,
	perPage,
	onPerPageChange,
	totalCount,
	filteredCount,
	search,
	resourceName = "item",
	onPageChange,
}: PaginationProps) => {

	const windowSize = 5;
	const previousLink = pagination.links[0];
	const nextLink = pagination.links[pagination.links.length - 1];
	const pageLinks = pagination.links.slice(1, -1);
	const currentIndex = pageLinks.findIndex(link => link.active);
	const start = Math.floor(currentIndex / windowSize) * windowSize;
	const visiblePages = pageLinks.slice(start, start + windowSize);

	// Helper to get current page number from pagination
	const currentPage = pagination.current_page ??
		pageLinks.find(link => link.active)?.label ?? '1';

	// Compute prev/next page numbers
	const prevPageNum = Number(currentPage) - 1;
	const nextPageNum = Number(currentPage) + 1;

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

			{/* MOBILE */}
			<div className="flex flex-col items-center gap-3 sm:hidden">
				<div className="flex items-center gap-1">
					<PrevButton
						link={previousLink}
						onPageChange={onPageChange}
						pageNum={prevPageNum}
						disabled={!previousLink?.url}
					/>
					{visiblePages.map((link, i) => (
						<PageButton
							key={i}
							link={link}
							onPageChange={onPageChange}
						/>
					))}
					<NextButton
						link={nextLink}
						onPageChange={onPageChange}
						pageNum={nextPageNum}
						disabled={!nextLink?.url}
					/>
				</div>
				<div className="flex items-center justify-between w-full gap-3">
					{infoText}
					<PerPageSelect value={perPage} onChange={onPerPageChange} />
				</div>
			</div>

			{/* TABLET / DESKTOP */}
			<div className="hidden sm:flex items-center justify-between gap-4">
				{infoText}
				<div className="flex items-center gap-1">
					<PrevButton
						link={previousLink}
						onPageChange={onPageChange}
						pageNum={prevPageNum}
						disabled={!previousLink?.url}
					/>
					{visiblePages.map((link, i) => (
						<PageButton
							key={i}
							link={link}
							onPageChange={onPageChange}
						/>
					))}
					<NextButton
						link={nextLink}
						onPageChange={onPageChange}
						pageNum={nextPageNum}
						disabled={!nextLink?.url}
					/>
				</div>
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
// SUB-COMPONENTS (modified to support onPageChange)
// =============================================================================

function PrevButton({ link, onPageChange, pageNum, disabled }: {
	link: LinkProps;
	onPageChange?: (page: number) => void;
	pageNum: number;
	disabled?: boolean;
}) {
	const isDisabled = !link?.url || disabled;

	if (isDisabled) {
		return (
			<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed">
				<ChevronLeft size={14} />
			</span>
		);
	}

	const handleClick = (e: React.MouseEvent) => {
		if (onPageChange) {
			e.preventDefault();
			onPageChange(pageNum);
		}
	};

	if (onPageChange) {
		return (
			<button
				onClick={handleClick}
				className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
			>
				<ChevronLeft size={14} />
			</button>
		);
	}

	return (
		<Link
			href={link.url!}
			className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
		>
			<ChevronLeft size={14} />
		</Link>
	);
}

function NextButton({ link, onPageChange, pageNum, disabled }: {
	link: LinkProps;
	onPageChange?: (page: number) => void;
	pageNum: number;
	disabled?: boolean;
}) {
	const isDisabled = !link?.url || disabled;

	if (isDisabled) {
		return (
			<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed">
				<ChevronRight size={14} />
			</span>
		);
	}

	const handleClick = (e: React.MouseEvent) => {
		if (onPageChange) {
			e.preventDefault();
			onPageChange(pageNum);
		}
	};

	if (onPageChange) {
		return (
			<button
				onClick={handleClick}
				className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
			>
				<ChevronRight size={14} />
			</button>
		);
	}

	return (
		<Link
			href={link.url!}
			className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
		>
			<ChevronRight size={14} />
		</Link>
	);
}

function PageButton({ link, onPageChange }: {
	link: LinkProps;
	onPageChange?: (page: number) => void;
}) {
	const base = "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[12px] font-medium transition-colors";

	if (link.active) {
		return (
			<span className={`${base} bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white cursor-default`}>
				{link.label}
			</span>
		);
	}

	const isDisabled = !link.url;
	const pageNumber = parseInt(link.label, 10);

	const handleClick = (e: React.MouseEvent) => {
		if (onPageChange && !isDisabled) {
			e.preventDefault();
			onPageChange(pageNumber);
		}
	};

	if (onPageChange && !isDisabled) {
		return (
			<button
				onClick={handleClick}
				className={`${base} border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400`}
			>
				{link.label}
			</button>
		);
	}

	if (isDisabled) {
		return (
			<span className={`${base} border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed`}>
				{link.label}
			</span>
		);
	}

	return (
		<Link
			href={link.url!}
			className={`${base} border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400`}
		>
			{link.label}
		</Link>
	);
}

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
			</SelectContent>
		</Select>
	);
}