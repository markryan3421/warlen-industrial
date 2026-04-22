// components/incentive-employee-selector.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, Users, CheckCircle2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
Keyframes
───────────────────────────────────────────────────────────── */
const KF = `
@keyframes incFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes incScaleIn { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
`;
if (typeof document !== 'undefined' && !document.getElementById('inc-selector-kf')) {
  const s = document.createElement('style');
  s.id = 'inc-selector-kf';
  s.textContent = KF;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
Types
───────────────────────────────────────────────────────────── */
interface Employee {
  id: number;
  emp_code?: string | number | null;
  user?: { name: string } | null;
  name?: string;
}
interface IncentiveEmployeeSelectorProps {
  employees: Employee[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSelectAll: (ids: number[]) => void; // Fixed: passes full updated array
  onRemoveAll: () => void;
  error?: string;
}

/* ─────────────────────────────────────────────────────────────
Utilities & Sub-components
───────────────────────────────────────────────────────────── */
function nameToHsl(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase() || '??';
  // Uniform slate color for all users
  return { bg: '#f1f5f9', fg: '#475569', initials };
}

function MiniAvatar({ name }: { name: string }) {
  const { bg, fg, initials } = nameToHsl(name);
  return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 select-none shadow-sm" style={{ backgroundColor: bg, color: fg }}>
      {initials}
    </div>
  );
}

function getName(emp: Employee) {
  return emp.user?.name || emp.name || 'Unnamed Employee';
}

/* ─────────────────────────────────────────────────────────────
Main Component
───────────────────────────────────────────────────────────── */
export function IncentiveEmployeeSelector({ employees, selectedIds, onToggle, onSelectAll, onRemoveAll, error }: IncentiveEmployeeSelectorProps) {
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-expand on first selection
  const prevCount = useRef(selectedIds.length);
  useEffect(() => {
    if (selectedIds.length > 0 && prevCount.current === 0) setExpanded(true);
    prevCount.current = selectedIds.length;
  }, [selectedIds.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(emp => {
      const n = getName(emp).toLowerCase();
      const c = String(emp.emp_code ?? '').toLowerCase();
      return n.includes(q) || c.includes(q);
    });
  }, [employees, search]);

  const selectedList = useMemo(() => employees.filter(e => selectedIds.includes(e.id)), [employees, selectedIds]);
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id));

  // Fixed: Single state update instead of loop
  const handleToggleAll = useCallback(() => {
    if (allFilteredSelected) {
      const removeIds = new Set(filtered.map(e => e.id));
      const next = selectedIds.filter(id => !removeIds.has(id));
      onSelectAll(next);
    } else {
      const next = [...new Set([...selectedIds, ...filtered.map(e => e.id)])];
      onSelectAll(next);
    }
  }, [filtered, selectedIds, allFilteredSelected, onSelectAll]);

  return (
    <div className="space-y-3">
      {/* ── Section Trigger Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-500">Assigned Employees</span>
          {selectedIds.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#1d4791] text-white text-[10px] font-bold shadow-sm">
              {selectedIds.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setExpanded(prev => !prev); if (!expanded) setTimeout(() => searchRef.current?.focus(), 60); }}
          className={`h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
            expanded ? 'bg-[#1d4791] text-white border-[#1d4791] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1d4791]/40 hover:text-[#1d4791]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          {expanded ? 'Collapse' : 'Manage'}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* ── Collapsed Preview ── */}
      {!expanded && selectedList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60" style={{ animation: 'incFadeUp 0.25s ease both' }}>
          {selectedList.slice(0, 6).map(emp => (
            <span key={emp.id} className="inline-flex items-center gap-1.5 h-7 pl-1 pr-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
              <MiniAvatar name={getName(emp)} />
              {getName(emp)}
              <button type="button" onClick={() => onToggle(emp.id)} className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-[#d85e39] transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedList.length > 6 && (
            <button type="button" onClick={() => setExpanded(true)} className="inline-flex items-center h-7 px-2.5 rounded-full bg-[#1d4791]/8 text-[#1d4791] text-xs font-semibold border border-[#1d4791]/20 hover:bg-[#1d4791]/15 transition-colors">
              +{selectedList.length - 6} more
            </button>
          )}
        </div>
      )}
      {!expanded && selectedList.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 text-slate-400">
          <Users className="h-4 w-4 opacity-60" />
          <span className="text-xs">No employees assigned yet. Click <b>Manage</b> to select.</span>
        </div>
      )}

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white" style={{ animation: 'incScaleIn 0.3s ease both' }}>
          
          {/* Toolbar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${employees.length} employees…`}
                className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4791]/20 focus:border-[#1d4791] transition-all"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleToggleAll} className={`h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
                allFilteredSelected ? 'bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/25' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1d4791]/40 hover:text-[#1d4791]'
              }`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {allFilteredSelected ? 'Deselect All' : `Select All (${filtered.length})`}
              </button>
              {selectedIds.length > 0 && (
                <button type="button" onClick={onRemoveAll} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-[#d85e39]/30 bg-[#d85e39]/5 text-[#d85e39] text-xs font-semibold hover:bg-[#d85e39]/10 transition-colors">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Grid: Available vs Selected */}
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
            
            {/* Left: Available List (3/5) */}
            <div className="md:col-span-3 flex flex-col min-h-[280px] max-h-[340px]">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  {search ? `${filtered.length} matching` : `${employees.length} total`}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent p-1">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <Search className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No employees match "{search}"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {filtered.map(emp => {
                      const checked = selectedIds.includes(emp.id);
                      const name = getName(emp);
                      return (
                        <button key={emp.id} type="button" onClick={() => onToggle(emp.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg hover:bg-slate-50 ${checked ? 'bg-[#1d4791]/4 hover:bg-[#1d4791]/6' : ''}`}>
                          <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-[#1d4791] border-[#1d4791] shadow-sm' : 'border-slate-300 bg-white'}`}>
                            {checked && <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <MiniAvatar name={name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                            {emp.emp_code && <p className="text-[10px] text-slate-400 font-mono">#{emp.emp_code}</p>}
                          </div>
                          {checked && <UserCheck className="h-3.5 w-3.5 text-[#1d4791] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Assigned List (2/5) */}
            <div className="md:col-span-2 flex flex-col min-h-[280px] max-h-[340px] bg-slate-50/30">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/60">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Selected</span>
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#1d4791] text-white text-[10px] font-bold shadow-sm">
                  {selectedIds.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent p-1">
                {selectedList.length === 0 ? (
                  <div className="py-12 text-center px-4">
                    <Users className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-400">Drag or click to assign employees here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedList.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2.5 px-3 py-2.5 group hover:bg-white transition-colors rounded-lg">
                        <MiniAvatar name={getName(emp)} />
                        <span className="flex-1 min-w-0 text-xs font-medium text-slate-700 truncate">{getName(emp)}</span>
                        <button type="button" onClick={() => onToggle(emp.id)}
                          className="h-5 w-5 flex items-center justify-center rounded-full text-slate-300 group-hover:text-[#d85e39] group-hover:bg-[#d85e39]/10 transition-all">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[#d85e39] flex items-center gap-1.5 mt-1"><span className="h-3.5 w-3.5">⚠</span>{error}</p>}
    </div>
  );
}