import { Head, Link, router, useForm, } from '@inertiajs/react';
import { DropdownMenuContent, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { CirclePlusIcon, Eye, MoreHorizontalIcon, Pencil, Trash } from 'lucide-react';
// import { useRoute } from 'ziggy-js';
import PositionController from "@/actions/App/Http/Controllers/PositionController";
// import { Button } from "@/components/ui/button"
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Position } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/positions',
    },
];

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface PositionPagination {
    data: Position[];
    links: LinkProps[]; // Array of pagination link objects
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    search: string;
    perPage: string;
}

interface IndexProps {
    positions: PositionPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function Index({ positions, filters, totalCount, filteredCount }: IndexProps) {
    // const route = useRoute();

    console.log(positions);

    const { delete: destroy } = useForm();
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this position?")) {
            destroy(PositionController.destroy(id).url);
        }
    }

    // Search form state management using Inertia's useForm hook
    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // Handle search input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        // Update the URL with the search query value
        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        // Pass the search query to the backend to filter products
        router.get(PositionController.index().url, queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clears the search bar and resets the position list
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get(PositionController.index().url), {}, {
            preserveState: true,
            preserveScroll: true,
        };
    }

    // Handle number of products to display per page
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        // Update the URL with the per page value
        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(PositionController.index().url, queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
<<<<<<< HEAD
                <Link 
                    href={PositionController.create()} 
                    className="mb-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-fit"
                >
                    Create Position
                </Link>
                <Table>
                    <TableCaption>A list of your Positions.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Position Name</TableHead>
                            <TableHead>Salary Rate</TableHead>
                            <TableHead>Regular OT Rate</TableHead>
                            <TableHead>Special OT Rate</TableHead>
                            <TableHead>SSS Rate</TableHead>
                            <TableHead>PhilHealth Rate</TableHead>
                            <TableHead>Pag-IBIG Rate</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {positions.map((pos) => (
                            <TableRow key={pos.id}>
                                <TableCell>{pos.pos_name}</TableCell>
                                <TableCell>₱{pos.deduction?.salary_rate || '0.00'}</TableCell>
                                <TableCell>{pos.deduction?.reg_overtime_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.special_overtime_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.sss_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.philhealth_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.pagibig_rate || '0.00'}%</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                      <Link 
                                        href={PositionController.edit(pos.id)}
                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                    >
                                        Edit
                                    </Link>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleDelete(pos.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
=======
                <div className='mx-2'>
                    <div className="flex items-center justify-between gap-4 w-full mb-3">
                        {/* Search Bar */}
                        <Input
                            type="text"
                            value={data.search}
                            onChange={handleChange}
                            placeholder='Search position...'
                            name="search"
                            className='max-w-sm h-10 w-1/3'
                        />

                        <Button onClick={handleReset} className="h-5 w-5 p-5 text-sm cursor-pointer bg-gray-500 hover:bg-gray-400">
                            clear
                        </Button>

                        <div className='ml-auto'>
                            <Link
                                as='button'
                                className='bg-primary hover:bg-primary/90 text-white flex cursor-pointer py-3 px-4 inline-flex align-items-end gap-x-2 text-sm font-medium rounded-lg border border-transparent'
                                href={PositionController.create()}
                            >
                                <CirclePlusIcon />
                                Create Positions
                            </Link>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Position Name</TableHead>
                                <TableHead>Salary Rate</TableHead>
                                <TableHead>Regular OT Rate</TableHead>
                                <TableHead>Special OT Rate</TableHead>
                                <TableHead>SSS Rate</TableHead>
                                <TableHead>PhilHealth Rate</TableHead>
                                <TableHead>Pag-IBIG Rate</TableHead>
                                <TableHead></TableHead>
>>>>>>> 33883b448cde9d0e170bc5456e6b8eb3a344e398
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {positions.data.map((pos) => (
                                <TableRow key={pos.id}>
                                    <TableCell>{pos.pos_name}</TableCell>
                                    <TableCell>₱{pos?.salary_rate || '0.00'}</TableCell>
                                    <TableCell>{pos?.reg_overtime_rate || '0.00'}%</TableCell>
                                    <TableCell>{pos?.special_overtime_rate || '0.00'}%</TableCell>
                                    <TableCell>{pos?.sss_rate || '0.00'}%</TableCell>
                                    <TableCell>{pos?.philhealth_rate || '0.00'}%</TableCell>
                                    <TableCell>{pos?.pagibig_rate || '0.00'}%</TableCell>
                                    <TableCell>
                                        {/* Filter Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <MoreHorizontalIcon className="h-4 w-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 me-3">
                                                <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                    Actions
                                                </DropdownMenuLabel>

                                                <DropdownMenuItem className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors">
                                                    <Eye strokeWidth={1} className="h-4 w-4" />
                                                    <span>View</span>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors">
                                                    <Pencil strokeWidth={1} className="h-4 w-4" />
                                                    <Link href={PositionController.edit(pos.id)}>
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="my-1 border-t border-gray-100" />

                                                <DropdownMenuItem className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors">
                                                    <Trash strokeWidth={1} className="h-4 w-4" />
                                                    <button
                                                        onClick={() => handleDelete(pos.id)}
                                                        className="flex-1 text-left bg-transparent p-0 border-0"
                                                    >
                                                        Delete
                                                    </button>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Pagination
                    pagination={positions}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='position'
                />
            </div>
        </AppLayout>
    );
}
