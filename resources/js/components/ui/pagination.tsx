<<<<<<< HEAD
import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, type Button } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
=======
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
>>>>>>> 33883b448cde9d0e170bc5456e6b8eb3a344e398
}
