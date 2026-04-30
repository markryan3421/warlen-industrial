import axios from "axios";
import {
    UploadCloud, CheckCircle, AlertCircle,
    Loader2, FileSpreadsheet, X,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { router } from "@inertiajs/react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
//
// ImportError is intentionally loose — the backend returns different shapes
// depending on which sheet failed:
//   Att.log / Exception Stat: { sheet, employee_id, date, error }
//   Att. Stat / Schedule:     { sheet, employee, error }
// We union them all into one flexible type so nothing crashes.
// ─────────────────────────────────────────────────────────────────────────────
interface ImportError {
    sheet?: string;
    employee_id?: string;
    employee?: string;
    date?: string;
    error: string;
}

interface ImportResult {
    message?: string;
    imported: number;
    skipped: number;
    errors?: ImportError[];   // optional — guard everywhere with ?? []
}

interface BiometricImportProps {
    onSuccess?: () => void;  // Callback for successful import
    refreshRoute?: string;    // Route to refresh after import
    refreshOnly?: string[];   // Specific data to refresh (for Inertia only)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BiometricImport({ 
    onSuccess, 
    refreshRoute,
    refreshOnly = ['payrolls', 'pagination', 'filters', 'totalCount', 'filteredCount']
}: BiometricImportProps = {}) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Refresh function ──────────────────────────────────────────────────────
    const refreshData = () => {
        // If a custom refresh route is provided, use it
        if (refreshRoute) {
            router.visit(refreshRoute, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: refreshOnly,
            });
        } 
        // Otherwise, reload the current page
        else {
            router.reload({
                preserveState: true,
                preserveScroll: true,
                only: refreshOnly,
            });
        }
    };

    // ── File validation & selection ──────────────────────────────────────────
    const handleFile = (f: File) => {
        const byMime = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(f.type);
        const byExt = /\.xlsx?$/i.test(f.name);

        if (!byMime && !byExt) {
            setError("Only .xls or .xlsx files are accepted.");
            return;
        }
        setFile(f);
        setResult(null);
        setError(null);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    // ── Drag & drop ──────────────────────────────────────────────────────────
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    // ── Upload ───────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const { data } = await axios.post<ImportResult>(
                "/attendance/import",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            // Normalise the response — ensure errors is always an array
            setResult({
                ...data,
                imported: data.imported ?? 0,
                skipped: data.skipped ?? 0,
                errors: data.errors ?? [],
            });

            // Auto-refresh after successful import (with a small delay to ensure the import is complete)
            if (data.imported > 0) {
                setTimeout(() => {
                    refreshData();
                    // Call the onSuccess callback if provided
                    if (onSuccess) onSuccess();
                }, 1500); // 1.5 second delay to show success message
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.error ??
                "Upload failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    // ── Manual refresh handler ───────────────────────────────────────────────
    const handleManualRefresh = () => {
        refreshData();
        // Optional: Show a toast or notification
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    // Safely get the errors array — never undefined after normalisation,
    // but the ?? [] guard here keeps TypeScript and runtime both happy.
    const errors = result?.errors ?? [];

    // Build a readable label for each error row regardless of which sheet it came from
    const errorLabel = (e: ImportError): string => {
        const who = e.employee_id ?? e.employee ?? "Unknown";
        const when = e.date ?? "";
        const src = e.sheet ? `[${e.sheet}] ` : "";
        return `${src}Employee ${who}${when ? ` · ${when}` : ""} — ${e.error}`;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-md space-y-4 p-4">

            {/* ── Drop zone ─────────────────────────────────────────────────────── */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={[
                    "relative flex cursor-pointer flex-col items-center justify-center gap-3",
                    "rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                    // Loading state
                    loading
                        ? "border-blue-400 bg-blue-100 dark:border-blue-400 dark:bg-blue-950/50"
                        : file && !dragging
                            ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                            : dragging
                                ? "border-blue-300 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                                : "border-stone-200 bg-stone-50 hover:border-blue-300 hover:bg-blue-50/50 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-orange-600",
                ].join(" ")}
            >
                <Input
                    ref={inputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={onInputChange}
                    disabled={loading}
                />

                {loading ? (
                    // Loading animation
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
                            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                Processing file...
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                Please wait while we import your data
                            </p>
                        </div>
                    </div>
                ) : file ? (
                    <>
                        <FileSpreadsheet className="h-10 w-10 text-blue-600" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                                {file.name}
                            </p>
                            <p className="text-xs text-stone-400">
                                {(file.size / 1024).toFixed(1)} KB · Ready to import
                            </p>
                        </div>
                        <Button
                            onClick={(e) => { e.stopPropagation(); reset(); }}
                            className="absolute right-3 top-3 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:cursor-pointer hover:text-stone-600 dark:hover:bg-stone-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <UploadCloud
                            className={`h-10 w-10 transition-colors ${dragging ? "text-orange-400" : "text-stone-400 dark:text-stone-600"
                                }`}
                        />
                        <div className="text-center">
                            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                                Drop your{" "}
                                <span className="font-bold text-blue-800 dark:text-blue-400">.xls</span>{" "}
                                file here
                            </p>
                            <p className="text-xs text-stone-400">or click to browse</p>
                        </div>
                    </>
                )}
            </div>  

            {/* ── Validation / network error ─────────────────────────────────────── */}
            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Import button ─────────────────────────────────────────────────── */}
            <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-blue-800 text-white/90 hover:bg-blue-700 hover:cursor-pointer hover:text-white active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-150"
            >
                {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                    : <><UploadCloud className="h-4 w-4" /> Import Attendance</>}
            </button>

            {/* ── Result summary ────────────────────────────────────────────────── */}
            {result && (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">

                    {/* Header with refresh button */}
                    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <span className="font-semibold text-stone-800 dark:text-stone-100">
                                Import Complete
                            </span>
                        </div>
                        <button
                            onClick={handleManualRefresh}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                        >
                            <Loader2 className="h-3 w-3" />
                            Refresh Data
                        </button>
                    </div>

                    {/* Stats — all three values are now guaranteed to be numbers */}
                    <div className="grid grid-cols-3 divide-x divide-stone-100 dark:divide-stone-800">
                        {[
                            { label: "Imported", value: result.imported, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Skipped", value: result.skipped, color: "text-amber-600 dark:text-amber-400" },
                            { label: "Errors", value: errors.length, color: "text-red-600 dark:text-red-400" },
                        ].map((stat) => (
                            <div key={stat.label} className="flex flex-col items-center py-4">
                                <span className={`text-2xl font-extrabold ${stat.color}`}>
                                    {stat.value}
                                </span>
                                <span className="text-xs text-stone-400">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Auto-refresh message */}
                    {result.imported > 0 && (
                        <div className="border-t border-stone-100 px-5 py-3 dark:border-stone-800">
                            <p className="text-xs text-center text-stone-500 dark:text-stone-400">
                                Data will refresh automatically in a moment...
                            </p>
                        </div>
                    )}

                    {/* Error list — only shown if there are errors */}
                    {errors.length > 0 && (
                        <div className="border-t border-stone-100 px-5 py-3 dark:border-stone-800">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                                Failed rows
                            </p>
                            <ul className="space-y-1 max-h-40 overflow-y-auto">
                                {errors.map((e, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                        <span>{errorLabel(e)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}