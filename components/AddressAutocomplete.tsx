'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@/lib/googleMaps';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, location: { lat: number; lng: number }) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

export default function AddressAutocomplete({
    value,
    onChange,
    placeholder = 'Enter address',
    icon,
    className = '',
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                await loadGoogleMapsScript();

                if (!inputRef.current) return;

                // Initialize autocomplete
                autocompleteRef.current = new google.maps.places.Autocomplete(
                    inputRef.current,
                    {
                        componentRestrictions: { country: 'tz' }, // Tanzania only
                        fields: ['formatted_address', 'geometry', 'name'],
                        types: ['address', 'establishment'],
                    }
                );

                // Listen for place selection
                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current?.getPlace();

                    if (place && place.geometry && place.geometry.location) {
                        const address = place.formatted_address || place.name || '';
                        const location = {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                        };

                        onChange(address, location);
                    }
                });

                setLoading(false);
            } catch (error) {
                console.error('Failed to initialize autocomplete:', error);
                setLoading(false);
            }
        };

        initAutocomplete();

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onChange]);

    return (
        <div className={`relative ${className}`}>
            <div className="input-bebax flex items-center">
                {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 mr-2 animate-spin" />
                ) : (
                    icon || <MapPin className="w-5 h-5 text-bebax-green mr-2" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value, { lat: 0, lng: 0 })}
                    placeholder={placeholder}
                    className="flex-1 outline-none bg-transparent"
                    disabled={loading}
                />
            </div>
        </div>
    );
}
