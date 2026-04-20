// components/site-repeater.tsx
import { PlusCircle, Trash2, MapPin, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';

interface Site {
	id?: number;
	site_name: string;
}

interface SiteRepeaterProps {
	sites: Site[];
	setSites: (sites: Site[]) => void;
	errors?: any;
}

export default function SiteRepeater({ sites, setSites, errors }: SiteRepeaterProps) {
	const addSite = () => {
		setSites([...sites, { site_name: '' }]);
	};

	const removeSite = (index: number) => {
		const newSites = sites.filter((_, i) => i !== index);
		setSites(newSites);
	};

	const updateSite = (index: number, value: string) => {
		const newSites = [...sites];
		newSites[index].site_name = value;
		setSites(newSites);
	};

	return (
		<div className="space-y-4">
			{/* Header with Add Button */}
			<div className="flex items-center justify-between sticky top-0 bg-white pt-0 pb-2 z-10">
				<div className="flex items-center gap-2">
					<div className="h-5 w-0.5 bg-[#1d4791]/30 rounded-full"></div>
					<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Locations
					</span>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addSite}
					className="h-8 gap-1.5 border-[#1d4791]/20 text-[#1d4791] hover:bg-[#1d4791]/5 hover:border-[#1d4791]/30 transition-all"
				>
					<PlusCircle className="h-3.5 w-3.5" />
					Add Site
				</Button>
			</div>

			{/* Sites List - Scrollable area with max height */}
			<div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 -mr-2">
				{sites.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 transition-all hover:border-[#1d4791]/30 hover:bg-[#1d4791]/5">
						<div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
							<MapPin className="h-5 w-5 text-slate-400" />
						</div>
						<p className="text-sm font-medium text-slate-600">No sites added yet</p>
						<p className="text-xs text-slate-400 mt-1 text-center">
							Click "Add Site" to start adding locations to this branch
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{sites.map((site, index) => (
							<div
								key={site.id ?? index}
								className="flex gap-2 items-start group animate-in fade-in slide-in-from-top-2 duration-200"
								style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
							>
								<div className="flex-1 relative">
									<MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
									<Input
										type="text"
										value={site.site_name}
										onChange={(e) => updateSite(index, e.target.value)}
										placeholder={`Site ${index + 1} name`}
										className="pl-9 h-10 border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20 transition-all"
										autoFocus={index === sites.length - 1 && site.site_name === ''}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeSite(index)}
									className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Error Display for Sites */}
			{errors?.sites && typeof errors.sites === 'string' && (
				<InputError message={errors.sites} />
			)}

			{/* Helper Text with scroll indicator */}
			{sites.length > 0 && (
				<div className="flex items-center justify-between pt-2 border-t border-slate-100">
					<p className="text-xs text-slate-400 flex items-center gap-1.5">
						<span className="inline-block h-1 w-1 rounded-full bg-[#1d4791]/40"></span>
						{sites.length} site{sites.length !== 1 ? 's' : ''} added
					</p>
					{sites.length > 5 && (
						<p className="text-[10px] text-slate-400 flex items-center gap-1">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300"></span>
							Scroll for more
						</p>
					)}
				</div>
			)}
		</div>
	);
}