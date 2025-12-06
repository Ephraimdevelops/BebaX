"use client";

import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { MapPin, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SmartAddressInput({
    value,
    onChange,
    placeholder = "Search address...",
    className,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);

    const {
        ready,
        value: inputValue,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: "tz" }, // Restrict to Tanzania
        },
        debounce: 300, // Debounce is Mandatory: 300ms
        defaultValue: value,
    });

    const handleSelect = async (address) => {
        setValue(address, false);
        clearSuggestions();
        setOpen(false);

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onChange(address, { lat, lng });
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("relative cursor-pointer group", className)}>
                    <div className="flex items-center h-14 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 transition-all group-hover:border-gray-200 focus-within:border-[#FF5722] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-orange-500/10">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 shrink-0 group-focus-within:text-[#FF5722] transition-colors" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setValue(e.target.value);
                                if (!open) setOpen(true);
                            }}
                            disabled={!ready || disabled}
                            placeholder={placeholder}
                            className="flex-1 outline-none bg-transparent truncate text-lg placeholder:text-gray-400 text-gray-900 font-medium"
                            onClick={() => setOpen(true)}
                        />
                        {!ready && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        {inputValue && ready && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setValue("", false);
                                    clearSuggestions();
                                    onChange("", { lat: 0, lng: 0 });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[300px] sm:w-[400px] z-[9999]"
                align="start"
                sideOffset={5}
            >
                <Command className="z-[9999]">
                    <CommandList>
                        {status === "OK" &&
                            data.map(({ place_id, description }) => (
                                <CommandItem
                                    key={place_id}
                                    value={description}
                                    onSelect={handleSelect}
                                    className="cursor-pointer min-h-[48px] flex items-center py-3 px-4 aria-selected:bg-orange-50" // Touch Targets: 48px minimum
                                >
                                    <MapPin className="mr-3 h-5 w-5 text-gray-400 shrink-0" />
                                    <span className="text-base text-gray-700">{description}</span>
                                    {value === description && (
                                        <Check className="ml-auto h-5 w-5 text-bebax-green" />
                                    )}
                                </CommandItem>
                            ))}
                        {status === "ZERO_RESULTS" && (
                            <div className="p-4 text-sm text-gray-500 text-center py-6">No results found.</div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
