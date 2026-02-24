import { Link } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LinkProps {
    // From links array 
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
    resourceName?: string; // e.g. "product", "permission", etc. Used for display purposes.
}

export const Pagination = ({ pagination, perPage, onPerPageChange, totalCount, filteredCount, search, resourceName = "item" }: PaginationProps) => {
    console.log('perPage', perPage);
    const windowSize = 5; // 5 paginations at a time
    const previousLink = pagination.links[0]; // The first item
    const nextLink = pagination.links[pagination.links.length - 1]; // The last item

    // Get the numeric page links, remove the 'Previous' and 'Next' paginations
    const pageLinks = pagination.links.slice(1, -1);

    // Get the currently active page index
    const currentIndex = pageLinks.findIndex(link => link.active);

    // Calculate the window range
    // currentIndex = 10, windowSize = 5
    // start = 10/5 * 5 === 25
    // end = 25 + 5 === 30
    const start = Math.floor(currentIndex / windowSize) * windowSize;
    const end = start + windowSize;

    // Slice the pages to display the selected range
    // Between 25 and 30
    const visiblePages = pageLinks.slice(start, end);


    return (
        <div className='flex items-center justify-between mt-4'>

            {/* Pagination Information */}
            {search ? (
                <p>Showing <strong>{filteredCount}</strong> {resourceName}{filteredCount !== 1 && 's'} out of <strong>{totalCount}</strong> {resourceName}{totalCount !== 1 && 's'}</p>
            ) : (
                <p>Showing <strong>{pagination.from}</strong> to <strong>{pagination.to}</strong> of <strong>{pagination.total}</strong> {resourceName}{totalCount !== 1 && 's'}</p>
            )}

            <div className='flex items-center gap-2'>
                <span className='text-sm'>Rows per page:</span>

                <Select onValueChange={onPerPageChange} value={perPage}>
                    <SelectTrigger className='w-[90px]'>
                        <SelectValue placeholder='Row' />
                    </SelectTrigger>

                    <SelectContent>
                        {/* <SelectItem value='5'>5</SelectItem> */}
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='25'>25</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                        <SelectItem value='100'>100</SelectItem>
                        <SelectItem value='-1'>All</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='flex gap-2'>
                {/* Previous Button */}
                {previousLink?.url && (
                    <Link
                        href={previousLink.url}
                        className='px-2 py-1 border rounded'
                        dangerouslySetInnerHTML={{ __html: previousLink.label }}
                    />
                )}

                {/* Pagination numbers */}
                {visiblePages.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url || '#'}
                        className={`px-2 py-1 border rounded ${link.active ? 'bg-primary text-white' : ''
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}


                {/* Next Button */}
                {nextLink?.url && (
                    <Link
                        href={nextLink.url}
                        className='px-2 py-1 border rounded'
                        dangerouslySetInnerHTML={{ __html: nextLink.label }}
                    />
                )}
            </div>
        </div>
    )
}