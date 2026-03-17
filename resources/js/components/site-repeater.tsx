// components/site-repeater.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputError from '@/components/input-error';
import { Plus, X } from "lucide-react";

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
        const updatedSites = sites.filter((_, i) => i !== index);
        setSites(updatedSites);
    };

    const updateSite = (index: number, value: string) => {
        const updatedSites = [...sites];
        updatedSites[index] = {
            ...updatedSites[index],
            site_name: value
        };
        setSites(updatedSites);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Sites</label>
                <Button
                    type="button"
                    onClick={addSite}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-xs">Add Site</span>
                </Button>
            </div>

            {/* Only show border when there are sites */}
            {sites.length > 0 && (
                <div className="overflow-hidden">
                    {/* Scrollable container for sites with fixed height */}
                    <div className=" border-1 py-1 px-2 rounded-lg h-[99px] overflow-y-auto scrollbar-thin ">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sites.map((site, index) => (
                                <div key={index} className="flex gap-2 items-start group">
                                    <div className="flex-1 min-w-0"> {/* min-w-0 to allow truncation */}
                                        <Input
                                            type="text"
                                            value={site.site_name}
                                            onChange={(e) => updateSite(index, e.target.value)}
                                            placeholder={`Site ${index + 1} name`}
                                            className="placeholder:text-xs truncate"
                                        />
                                        {errors?.[`sites.${index}.site_name`] && (
                                            <div className="overflow-hidden">
                                                <InputError message={errors[`sites.${index}.site_name`]} />
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => removeSite(index)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 mt-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {sites.length === 0 && (
                <div className="flex flex-col items-center justify-center py-7 px-4 text-center border-2 border-dashed rounded-lg bg-muted/5 overflow-hidden">
                    <p className="text-sm text-muted-foreground mb-1">No sites added yet</p>
                    <p className="text-xs text-muted-foreground">Click "Add Site" to start adding sites to this branch</p>
                </div>
            )}
        </div>
    );
}