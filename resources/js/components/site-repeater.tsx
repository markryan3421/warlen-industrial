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
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Site
                </Button>
            </div>

            {sites.map((site, index) => (
                <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                        <Input
                            type="text"
                            value={site.site_name}
                            onChange={(e) => updateSite(index, e.target.value)}
                            placeholder={`Site ${index + 1} name`}
                        />
                        {errors?.[`sites.${index}.site_name`] && (
                            <InputError message={errors[`sites.${index}.site_name`]} />
                        )}
                    </div>
                    <Button
                        type="button"
                        onClick={() => removeSite(index)}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}

            {sites.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No sites added yet. Click "Add Site" to create one.
                </p>
            )}
        </div>
    );
}