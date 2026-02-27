import { Link, usePage } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { UserInfo } from '@/components/user-info';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    
    return (
    <div className = "flex justify-end items-center grid grid-cols-2">   
        <div className = "">
            {breadcrumbs.length > 0 && (
                <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <BreadcrumbItem key={index}>
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
                    );
                    })}
                </BreadcrumbList>
                </Breadcrumb>
            )}
            </div>
        </div>
    );
}
