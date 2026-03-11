import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================

/**
 * A single field definition — same shape as CustomModalForm so the same
 * config file can be shared between view and form modals if needed.
 */
export interface ViewFieldConfig {
    key: string;          // used to look up the value in `data`
    label: string;        // label shown above the value
    type: 'text'          // plain string
    | 'textarea'      // multi-line text, rendered in a subtle box
    | 'file'          // renders as an <img> preview
    | 'badge'         // renders as a colored Badge
    | 'date'          // formats value as a localized date string
    | 'datetime'      // formats value as a localized date+time string
    | 'currency'      // formats value as PHP currency
    | 'number'        // formats value with commas
    | 'decimal'       // formats value with commas and 2 decimals
    | 'integer'
    | 'boolean';      // renders as "Yes" / "No" badge
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    // Optional: override the displayed value with a custom formatter
    format?: (value: any) => string;
    // Optional: span the full width of the grid (useful for long text / images)
    fullWidth?: boolean;
    // Optional: custom icon to display next to the value
    icon?: ReactNode;
}

export interface CustomModalViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: ViewFieldConfig[];
    // The row object from the table — field.key is used to read values from it
    data: Record<string, any> | null;
    footerActions?: ReactNode;
    // Optional custom icon for the header
    headerIcon?: ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CustomModalView({
    open,
    onOpenChange,
    title,
    description,
    fields,
    data,
    footerActions,
    headerIcon,
}: CustomModalViewProps) {

    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                {/* ── Header with gradient background ─────────────────────────── */}
                <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                    <div className="flex items-center gap-3">
                        {headerIcon ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                {headerIcon}
                            </div>
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-lg font-semibold text-primary">
                                    {title.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                {title}
                            </DialogTitle>
                            {description && (
                                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Body with improved spacing ────────────────────────────── */}
                <div className="p-6">
                    {/* Fields grid with card-like appearance */}
                    <div className="rounded-lg border bg-card p-5">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            {fields.map((field) => (
                                <div
                                    key={field.key}
                                    className={field.fullWidth ? "sm:col-span-2" : ""}
                                >
                                    {/* Label with icon if provided */}
                                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1.5">
                                        {field.icon && (
                                            <span className="text-primary/70">{field.icon}</span>
                                        )}
                                        {field.label}
                                    </dt>

                                    {/* Value with enhanced styling */}
                                    <dd className="relative group">
                                        <div className="rounded-lg bg-muted/30 px-3 py-2.5 border border-border/50 group-hover:border-primary/20 transition-colors">
                                            <FieldValue field={field} data={data} />
                                        </div>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* ── Footer with close button ──────────────────────────────── */}
                <div className="border-t bg-muted/5 p-4 flex justify-end items-center gap-2">
                    {footerActions}
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="min-w-[100px]"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// FIELD VALUE RENDERER
// =============================================================================

/**
 * Renders the right display for each field type.
 * Pure function — no state, no side effects.
 */
function FieldValue({
    field,
    data,
}: {
    field: ViewFieldConfig;
    data: Record<string, any>;
}) {
    const raw = data[field.key];

    // Apply custom formatter if provided
    const display = field.format ? field.format(raw) : raw;

    // ── Empty fallback with improved styling ───────────────────────────────
    if (raw === null || raw === undefined || raw === '') {
        return (
            <span className="text-sm text-muted-foreground/60 italic flex items-center gap-1">
                <span className="text-xs">—</span>
                <span className="text-xs">Not set</span>
            </span>
        );
    }

    switch (field.type) {

        // ── Image / file preview ───────────────────────────────────────────────
        case 'file':
            return (
                <div className="flex justify-center">
                    <img
                        src={String(raw)}
                        alt={field.label}
                        className="h-24 w-24 rounded-xl object-cover border-2 border-border shadow-sm hover:border-primary/30 transition-colors"
                    />
                </div>
            );

        // ── Multi-line text ────────────────────────────────────────────────────
        case 'textarea':
            return (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {String(display)}
                </p>
            );

        // ── Badge ──────────────────────────────────────────────────────────────
        case 'badge':
            return (
                <Badge
                    variant={field.badgeVariant ?? 'secondary'}
                    className="px-3 py-1 text-xs font-medium"
                >
                    {String(display)}
                </Badge>
            );

        // ── Boolean → Yes / No badge with improved styling ────────────────────
        case 'boolean':
            return raw ? (
                <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-0 px-3 py-1"
                >
                    Yes
                </Badge>
            ) : (
                <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-0 px-3 py-1"
                >
                    No
                </Badge>
            );

        // ── Date with improved formatting ──────────────────────────────────────
        case 'date':
            return (
                <span className="text-sm font-medium text-foreground">
                    {new Date(raw).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </span>
            );

        // ── Datetime ───────────────────────────────────────────────────────────
        case 'datetime':
            return (
                <span className="text-sm font-medium text-foreground">
                    {new Date(raw).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })}
                </span>
            );

        // ── Currency ───────────────────────────────────────────────────────────
        case 'currency':
            return (
                <span className="text-sm font-semibold text-foreground">
                    {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        minimumFractionDigits: 2,
                    }).format(Number(raw))}
                </span>
            );

        // ── Number with commas ────────────────────────────────────────────────
        case 'number':
            return (
                <span className="text-sm font-medium text-foreground">
                    {new Intl.NumberFormat('en-US').format(Number(raw))}
                </span>
            );

        // ── Number with commas ────────────────────────────────────────────────
        case 'decimal':
            return (
                <span className="text-sm font-medium text-foreground">
                    {new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(Number(raw))}
                    &nbsp; %
                </span>
            );

        // ── Integer ───────────────────────────────────────────────────────────
        case 'integer':
            return (
                <span className="text-sm font-medium text-foreground">
                    {Number(raw).toLocaleString()}
                </span>
            );

        // ── Default: plain text ────────────────────────────────────────────────
        default:
            return (
                <span className="text-sm font-medium text-foreground">
                    {String(display)}
                </span>
            );
    }
}