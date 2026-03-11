import { Link, usePage } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronRight, Slash } from 'lucide-react'; // Import icons
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { UserInfo } from '@/components/user-info';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    
    return (
        <div className="flex justify-end items-center grid grid-cols-2">   
            <div className="">
                {breadcrumbs.length > 0 && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <Fragment key={index}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="truncate">
                                                    {item.title}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={item.href} className="truncate">
                                                        {item.title}
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && (
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-4 w-4" /> {/* Custom icon */}
                                            </BreadcrumbSeparator>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
        </div>
    );
}