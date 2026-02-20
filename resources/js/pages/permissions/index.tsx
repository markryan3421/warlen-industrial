import { Head, router, useForm } from '@inertiajs/react';
import React from 'react';
import { useRoute } from 'ziggy-js';
import { CustomModalForm } from '@/components/custom-modal-form';
import { CustomTable } from '@/components/custom-table';
import { PermissionModalFormConfig } from '@/config/forms/permission-modal-form';
import { PermissionsTableConfig } from '@/config/tables/permissions-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
// import { CustomToast, toast } from '@/components/custom-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Permissions',
        href: '/permissions',
    },
];

// Define the Product interface, representing the structure of a product object
// This helps with type-checking and autocompletion in TypeScript
interface Permission {
    id: number;
    name: string;
    description: string;
    price: number;
    featured_image: string;
    featured_image_original_name: string;
    created_at: string;
}

// Define the LinkProps interface for pagination links
interface LinkProps {
    // From 'links' array
    active: boolean;
    label: string;
    url: string | null;
}

// Define the CategoryPagination interface for paginated product data
interface PermissionPagination {
    // This are the list of arrays inside the 'products' object
    data: Permission[]; // Array of Product objects
    links: LinkProps[]; // Array of pagination link objects
    from: number;
    to: number;
    total: number;
}

// Define the FilterProps interface for search filters
interface FilterProps {
    search: string;
    perPage: string;
}

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

// Define the props for the Index component
// Get the 'products' and 'filters' in the form of object array - compacted from the controller
interface IndexProps {
    permissions: PermissionPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function Index({ permissions }: IndexProps) {
    // Get the route function from ziggy-js to generate URLs
    const route = useRoute();

    // This will display flash message from the backend (success/error)
    // const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    // const flashMessage = flash?.success || flash?.error;
    const [modalOpen, setModalOpen] = React.useState(false);
    const [mode, setMode] = React.useState<'create' | 'view' | 'edit'>('create');
    const [selectedCategory, setSelectedCategory] = React.useState<any>(null);

    const { data, setData, errors, processing, reset, post, put } = useForm({
        module: '',
        label: '',
        description: '',
        // _method: 'POST',
    });

    const handleDelete = (route: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(route, {
                preserveScroll: true,
                onSuccess: (response: { props: FlashProps }) => {
                    const successMessage = response.props.flash?.success || 'Category deleted successfully.'
                    toast.success(successMessage);
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    const errorMessage = error?.message || 'Failed to delete category.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // console.log('Form data:', data);

        if (mode === 'edit' && selectedCategory) {
            // setData('_method', 'PUT');

            put(route('permissions.update', selectedCategory.id), {
                forceFormData: true,
                onSuccess: (response: { props: FlashProps }) => {
                    const successMessage = response.props.flash?.success
                    if (successMessage) {
                        toast.success(successMessage);
                    }
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    const errorMessage = error?.message;
                    if (errorMessage) {
                        toast.error(errorMessage);
                    }
                }
            })
        } else {
            post(route('permissions.store'), {
                onSuccess: (response: { props: FlashProps }) => {
                    const successMessage = response.props.flash?.success
                    if (successMessage) {
                        toast.success(successMessage);
                    }
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    const errorMessage = error?.message;
                    if (errorMessage) {
                        toast.error(errorMessage);
                    }
                }
            })
        }
    };

    // Will trigger after submitting the data
    const closeModal = () => {
        // Reset the input fields, remove the values
        reset();
        setMode('create');
        setSelectedCategory(null);
        setModalOpen(false);
    };

    // Will either close or open the modal
    const handleModalToggle = (open: boolean) => {
        setModalOpen(open);
        if (!open) {
            setMode('create');
            setSelectedCategory(null);
            reset();
        }
    };

    // Modal for creating/viewing/editing category
    const openModal = (mode: 'create' | 'view' | 'edit', category?: any) => {
        setMode(mode);

        if (category) {
            Object.entries(category).forEach(([key, value]) => {
                if (key !== 'image' && value !== null) {
                    // Set
                    setData(key as keyof typeof data, value as string);
                }
            });

            setSelectedCategory(category);
        }
        // console.log('Data', data);
        setModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Category Management" />
            {/* <CustomToast /> */}
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Custom Modal Form */}
                <div className="ml-auto">
                    <CustomModalForm
                        addButton={PermissionModalFormConfig.addButton}
                        title={mode === 'view' ? 'View Permission' : (mode === 'edit' ? 'Update Permission' : PermissionModalFormConfig.title)}
                        description={PermissionModalFormConfig.description}
                        fields={PermissionModalFormConfig.fields}
                        buttons={PermissionModalFormConfig.buttons}
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        handleSubmit={handleSubmit}
                        open={modalOpen}
                        onOpenChange={handleModalToggle}
                        mode={mode}
                    />
                </div>

                <CustomTable
                    columns={PermissionsTableConfig.columns}
                    actions={PermissionsTableConfig.actions}
                    data={permissions.data}
                    from={permissions.from}
                    onDelete={handleDelete}
                    onView={(category) => openModal('view', category)}
                    onEdit={(category) => openModal('edit', category)}
                    isModal={true}
                />
            </div>
        </AppLayout>
    );
}