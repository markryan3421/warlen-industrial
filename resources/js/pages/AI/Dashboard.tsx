// pages/AI/Dashboard.tsx
import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw,
    DollarSign, Users, Clock, Sparkles, Calendar, BarChart3,
    Zap, Search, X, ChevronDown, ChevronUp, Filter,
    SlidersHorizontal, ArrowUpDown, CheckCircle2, Circle,
    ArrowLeft,
} from 'lucide-react';
import { PageSkeleton } from '@/components/skeletons/page-skeleton';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Insights',
        href: '/ai/dashboard',
    },
];

/* ─────────────────────────────────────────────────────────────
   Keyframes — injected once
   ───────────────────────────────────────────────────────────── */
const KF = `
@keyframes dashFadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes dashScaleIn   { from{opacity:0;transform:scale(0.97)}      to{opacity:1;transform:scale(1)}      }
@keyframes spinSlow      { from{transform:rotate(0deg)}               to{transform:rotate(360deg)}          }
@keyframes collapseOpen  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
`;
if (typeof document !== 'undefined' && !document.getElementById('dash-kf')) {
    const s = document.createElement('style'); s.id = 'dash-kf'; s.textContent = KF;
    document.head.appendChild(s);
}

const fadeUp  = (d = 0): React.CSSProperties => ({ animation: `dashFadeUp 0.4s ease both`,   animationDelay: `${d}ms` });
const scaleIn = (d = 0): React.CSSProperties => ({ animation: `dashScaleIn 0.35s ease both`, animationDelay: `${d}ms` });

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */
interface Insight {
    id?: number;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    analyzed_at?: string;
    metadata?: Record<string, unknown>;
}

interface AIDashboardProps {
    storedInsights: { payroll: Insight[]; attendance: Insight[]; anomalies: Insight[] };
    latestSummary: string;
    lastAnalyzed: string;
}

type ImpactFilter = 'all' | 'high' | 'medium' | 'low';
type SortKey      = 'default' | 'impact_asc' | 'impact_desc' | 'date_desc' | 'date_asc';

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const PAGE_SIZE = 20;

/* ─────────────────────────────────────────────────────────────
   Brand helpers
   ───────────────────────────────────────────────────────────── */
const impactCard = (i: string) => ({
    high:   'bg-[#d85e39]/5 border-[#d85e39]/22 text-[#d85e39]',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    low:    'bg-emerald-50 border-emerald-200 text-emerald-700',
}[i] ?? 'bg-slate-50 border-slate-200 text-slate-600');

const impactBadge = (i: string) => ({
    high:   'bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/30',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low:    'bg-emerald-100 text-emerald-700 border-emerald-300',
}[i] ?? 'bg-slate-100 text-slate-600 border-slate-300');

const ImpactIcon = ({ impact, cls = 'h-3.5 w-3.5' }: { impact: string; cls?: string }) => (
    impact === 'high'   ? <AlertTriangle className={cls} /> :
    impact === 'medium' ? <Clock className={cls} /> :
    <Zap className={cls} />
);

/* ─────────────────────────────────────────────────────────────
   useInsightFilter — filter + sort + paginate hook
   ───────────────────────────────────────────────────────────── */
function useInsightFilter(items: Insight[]) {
    const [search,      setSearch]      = useState('');
    const [impact,      setImpact]      = useState<ImpactFilter>('all');
    const [actionable,  setActionable]  = useState(false);
    const [sort,        setSort]        = useState<SortKey>('default');
    const [page,        setPage]        = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { setPage(1); }, [search, impact, actionable, sort]);

    const filtered = useMemo(() => {
        let r = [...(items ?? [])];
        if (search)          r = r.filter(x => x.title.toLowerCase().includes(search.toLowerCase()) || x.description.toLowerCase().includes(search.toLowerCase()));
        if (impact !== 'all') r = r.filter(x => x.impact === impact);
        if (actionable)       r = r.filter(x => x.actionable);
        switch (sort) {
            case 'impact_asc':  r.sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]); break;
            case 'impact_desc': r.sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact]); break;
            case 'date_desc':   r.sort((a, b) => new Date(b.analyzed_at ?? 0).getTime() - new Date(a.analyzed_at ?? 0).getTime()); break;
            case 'date_asc':    r.sort((a, b) => new Date(a.analyzed_at ?? 0).getTime() - new Date(b.analyzed_at ?? 0).getTime()); break;
        }
        return r;
    }, [items, search, impact, actionable, sort]);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters  = search !== '' || impact !== 'all' || actionable;
    const clearFilters = () => { setSearch(''); setImpact('all'); setActionable(false); setSort('default'); };

    return { search, setSearch, impact, setImpact, actionable, setActionable,
             sort, setSort, page, setPage, totalPages, paged, filtered,
             showFilters, setShowFilters, hasFilters, clearFilters };
}

/* ─────────────────────────────────────────────────────────────
   NavyCardHeader — matches CustomTable / FormSection pattern
   ───────────────────────────────────────────────────────────── */
function NavyCardHeader({ icon, title, count, action }: {
    icon: React.ReactNode; title: string; count?: number; action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-3 bg-[#1d4791] rounded-t-xl">
            <div className="flex items-center gap-2 text-white min-w-0">
                <span className="opacity-75 flex-shrink-0">{icon}</span>
                <span className="text-xs font-semibold tracking-widest uppercase truncate">{title}</span>
                {count !== undefined && count > 0 && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                        {count.toLocaleString()}
                    </span>
                )}
            </div>
            {action && <div className="flex-shrink-0 ml-3">{action}</div>}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FilterToolbar — corrected (no AppLayout/Head)
   ───────────────────────────────────────────────────────────── */
function FilterToolbar({ state, onGenerate, generating }: {
    state: ReturnType<typeof useInsightFilter>;
    onGenerate: () => void;
    generating: boolean;
}) {
    const { search, setSearch, impact, setImpact, actionable, setActionable,
            sort, setSort, showFilters, setShowFilters, hasFilters, clearFilters, filtered } = state;

    return (
        <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 space-y-2.5">
            {/* Row 1 */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search insights…"
                        className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4791]/25 focus:border-[#1d4791]/50 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all flex-shrink-0 ${
                        showFilters || hasFilters
                            ? 'bg-[#1d4791] text-white border-[#1d4791]'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-[#1d4791]/40 hover:text-[#1d4791]'
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#d85e39]" />}
                </button>

                <button
                    onClick={onGenerate} disabled={generating}
                    className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:text-[#1d4791] hover:border-[#1d4791]/40 transition-all disabled:opacity-50 flex-shrink-0"
                >
                    <RefreshCw className="h-3.5 w-3.5" style={generating ? { animation: 'spinSlow 1s linear infinite' } : {}} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>

                {hasFilters && (
                    <button onClick={clearFilters} className="h-8 px-2.5 flex items-center gap-1 rounded-lg text-xs font-medium text-[#d85e39] border border-[#d85e39]/30 bg-[#d85e39]/5 hover:bg-[#d85e39]/10 transition-colors flex-shrink-0">
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                )}
            </div>

            {/* Row 2: expanded filters */}
            {showFilters && (
                <div style={{ animation: 'collapseOpen 0.2s ease both' }} className="flex flex-wrap items-center gap-2">
                    {/* Impact pills */}
                    <div className="flex items-center gap-1">
                        {(['all', 'high', 'medium', 'low'] as ImpactFilter[]).map(v => (
                            <button key={v} onClick={() => setImpact(v)}
                                className={`h-6 px-2.5 rounded-full text-[11px] font-semibold transition-all border ${
                                    impact === v
                                        ? v === 'high'   ? 'bg-[#d85e39] text-white border-[#d85e39]'
                                        : v === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                                        : v === 'low'    ? 'bg-emerald-600 text-white border-emerald-600'
                                        :                  'bg-[#1d4791] text-white border-[#1d4791]'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-slate-200" />

                    {/* Actionable toggle */}
                    <button onClick={() => setActionable(!actionable)}
                        className={`h-6 px-2.5 flex items-center gap-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                            actionable ? 'bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {actionable ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        Actionable only
                    </button>

                    <div className="h-4 w-px bg-slate-200" />

                    {/* Sort */}
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                            className="h-6 pl-2 pr-6 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1d4791]/30 appearance-none cursor-pointer">
                            <option value="default">Default order</option>
                            <option value="impact_asc">Impact: High → Low</option>
                            <option value="impact_desc">Impact: Low → High</option>
                            <option value="date_desc">Newest first</option>
                            <option value="date_asc">Oldest first</option>
                        </select>
                    </div>

                    <span className="ml-auto text-[11px] text-slate-400 font-medium">
                        {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   PaginationBar
   ───────────────────────────────────────────────────────────── */
function PaginationBar({ page, total, count, filteredCount, onChange }: {
    page: number; total: number; count: number; filteredCount: number; onChange: (p: number) => void;
}) {
    if (total <= 1 && filteredCount === count) return null;

    const pages: (number | '…')[] = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
        if (page < total - 2) pages.push('…');
        pages.push(total);
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, filteredCount);

    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400">
                Showing {from.toLocaleString()}–{to.toLocaleString()} of {filteredCount.toLocaleString()}
                {filteredCount < count && <span className="text-slate-300"> (filtered from {count.toLocaleString()})</span>}
            </span>
            {total > 1 && (
                <div className="flex items-center gap-1">
                    <button onClick={() => onChange(page - 1)} disabled={page === 1}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 hover:border-[#1d4791]/40 hover:text-[#1d4791] transition-colors">
                        <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    {pages.map((p, i) =>
                        p === '…'
                            ? <span key={`e${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-slate-400">…</span>
                            : <button key={p} onClick={() => onChange(p as number)}
                                className={`h-7 min-w-[1.75rem] px-1 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border ${
                                    p === page ? 'bg-[#1d4791] text-white border-[#1d4791] shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-[#1d4791]/40 hover:text-[#1d4791]'
                                }`}>{p}</button>
                    )}
                    <button onClick={() => onChange(page + 1)} disabled={page === total}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 hover:border-[#1d4791]/40 hover:text-[#1d4791] transition-colors">
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   InsightCard — collapses description in dense lists
   ───────────────────────────────────────────────────────────── */
function InsightCard({ insight, collapsible = false }: { insight: Insight; collapsible?: boolean }) {
    const [expanded, setExpanded] = useState(!collapsible);

    return (
        <div className={`rounded-lg border px-4 py-3 transition-all duration-150 hover:shadow-sm ${impactCard(insight.impact)}`}>
            <div className="flex items-start gap-2.5">
                <ImpactIcon impact={insight.impact} cls="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-80" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 text-xs leading-snug">{insight.title}</h3>
                            {insight.actionable && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[#1d4791]/10 text-[#1d4791] border border-[#1d4791]/20">
                                    <Sparkles className="h-2 w-2" /> Action
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border ${impactBadge(insight.impact)}`}>
                                {insight.impact}
                            </span>
                            {collapsible && (
                                <button onClick={() => setExpanded(!expanded)}
                                    className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors">
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {expanded && (
                        <div style={collapsible ? { animation: 'collapseOpen 0.18s ease both' } : {}}>
                            <p className="text-slate-600 text-xs leading-relaxed mt-1">{insight.description}</p>
                            {insight.analyzed_at && (
                                <p className="text-[10px] text-slate-400 mt-1.5">Generated: {new Date(insight.analyzed_at).toLocaleString()}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   AnomalyCard
   ───────────────────────────────────────────────────────────── */
function AnomalyCard({ anomaly, collapsible = false }: { anomaly: Insight; collapsible?: boolean }) {
    const [expanded, setExpanded] = useState(!collapsible);

    return (
        <div className="rounded-lg border border-[#d85e39]/22 bg-[#d85e39]/5 px-4 py-3 transition-all duration-150 hover:shadow-sm">
            <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-[#d85e39] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-xs leading-snug flex-1">{anomaly.title}</h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/30">
                                {anomaly.impact?.toUpperCase() || 'MED'}
                            </span>
                            {collapsible && (
                                <button onClick={() => setExpanded(!expanded)}
                                    className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors">
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {expanded && (
                        <div style={collapsible ? { animation: 'collapseOpen 0.18s ease both' } : {}}>
                            <p className="text-slate-600 text-xs leading-relaxed mt-1">{anomaly.description}</p>
                            {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                    {Object.entries(anomaly.metadata).map(([k, v]) => (
                                        <span key={k} className="text-[10px] text-[#d85e39]/80 font-medium">{k}: {String(v)}</span>
                                    ))}
                                </div>
                            )}
                            {anomaly.analyzed_at && (
                                <p className="text-[10px] text-slate-400 mt-1.5">Detected: {new Date(anomaly.analyzed_at).toLocaleString()}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────────────────────── */
function EmptyState({ type, onGenerate, isFiltered = false }: {
    type: string; onGenerate: () => void; isFiltered?: boolean;
}) {
    return (
        <div className="text-center py-10">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                {isFiltered ? <Filter className="h-5 w-5 text-slate-300" /> : <Lightbulb className="h-5 w-5 text-slate-300" />}
            </div>
            <p className="text-slate-400 text-xs mb-3">
                {isFiltered ? 'No results match your filters.' : `No ${type} insights yet.`}
            </p>
            {!isFiltered && (
                <button onClick={onGenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#1d4791]/30 text-[#1d4791] bg-[#1d4791]/5 hover:bg-[#1d4791]/10 transition-colors">
                    <Sparkles className="h-3 w-3" /> Generate {type} insights
                </button>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   InsightListPanel — filterable + paginated card wrapper
   ───────────────────────────────────────────────────────────── */
function InsightListPanel({ items, title, icon, type, onGenerate, generating, isAnomaly = false }: {
    items: Insight[]; title: string; icon: React.ReactNode;
    type: string; onGenerate: () => void; generating: boolean; isAnomaly?: boolean;
}) {
    const f = useInsightFilter(items);
    const collapsible = items.length > 15;

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <NavyCardHeader icon={icon} title={title} count={items.length}
                action={
                    f.hasFilters ? (
                        <span className="text-[10px] font-bold bg-[#d85e39] text-white px-1.5 py-0.5 rounded-full">
                            {f.filtered.length}
                        </span>
                    ) : undefined
                }
            />

            {items.length > 0 && (
                <FilterToolbar state={f} onGenerate={onGenerate} generating={generating} />
            )}

            <div>
                {items.length === 0 ? (
                    <div className="p-4"><EmptyState type={type} onGenerate={onGenerate} /></div>
                ) : f.paged.length === 0 ? (
                    <div className="p-4"><EmptyState type={type} onGenerate={onGenerate} isFiltered /></div>
                ) : (
                    <div className="p-3 space-y-2">
                        {f.paged.map((item, idx) =>
                            isAnomaly
                                ? <AnomalyCard key={item.id ?? idx} anomaly={item} collapsible={collapsible} />
                                : <InsightCard key={item.id ?? idx} insight={item} collapsible={collapsible} />
                        )}
                    </div>
                )}
            </div>

            <PaginationBar
                page={f.page} total={f.totalPages}
                count={items.length} filteredCount={f.filtered.length}
                onChange={f.setPage}
            />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   StatCard
   ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, sub, delay = 0 }: {
    label: string; value: string | number; icon: React.ReactNode; sub?: string; delay?: number;
}) {
    return (
        <div style={fadeUp(delay)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-[#1d4791]" />
            <div className="px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#1d4791]/8 flex items-center justify-center text-[#1d4791]">
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ImpactBreakdownBar — visual distribution strip
   ───────────────────────────────────────────────────────────── */
function ImpactBreakdownBar({ items, label }: { items: Insight[]; label: string }) {
    if (!items.length) return null;
    const high   = items.filter(x => x.impact === 'high').length;
    const medium = items.filter(x => x.impact === 'medium').length;
    const low    = items.filter(x => x.impact === 'low').length;
    const total  = items.length;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>{label}</span><span>{total.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex gap-px bg-slate-100">
                {high   > 0 && <div className="bg-[#d85e39] rounded-l-full" style={{ width: `${(high/total)*100}%` }} />}
                {medium > 0 && <div className="bg-amber-400"               style={{ width: `${(medium/total)*100}%` }} />}
                {low    > 0 && <div className="bg-emerald-500 rounded-r-full" style={{ width: `${(low/total)*100}%` }} />}
            </div>
            <div className="flex gap-3 text-[10px] font-semibold">
                {high   > 0 && <span className="text-[#d85e39]">{high} high</span>}
                {medium > 0 && <span className="text-amber-600">{medium} med</span>}
                {low    > 0 && <span className="text-emerald-600">{low} low</span>}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   OverviewPreviewCard — top-N preview sorted by impact
   ───────────────────────────────────────────────────────────── */
function OverviewPreviewCard({ items, title, icon, type, onGenerate, generating, onViewAll, isAnomaly = false, previewCount = 5 }: {
    items: Insight[]; title: string; icon: React.ReactNode;
    type: string; onGenerate: () => void; generating: boolean;
    onViewAll: () => void; isAnomaly?: boolean; previewCount?: number;
}) {
    const preview = useMemo(() =>
        [...(items ?? [])].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]).slice(0, previewCount),
        [items, previewCount]
    );
    const highCount   = items.filter(x => x.impact === 'high').length;
    const actionCount = items.filter(x => x.actionable).length;

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col">
            <NavyCardHeader icon={icon} title={title} count={items.length}
                action={
                    <button onClick={onGenerate} disabled={generating}
                        className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-40">
                        <RefreshCw className="h-3 w-3" style={generating ? { animation: 'spinSlow 1s linear infinite' } : {}} />
                    </button>
                }
            />

            {items.length > 0 && (
                <div className="px-4 py-2 flex items-center gap-3 border-b border-slate-100 bg-slate-50/60">
                    {highCount   > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold text-[#d85e39]"><AlertTriangle className="h-3 w-3" />{highCount} high</span>}
                    {actionCount > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1d4791]"><Sparkles className="h-3 w-3" />{actionCount} actionable</span>}
                    <span className="ml-auto text-[10px] text-slate-400">{items.length.toLocaleString()} total</span>
                </div>
            )}

            <div className="flex-1 p-3 space-y-2">
                {items.length === 0
                    ? <EmptyState type={type} onGenerate={onGenerate} />
                    : preview.map((item, idx) =>
                        isAnomaly
                            ? <AnomalyCard key={item.id ?? idx} anomaly={item} />
                            : <InsightCard key={item.id ?? idx} insight={item} />
                    )
                }
            </div>

            {items.length > previewCount && (
                <button onClick={onViewAll}
                    className="px-4 py-2.5 border-t border-slate-100 text-xs font-semibold text-[#1d4791] bg-slate-50/60 hover:bg-[#1d4791]/5 transition-colors text-center">
                    View all {items.length.toLocaleString()} {title.toLowerCase()} →
                </button>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Dashboard — correctly wrapped with AppLayout
   ───────────────────────────────────────────────────────────── */
export default function AIDashboard({
    storedInsights: initialInsights,
    latestSummary,
    lastAnalyzed,
}: AIDashboardProps) {
    const [insights]         = useState(initialInsights);
    const [executiveSummary] = useState(latestSummary);
    const [loading]          = useState(false);
    const [generating, setGenerating] = useState(false);
    const [activeTab,  setActiveTab]  = useState('overview');

    const generateFreshInsights = async (type = 'all') => {
        setGenerating(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res  = await fetch('/ai/generate-insights', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf || '',
                },
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (data.success) { toast.success('Insights generated!'); window.location.reload(); }
            else toast.error(data.message || 'Failed to generate insights');
        } catch {
            toast.error('Failed to generate insights. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <PageSkeleton />;

    const allInsights   = [...(insights.attendance ?? []), ...(insights.payroll ?? []), ...(insights.anomalies ?? [])];
    const totalInsights = allInsights.length;
    const highPriority  = allInsights.filter(x => x.impact === 'high').length;
    const actionable    = [...(insights.attendance ?? []), ...(insights.payroll ?? [])].filter(x => x.actionable).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Insights Dashboard" />
            <div className="min-h-screen bg-slate-50/60">
                {/* ── Navy Hero ── */}
                <div style={scaleIn(0)} className="bg-[#1d4791] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 14px)' }} />
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div style={fadeUp(60)}>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
                                        <Brain className="h-4 w-4 text-white" />
                                    </div>
                                    <h1 className="text-lg font-bold text-white tracking-tight">AI Insights Dashboard</h1>
                                    <span className="hidden sm:inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/15 text-white/70 border border-white/15">
                                        Advanced Analytics
                                    </span>
                                </div>
                                <p className="text-white/55 text-xs max-w-lg">
                                    Data-driven recommendations to optimise workforce, reduce costs, and improve productivity.
                                </p>
                                <div className="flex items-center flex-wrap gap-4 mt-2">
                                    {lastAnalyzed && (
                                        <span className="flex items-center gap-1 text-white/45 text-[11px]">
                                            <Calendar className="h-3 w-3" />
                                            Last analysed: {new Date(lastAnalyzed).toLocaleDateString()}
                                        </span>
                                    )}
                                    {totalInsights > 0 && (
                                        <div className="flex items-center gap-3 text-[11px]">
                                            {highPriority > 0 && (
                                                <span className="flex items-center gap-1 font-semibold text-[#f5a48a]">
                                                    <AlertTriangle className="h-3 w-3" />{highPriority} high priority
                                                </span>
                                            )}
                                            {actionable > 0 && (
                                                <span className="flex items-center gap-1 font-medium text-white/60">
                                                    <Sparkles className="h-3 w-3" />{actionable} actionable
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={fadeUp(140)}>
                                <button
                                    onClick={() => generateFreshInsights('all')} disabled={generating}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#1d4791] text-xs font-bold shadow-lg hover:bg-slate-50 transition-colors disabled:opacity-60">
                                    <Sparkles className="h-3.5 w-3.5" style={generating ? { animation: 'spinSlow 1s linear infinite' } : {}} />
                                    {generating ? 'Generating…' : 'Generate All'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-5">
                    {/* Back button - using Inertia Link */}
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-[#1d4791] hover:text-[#1d4791]/90">
                        <ArrowLeft className="h-3 w-3" />
                        Back
                    </Link>

                    {/* Stat tiles */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard delay={40}  label="Total Insights" value={totalInsights}                   icon={<Lightbulb className="h-5 w-5" />} sub={highPriority > 0 ? `${highPriority} high priority` : undefined} />
                        <StatCard delay={70}  label="Payroll"        value={insights.payroll?.length ?? 0}   icon={<DollarSign className="h-5 w-5" />} />
                        <StatCard delay={100} label="Attendance"     value={insights.attendance?.length ?? 0} icon={<Users className="h-5 w-5" />} />
                        <StatCard delay={130} label="Anomalies"      value={insights.anomalies?.length ?? 0}  icon={<AlertTriangle className="h-5 w-5" />}
                            sub={insights.anomalies?.filter(x => x.impact === 'high').length
                                ? `${insights.anomalies.filter(x => x.impact === 'high').length} critical`
                                : undefined}
                        />
                    </div>

                    {/* Impact distribution */}
                    {totalInsights > 0 && (
                        <div style={fadeUp(160)} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">Impact Distribution</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <ImpactBreakdownBar items={insights.payroll ?? []}    label="Payroll" />
                                <ImpactBreakdownBar items={insights.attendance ?? []} label="Attendance" />
                                <ImpactBreakdownBar items={insights.anomalies ?? []}  label="Anomalies" />
                            </div>
                        </div>
                    )}

                    {/* Executive summary */}
                    {executiveSummary && executiveSummary !== 'No summary available' && (
                        <div style={fadeUp(200)} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                            <NavyCardHeader icon={<Sparkles className="h-4 w-4" />} title="Executive Summary" />
                            <div className="px-5 py-4">
                                <p className="text-slate-700 leading-relaxed text-sm">{executiveSummary}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div style={fadeUp(240)}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                            <TabsList className="h-9 bg-white border border-slate-200 rounded-lg shadow-sm p-1 gap-0.5 w-full sm:w-auto sm:inline-flex">
                                {[
                                    { value: 'overview',   icon: <BarChart3 className="h-3.5 w-3.5" />,    label: 'Overview' },
                                    { value: 'payroll',    icon: <DollarSign className="h-3.5 w-3.5" />,   label: 'Payroll',    count: insights.payroll?.length },
                                    { value: 'attendance', icon: <Users className="h-3.5 w-3.5" />,         label: 'Attendance', count: insights.attendance?.length },
                                    { value: 'anomalies',  icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Anomalies',  count: insights.anomalies?.length },
                                ].map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}
                                        className="flex-1 sm:flex-none h-7 px-3 text-xs font-semibold gap-1.5 tracking-wide rounded-md
                                                   data-[state=active]:bg-[#1d4791] data-[state=active]:text-white data-[state=active]:shadow-sm
                                                   text-slate-500 hover:text-slate-700 transition-all">
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                        {(tab.count ?? 0) > 0 && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>{tab.count}</span>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* OVERVIEW */}
                            <TabsContent value="overview" className="space-y-4 mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <OverviewPreviewCard
                                        items={insights.payroll ?? []} title="Payroll Insights"
                                        icon={<DollarSign className="h-4 w-4" />} type="payroll"
                                        onGenerate={() => generateFreshInsights('payroll')} generating={generating}
                                        onViewAll={() => setActiveTab('payroll')}
                                    />
                                    <OverviewPreviewCard
                                        items={insights.attendance ?? []} title="Attendance Insights"
                                        icon={<Users className="h-4 w-4" />} type="attendance"
                                        onGenerate={() => generateFreshInsights('attendance')} generating={generating}
                                        onViewAll={() => setActiveTab('attendance')}
                                    />
                                </div>
                                <OverviewPreviewCard
                                    items={insights.anomalies ?? []} title="Recent Anomalies"
                                    icon={<AlertTriangle className="h-4 w-4" />} type="anomalies"
                                    onGenerate={() => generateFreshInsights('anomalies')} generating={generating}
                                    onViewAll={() => setActiveTab('anomalies')} isAnomaly previewCount={6}
                                />
                            </TabsContent>

                            {/* PAYROLL */}
                            <TabsContent value="payroll" className="mt-0">
                                <InsightListPanel
                                    items={insights.payroll ?? []} title="Payroll Insights"
                                    icon={<DollarSign className="h-4 w-4" />} type="payroll"
                                    onGenerate={() => generateFreshInsights('payroll')} generating={generating}
                                />
                            </TabsContent>

                            {/* ATTENDANCE */}
                            <TabsContent value="attendance" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Avg Attendance', value: '70.19%' },
                                        { label: 'Avg Late Min',   value: '26.23'  },
                                        { label: 'Absent Days',    value: '54'     },
                                        { label: 'Analysed',       value: '35'     },
                                    ].map((s, i) => (
                                        <div key={s.label} style={fadeUp(i * 40)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="h-0.5 bg-[#1d4791]/25" />
                                            <div className="px-4 py-3">
                                                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{s.label}</p>
                                                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {insights.attendance?.filter(i => i.title?.includes('Department')).length > 0 && (
                                    <InsightListPanel
                                        items={insights.attendance.filter(i => i.title?.includes('Department'))}
                                        title="Department Rankings" icon={<TrendingUp className="h-4 w-4" />} type="attendance"
                                        onGenerate={() => generateFreshInsights('attendance')} generating={generating}
                                    />
                                )}
                                {insights.attendance?.filter(i => i.title?.includes('Monthly Trend')).length > 0 && (
                                    <InsightListPanel
                                        items={insights.attendance.filter(i => i.title?.includes('Monthly Trend'))}
                                        title="Monthly Trends" icon={<BarChart3 className="h-4 w-4" />} type="attendance"
                                        onGenerate={() => generateFreshInsights('attendance')} generating={generating}
                                    />
                                )}
                                <InsightListPanel
                                    items={insights.attendance?.filter(i => !i.title?.includes('Department') && !i.title?.includes('Monthly Trend')) ?? []}
                                    title="All Attendance Insights" icon={<Users className="h-4 w-4" />} type="attendance"
                                    onGenerate={() => generateFreshInsights('attendance')} generating={generating}
                                />
                            </TabsContent>

                            {/* ANOMALIES */}
                            <TabsContent value="anomalies" className="mt-0">
                                <InsightListPanel
                                    items={insights.anomalies ?? []} title="Anomalies"
                                    icon={<AlertTriangle className="h-4 w-4" />} type="anomalies"
                                    onGenerate={() => generateFreshInsights('anomalies')} generating={generating}
                                    isAnomaly
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}