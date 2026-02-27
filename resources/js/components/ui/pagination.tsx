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

<<<<<<< HEAD
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
=======
type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">
>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)

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

<<<<<<< HEAD
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
=======
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
}
>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)
