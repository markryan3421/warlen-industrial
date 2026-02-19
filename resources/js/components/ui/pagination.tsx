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
    // console.log('Per page:', perPage);
    // console.log(totalCount, filteredCount, search);
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
                        <SelectItem value='5'>5</SelectItem>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='25'>25</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                        <SelectItem value='100'>100</SelectItem>
                        <SelectItem value='-1'>All</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='flex gap-2'>
                {pagination.links.map((link, index) => (
                    <Link
                        className={`px-2 py-1 border rounded ${link.active ? 'bg-primary text-white' : ''}`}
                        href={link.url || '#'}
                        key={index}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    )
}
