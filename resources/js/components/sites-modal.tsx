// components/sites-modal.tsx
import { MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BranchWithSites } from '@/types';

interface SitesModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: BranchWithSites | null;
}

export function SitesModal({ isOpen, onClose, branch }: SitesModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                Sites under <span className="text-primary">{branch?.branch_name || 'Branch'}</span>
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                Manage and view all sites associated with this branch
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {branch?.sites && branch.sites.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">Total Sites:</span>
                                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                                        {branch.sites.length}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-card">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-full py-3 font-semibold">Site Name</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branch.sites.map((site) => (
                                            <TableRow
                                                key={site.id}
                                                className="group hover:bg-muted/50 transition-colors cursor-default"
                                            >
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                            <MapPin className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                            {site.site_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                                    <MapPin className="h-8 w-8 text-primary/60" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No sites found
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                                This branch doesn't have any sites assigned yet. Sites will appear here once added.
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t bg-muted/5 p-4 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="min-w-[100px]"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}