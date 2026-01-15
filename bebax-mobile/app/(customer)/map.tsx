import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, ScrollView, Image, Keyboard, Modal, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { customMapStyle } from '../../src/constants/mapStyle';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
const { width, height } = Dimensions.get('window');

import { VEHICLE_FLEET } from '../../src/constants/vehicleRegistry';
import { SmartCargoSelector, MissionMode, CargoReference, HouseSize } from '../../src/components/SmartCargoSelector';
import * as ImagePicker from 'expo-image-picker';
import { REFERENCE_OBJECTS, HOUSE_SIZES } from '../../src/constants/CargoReferences';
import {
    calculateFare,
    getZeroStatePricing,
    formatTZS,
    estimateETA,
    GeoPoint,
    calculateHaversineDistance,
    calculateLockedFare,
    RouteResult,
} from '../../src/utils/pricingUtils';
import { getRouteData } from '../../src/utils/routeService';
import { VehicleId } from '../../src/constants/vehicleRegistry';

// === HELPER COMPONENTS ===

interface VehicleCardProps {
    type: VehicleId;
    label: string;
    imageSource: any;
    selected: boolean;
    onSelect: () => void;
    // Smart Pricing Props
    hasDestination: boolean;
    pickup?: GeoPoint | null;
    dropoff?: GeoPoint | null;
    pickupEta?: string; // New Prop for Real Driver ETA
    routeData?: RouteResult | null; // NEW: Safe Lock Data
}

const VehicleCard = ({
    type,
    label,
    imageSource,
    selected,
    onSelect,
    hasDestination,
    pickup,
    dropoff,
    pickupEta,
    routeData,
}: VehicleCardProps) => {
    // Calculate pricing using Bongo Engine
    // If routeData exists, use Locked Fare. Else use Estimated Fare.
    const lockedFare = routeData ? calculateLockedFare(type, routeData) : null;
    const estFare = (hasDestination && pickup && dropoff) ? calculateFare(type, pickup, dropoff) : null;

    const fareResult = lockedFare || estFare;
    const isLocked = !!lockedFare;

    const zeroState = getZeroStatePricing(type);

    const displayLabel = isLocked ? 'Price Locked' : (fareResult ? 'Est. Total' : zeroState.displayLabel);
    const displayPrice = fareResult ? fareResult.displayPrice : zeroState.displayPrice;

    // Use Real Driver ETA if available, otherwise fallback to Trip Duration or 5 min
    // If we have a destination, fareResult.metrics.estimatedMinutes is TRIP DURATION
    // pickupEta is DRIVER ARRIVAL TIME. We should show Pickup ETA on the badge.
    const badgeEta = pickupEta || (fareResult ? `${fareResult.metrics.estimatedMinutes} min` : '5 min');

    return (
        <TouchableOpacity
            style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
            onPress={onSelect}
            activeOpacity={0.9}
        >
            {/* ETA Badge */}
            <View style={[styles.etaBadge, selected && styles.etaBadgeSelected]}>
                <Text style={[styles.etaText, selected && styles.etaTextSelected]}>{badgeEta}</Text>
            </View>

            <Image source={imageSource} style={styles.vehicleImage} resizeMode="contain" />

            <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>{label}</Text>

                {/* Smart Pricing Display */}
                <Text style={[
                    styles.vehiclePriceLabel,
                    hasDestination && styles.vehiclePriceLabelActive,
                    isLocked && { color: '#16A34A', fontWeight: '700' } // Green for Locked
                ]}>
                    {displayLabel} {isLocked && '🔒'}
                </Text>
                <Text style={[
                    styles.vehiclePrice,
                    selected && styles.vehiclePriceSelected,
                    hasDestination && styles.vehiclePriceActive
                ]}>
                    {displayPrice}
                </Text>
            </View>
        </TouchableOpacity>
    );
};


// === PHONE CAPTURE MODAL ===
interface PhoneModalProps {
    visible: boolean;
    onSubmit: (phone: string) => void;
    onClose: () => void;
}

const PhoneModal = ({ visible, onSubmit, onClose }: PhoneModalProps) => {
    const [phone, setPhone] = useState('');
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Phone Number Required</Text>
                    <Text style={styles.modalSubtitle}>We need your phone to contact you about your ride</Text>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="+255 XXX XXX XXX"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <TouchableOpacity
                        style={[styles.modalButton, !phone && styles.modalButtonDisabled]}
                        onPress={() => onSubmit(phone)}
                        disabled={!phone}
                    >
                        <Text style={styles.modalButtonText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// === MAIN LANDING PAGE ===

export default function Dashboard() {
    // ... (Hooks remain same)
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const insets = useSafeAreaInsets();

    // Refs
    const pickupRef = useRef<GooglePlacesAutocompleteRef>(null);
    const dropoffRef = useRef<GooglePlacesAutocompleteRef>(null);

    // State
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Live Drivers
    const nearbyDrivers = useQuery(api.rides.getNearbyDrivers,
        location ? { lat: location.coords.latitude, lng: location.coords.longitude, radiusKm: 10 } : "skip"
    );

    // ... (UI state remains same)
    const [mode, setMode] = useState<'default' | 'search-focus' | 'finding'>('default');
    const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('dropoff');

    // Booking State
    const [vehicleType, setVehicleType] = useState<string>('boda');
    const [itemsDescription, setItemsDescription] = useState('');

    // Smart Cargo & Visual Truth State
    const [missionMode, setMissionMode] = useState<MissionMode>('item');
    const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
    const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
    const [cargoPhoto, setCargoPhoto] = useState<string | null>(null);

    // Safe Lock Pricing State
    const [routeData, setRouteData] = useState<RouteResult | null>(null);
    const [isRouting, setIsRouting] = useState(false);

    // --- EFFECT: Fetch Route for Safe Lock Pricing ---
    useEffect(() => {
        const fetchRoute = async () => {
            if (pickup && dropoff) {
                setIsRouting(true);
                const data = await getRouteData(
                    { lat: pickup.lat, lng: pickup.lng },
                    { lat: dropoff.lat, lng: dropoff.lng }
                );
                if (data) setRouteData(data);
                setIsRouting(false);
            } else {
                setRouteData(null);
            }
        };

        const timer = setTimeout(fetchRoute, 500); // Debounce 500ms
        return () => clearTimeout(timer);
    }, [pickup, dropoff]);

    // Legacy mapping support for vehicle filtering
    const [allowedVehicles, setAllowedVehicles] = useState<string[]>(['boda', 'toyo', 'kirikuu', 'canter', 'fuso']);

    const [helpersCount, setHelpersCount] = useState(0);
    const [maxHelpers, setMaxHelpers] = useState(0);
    const [isFragile, setIsFragile] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [isBooking, setIsBooking] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    // Bongo Pricing: destination check for VehicleCard
    const hasDestination = !!dropoff;

    // Pickup/Dropoff as GeoPoint for pricing
    const pickupPoint: GeoPoint | null = pickup ? { lat: pickup.lat, lng: pickup.lng } : null;
    const dropoffPoint: GeoPoint | null = dropoff ? { lat: dropoff.lat, lng: dropoff.lng } : null;

    // ... (Visual Truth Logic & Handlers remain same)
    // 1. Handle Item Reference Selection
    const handleRefSelect = (ref: CargoReference) => {
        setSelectedRefId(ref.id);
        setVehicleType(ref.vehicle_class);
        setSelectedHouseId(null);
        const allTypes = ['boda', 'toyo', 'kirikuu', 'canter', 'fuso'];
        const startIndex = allTypes.indexOf(ref.vehicle_class);
        setAllowedVehicles(startIndex >= 0 ? allTypes.slice(startIndex) : allTypes);

        if (ref.vehicle_class === 'boda') {
            setMaxHelpers(0);
            setHelpersCount(0);
        } else {
            setMaxHelpers(2);
        }
    };

    // 2. Handle House Size Selection
    const handleHouseSelect = (house: HouseSize) => {
        setSelectedHouseId(house.id);
        setVehicleType(house.vehicle_class);
        setHelpersCount(house.helpers);
        setMaxHelpers(house.helpers + 2);
        setSelectedRefId(null);
        const allTypes = ['boda', 'toyo', 'kirikuu', 'canter', 'fuso'];
        const startIndex = allTypes.indexOf(house.vehicle_class);
        setAllowedVehicles(startIndex >= 0 ? allTypes.slice(startIndex) : allTypes);
    };

    // 3. Handle Photo Capture
    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to verify cargo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setCargoPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const isBookingValid = () => {
        if (missionMode === 'item' && selectedRefId) {
            const ref = REFERENCE_OBJECTS.find(r => r.id === selectedRefId);
            if (ref?.photo_required && !cargoPhoto) return false;
        }
        return true;
    };

    const pulseAnim = useRef(new Animated.Value(1)).current;

    const createRide = useMutation(api.rides.create);
    const userProfile = useQuery(api.users.getCurrentProfile, isSignedIn ? {} : "skip");
    const updateProfile = useMutation(api.users.updateProfile);

    // Initial Location & Simulator Safety
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({});

                // SIMULATOR SAFETY CHECK
                // If coordinates are near Apple HQ (37.7, -122.4), force Dar es Salaam
                // This prevents server-side "Distance Too Far" errors during dev
                if (loc.coords.latitude > 37 && loc.coords.latitude < 38 && loc.coords.longitude < -122) {
                    console.log("📍 Simulator Position Detected (Cupertino/SF). Overriding to Dar es Salaam.");

                    // Override object
                    loc = {
                        ...loc,
                        coords: {
                            ...loc.coords,
                            latitude: -6.7924,
                            longitude: 39.2083,
                        }
                    };
                }

                setLocation(loc);
                setPickup({
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude,
                    address: "Current Location"
                });
                mapRef.current?.animateToRegion({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 1000);
            }
        })();
    }, []);

    // Pulse animation for finding mode
    useEffect(() => {
        if (mode === 'finding') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [mode]);

    // HANDLERS
    const handleBookRide = async () => {
        // 1. Force Login if Guest
        if (!isSignedIn) {
            router.push('/(auth)/sign-in');
            return;
        }

        // 2. Check phone number (Heal missing phone from Clerk)
        if (!userProfile?.phone) {
            // Check if Clerk has it (Phone Auth users)
            const clerkPhone = user?.primaryPhoneNumber?.phoneNumber;

            if (clerkPhone) {
                // Silently update profile and proceed
                await updateProfile({ phone: clerkPhone });
                // Proceed... (Optimistic)
            } else {
                // genuinely no phone (Social Auth) -> Ask user
                setShowPhoneModal(true);
                return;
            }
        }

        // 3. Validate inputs
        if (!pickup || !dropoff) {
            Alert.alert("Where to?", "Please select a dropoff location.");
            setActiveField('dropoff');
            setMode('search-focus');
            return;
        }
        if (missionMode === 'item' && !selectedRefId) {
            Alert.alert("Cargo?", "Please select what you're sending.");
            return;
        }
        if (missionMode === 'move' && !selectedHouseId) {
            Alert.alert("House Size?", "Please select the size of your move.");
            return;
        }
        if (!isBookingValid()) {
            handleTakePhoto();
            return;
        }

        // 4. Create Ride
        setIsBooking(true);
        setMode('finding');

        try {
            const rideId = await createRide({
                pickup_location: { ...pickup, address: pickup.address },
                dropoff_location: { ...dropoff, address: dropoff.address },
                vehicle_type: vehicleType as any, // TS Cast for strict union
                cargo_details: itemsDescription || (missionMode === 'move' ? 'House Move' : 'Cargo Delivery'),
                // Safe Lock Pricing
                locked_price: routeData ? calculateLockedFare(vehicleType as any, routeData).total : undefined,
                pricing_snapshot: routeData ? JSON.stringify(routeData) : undefined,
                // Visual Truth Fields

                // Visual Truth & Mission Split
                mission_mode: missionMode,
                cargo_ref_id: selectedRefId || undefined,
                house_size_id: selectedHouseId || undefined,
                cargo_photo_url: cargoPhoto || undefined,
                cargo_size: 'medium', // Legacy fallback
                is_fragile: isFragile,
                helpers_count: helpersCount,
                payment_method: paymentMethod,
            });// Simulate finding delay
            setTimeout(() => {
                setMode('default');
                Alert.alert("🎉 Ride Confirmed!", "Driver is on the way!");
                router.push('/(customer)/ride-status');
            }, 3000);

        } catch (err) {
            console.error(err);
            setMode('default');
            Alert.alert("Error", "Could not book ride.");
        } finally {
            setIsBooking(false);
        }
    };

    const handlePhoneSubmit = async (phone: string) => {
        if (userProfile?._id) {
            await updateProfile({ phone });
            setShowPhoneModal(false);
            handleBookRide(); // Retry booking
        }
    };

    const openSearch = (field: 'pickup' | 'dropoff') => {
        setActiveField(field);
        setMode('search-focus');
    };

    const closeSearch = () => {
        setMode('default');
        Keyboard.dismiss();
    };

    const handleAddressSelect = (data: any, details: any) => {
        const point = {
            lat: details?.geometry?.location.lat || 0,
            lng: details?.geometry?.location.lng || 0,
            address: data.description
        };
        if (activeField === 'pickup') {
            setPickup(point);
            if (!dropoff) setActiveField('dropoff');
            else closeSearch();
        } else {
            setDropoff(point);
            closeSearch();
        }
    };

    // Loading State
    if (!isLoaded) return <View style={styles.loadingScreen}><ActivityIndicator color={Colors.primary} size="large" /></View>;

    // --- REAL DRIVER ETA LOGIC ---
    const getDriverEta = (vehicleType: string) => {
        if (!nearbyDrivers || !location?.coords) return '5-10 min';

        const drivers = nearbyDrivers.filter((d: any) => d.vehicle_type === vehicleType);

        if (drivers.length === 0) return '15+ min'; // No drivers nearby

        // Find closest driver
        let minKm = 1000;
        drivers.forEach((d: any) => {
            if (d.location) {
                const dist = calculateHaversineDistance(
                    { lat: location.coords.latitude, lng: location.coords.longitude },
                    { lat: d.location.lat, lng: d.location.lng }
                );
                if (dist < minKm) minKm = dist;
            }
        });

        if (minKm === 1000) return '15+ min';

        // Estimate time: 2 mins per km (City Traffic) + 2 mins base
        const mins = Math.ceil(minKm * 2.5) + 2;
        return `${mins} min`;
    };

    return (
        <View style={styles.container}>
            {/* 1. MAP BACKGROUND */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                initialRegion={{
                    latitude: -6.7924,
                    longitude: 39.2083,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={Colors.primary} />}
                {dropoff && <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} pinColor="black" />}
                {nearbyDrivers?.map((d: any) => (
                    <Marker key={d._id} coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}>
                        <Image source={require('../../assets/images/car.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                    </Marker>
                ))}
            </MapView>

            {/* 2. HEADER */}
            {mode === 'default' && (
                <View style={[styles.headerFloating, { top: insets.top + 10 }]}>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => isSignedIn ? router.push('/(customer)/profile') : router.push('/(auth)/sign-in')}
                    >
                        <View style={styles.avatarCircle}>
                            {isSignedIn ? (
                                <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || userProfile?.name?.charAt(0) || "U"}</Text>
                            ) : (
                                <Ionicons name="person" size={20} color="#64748B" />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        {isSignedIn && (
                            <TouchableOpacity
                                style={styles.notificationButton}
                                onPress={() => router.push('/(customer)/notifications')}
                            >
                                <Ionicons name="notifications-outline" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        )}
                        {!isSignedIn && (
                            <TouchableOpacity style={styles.loginPill} onPress={() => router.push('/(auth)/sign-in')}>
                                <Text style={styles.loginText}>Log in</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* 3. FLOATING SEARCH ("Where to?") */}
            {mode === 'default' && (
                <View style={[styles.floatingSearchContainer, { top: insets.top + 70 }]}>
                    <View style={styles.routeCard}>
                        {/* Pickup */}
                        <TouchableOpacity style={styles.routeRow} onPress={() => openSearch('pickup')}>
                            <View style={styles.dotLine}><View style={styles.dot} /><View style={styles.line} /></View>
                            <Text style={styles.routeText} numberOfLines={1}>{pickup?.address || "Current Location"}</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        {/* Dropoff */}
                        <TouchableOpacity style={styles.routeRow} onPress={() => openSearch('dropoff')}>
                            <View style={styles.dotLine}><View style={styles.square} /></View>
                            <Text style={[styles.routeText, !dropoff && { color: '#94A3B8' }]} numberOfLines={1}>
                                {dropoff?.address || "Where to?"}
                            </Text>
                            <View style={styles.nowBadge}>
                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                <Text style={styles.nowText}>Now</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 4. FULL SCREEN SEARCH MODAL */}
            {mode === 'search-focus' && (
                <View style={[styles.focusSearchContainer, { paddingTop: insets.top }]}>
                    <View style={styles.focusHeader}>
                        <TouchableOpacity onPress={closeSearch} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.focusTitle}>{activeField === 'pickup' ? "Set Pickup" : "Set Dropoff"}</Text>
                    </View>
                    <GooglePlacesAutocomplete
                        ref={activeField === 'pickup' ? pickupRef : dropoffRef}
                        placeholder={activeField === 'pickup' ? "Enter pickup location" : "Where are you going?"}
                        onPress={handleAddressSelect}
                        query={{ key: GOOGLE_API_KEY, language: 'en', components: 'country:tz' }}
                        fetchDetails={true}
                        enablePoweredByContainer={false}
                        styles={{
                            container: { flex: 0, paddingHorizontal: 20 },
                            textInput: styles.focusInput,
                            listView: styles.focusListView,
                            row: styles.focusRow,
                            description: styles.focusDescription,
                            separator: { height: 1, backgroundColor: '#F1F5F9' },
                        }}
                        textInputProps={{ placeholderTextColor: '#94A3B8', clearButtonMode: "always" }}
                    />
                </View>
            )}

            {/* 5. FINDING MODE OVERLAY */}
            {mode === 'finding' && (
                <View style={styles.findingOverlay}>
                    <Animated.View style={[styles.findingPulse, { transform: [{ scale: pulseAnim }] }]}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </Animated.View>
                    <Text style={styles.findingText}>Finding your driver...</Text>
                    <Text style={styles.findingSubtext}>This usually takes less than a minute</Text>
                </View>
            )}

            {/* 6. COMPACT BOTTOM SHEET (Vehicle First Layout) */}
            {mode === 'default' && (
                <View style={styles.compactSheet}>
                    <View style={styles.sheetHandle} />

                    {/* Header: Business Badge & Title */}
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sectionTitle}>Choose Your Ride</Text>
                        {/* Business Badge Logic */}
                        {userProfile?.orgId && (
                            <View style={styles.businessBadge}>
                                <MaterialIcons name="business-center" size={12} color="white" />
                                <Text style={styles.businessBadgeText}>Business</Text>
                            </View>
                        )}
                    </View>

                    {/* Scrollable Content Area (Max Height ~45% of screen) */}
                    <ScrollView style={{ maxHeight: height * 0.45 }}>
                        {/* Row 1: Large Vehicle Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.vehicleList}
                            contentContainerStyle={{ paddingRight: 20, paddingLeft: 4 }} // Added paddingLeft
                        >
                            {VEHICLE_FLEET.map((v) => (
                                <VehicleCard
                                    key={v.id}
                                    type={v.id}
                                    label={v.label}
                                    imageSource={v.image || require('../../assets/images/truck.png')}
                                    selected={vehicleType === v.id}
                                    onSelect={() => setVehicleType(v.id)}
                                    hasDestination={hasDestination}
                                    pickup={pickupPoint}
                                    dropoff={dropoffPoint}
                                    pickupEta={getDriverEta(v.id)}
                                    routeData={routeData}
                                />
                            ))}
                        </ScrollView>

                        {/* Row 2: Smart Cargo Selector */}
                        <SmartCargoSelector
                            mode={missionMode}
                            setMode={setMissionMode}
                            selectedRef={selectedRefId}
                            onSelectRef={handleRefSelect}
                            selectedHouse={selectedHouseId}
                            onSelectHouse={handleHouseSelect}
                            hasPhoto={!!cargoPhoto}
                            onTakePhoto={handleTakePhoto}
                        />

                        {/* Row 3: Inline Controls (Single Row Guaranteed) */}
                        <View style={styles.inlineControls}>
                            {/* Fragile (Left) */}
                            <TouchableOpacity
                                style={[styles.miniChip, isFragile && styles.miniChipActive]}
                                onPress={() => setIsFragile(!isFragile)}
                            >
                                <MaterialCommunityIcons name="glass-fragile" size={18} color={isFragile ? '#EF4444' : '#64748B'} />
                                <Text style={[styles.miniChipText, isFragile && styles.miniChipTextActive]}>Fragile</Text>
                            </TouchableOpacity>

                            {/* Helpers (Center) */}
                            {maxHelpers > 0 && (
                                <View style={styles.miniHelper}>
                                    <Text style={styles.helperLabel}>Helpers</Text>
                                    <View style={styles.helperCounterCompact}>
                                        <TouchableOpacity onPress={() => setHelpersCount(Math.max(0, helpersCount - 1))} hitSlop={8}>
                                            <MaterialCommunityIcons name="minus" size={14} color="#92400E" />
                                        </TouchableOpacity>
                                        <Text style={styles.miniCount}>{helpersCount}</Text>
                                        <TouchableOpacity onPress={() => setHelpersCount(Math.min(maxHelpers, helpersCount + 1))} hitSlop={8}>
                                            <MaterialCommunityIcons name="plus" size={14} color="#92400E" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Payment (Right) */}
                            <TouchableOpacity
                                style={styles.paymentChip}
                                onPress={() => setPaymentMethod(paymentMethod === 'cash' ? 'wallet' : 'cash')}
                            >
                                <MaterialIcons name={paymentMethod === 'cash' ? 'payments' : 'account-balance-wallet'} size={16} color="#64748B" />
                                <Text style={styles.paymentChipText}>{paymentMethod === 'cash' ? 'Cash' : 'Wallet'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* BOOK BUTTON (Visual Truth Logic) */}
                    <TouchableOpacity
                        style={[styles.fixedBookBtn, !isBookingValid() && styles.bookBtnPhotoAction]}
                        onPress={handleBookRide}
                        disabled={isBooking}
                    >
                        {isBooking ? (
                            <ActivityIndicator color="#FFF" />
                        ) : !isBookingValid() ? (
                            <>
                                <MaterialIcons name="camera-alt" size={24} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.bookBtnText}>Take Photo to Continue</Text>
                            </>
                        ) : (
                            <View style={styles.bookBtnContent}>
                                <Text style={styles.bookBtnText}>
                                    BOOK {vehicleType.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View >
            )
            }

            {/* Phone Modal */}
            <PhoneModal
                visible={showPhoneModal}
                onSubmit={handlePhoneSubmit}
                onClose={() => setShowPhoneModal(false)}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    map: { ...StyleSheet.absoluteFillObject },

    // Header
    headerFloating: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
    profileButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    headerActions: { flexDirection: 'row', gap: 12 },
    notificationButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    loginPill: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    loginText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

    // Search Card
    floatingSearchContainer: { position: 'absolute', left: 20, right: 20, zIndex: 9 },
    routeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    routeRow: { flexDirection: 'row', alignItems: 'center', height: 44 },
    dotLine: { width: 24, alignItems: 'center', marginRight: 12 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    line: { width: 2, height: 28, backgroundColor: '#E2E8F0', position: 'absolute', top: 16 },
    square: { width: 10, height: 10, backgroundColor: '#0F172A' },
    routeText: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 36, marginVertical: 4 },
    nowBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    nowText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    // Focus Search
    focusSearchContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', zIndex: 20 },
    focusHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    focusTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
    focusInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    focusListView: { marginTop: 8 },
    focusRow: { paddingVertical: 14, paddingHorizontal: 16 },
    focusDescription: { fontSize: 15, color: '#0F172A' },

    // Finding Mode
    findingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
    findingPulse: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    findingText: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
    findingSubtext: { fontSize: 14, color: '#64748B' },

    // Compact Bottom Sheet (Map-First Design)
    compactSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
    floatingBottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
    sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5 },
    sectionHeaderRow: { marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
    sectionTitleSmall: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
    businessBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    businessBadgeText: { fontSize: 11, fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Cargo Chips (Compact - 40px height)
    cargoChipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cargoChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, marginHorizontal: 3, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
    cargoChipActive: { backgroundColor: '#EFF6FF', borderColor: Colors.primary },
    cargoChipIcon: { fontSize: 16 },
    cargoChipImage: { width: 28, height: 28 }, // NEW: Image-based icon
    cargoChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    cargoChipTextActive: { color: Colors.primary },

    // Context Helper
    contextHelper: { marginBottom: 12, paddingHorizontal: 4 },
    contextHelperText: { fontSize: 13, color: '#64748B', fontStyle: 'italic', fontWeight: '500' },

    // Slim Vehicle List (Deprecated but keeping styles for safety just in case)
    slimVehicleScroll: { marginBottom: 12 },
    slimVehicle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, marginRight: 10, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 2, borderColor: 'transparent', minWidth: 160 },
    slimVehicleActive: { backgroundColor: '#EFF6FF', borderColor: Colors.primary },
    slimVehicleIcon: { width: 50, height: 35 },
    slimVehicleInfo: { flex: 1, marginLeft: 10 },
    slimVehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    slimVehicleName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    slimVehicleNameActive: { color: Colors.primary },
    capacityBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    capacityText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    slimVehicleEta: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
    slimVehiclePrice: { fontSize: 14, fontWeight: '800', color: '#64748B' },
    slimVehiclePriceActive: { color: Colors.primary },

    // Inline Controls Row
    inlineControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    miniChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F1F5F9', borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent', gap: 6 },
    miniChipActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
    miniChipIcon: { width: 20, height: 20 },
    miniChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    miniChipTextActive: { color: '#EF4444' }, // Added
    miniHelper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FEF3C7', borderRadius: 10 },
    helperIcon: { width: 24, height: 24, borderRadius: 12 },
    helperLabel: { fontSize: 12, fontWeight: '700', color: '#92400E' },
    helperCounterCompact: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 }, // Added
    miniHelperText: { fontSize: 14 },
    miniBtn: { fontSize: 18, fontWeight: 'bold', color: '#92400E', paddingHorizontal: 6 },
    miniCount: { fontSize: 14, fontWeight: '800', color: '#92400E', minWidth: 16, textAlign: 'center' },
    paymentChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F1F5F9', borderRadius: 10, marginLeft: 'auto' },
    paymentChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

    // Vehicle Card
    // Vehicle Card (Premium Redesign)
    vehicleList: { paddingBottom: 16, gap: 16, paddingRight: 20 },
    vehicleCard: {
        width: 150, // Increased to 150px (Premium Space)
        padding: 12,
        paddingTop: 16,
        marginRight: 12, // Added Spacing
        borderRadius: 20, // Softer corners
        backgroundColor: 'white',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, // Softer shadow
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    vehicleCardSelected: {
        backgroundColor: '#FFF',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ scale: 1.02 }] // Subtle lift
    },
    vehicleImage: { width: 80, height: 50, marginBottom: 8 }, // Reduced size
    vehicleInfo: { alignItems: 'center' },
    vehicleLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
    vehicleLabelSelected: { color: Colors.primary },
    vehiclePrice: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 2 },
    vehiclePriceSelected: { color: '#0F172A', fontWeight: '800' },
    vehiclePriceLabel: { fontSize: 9, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
    vehiclePriceLabelActive: { color: '#22C55E', fontWeight: '700' },
    vehiclePriceActive: { color: '#0F172A', fontWeight: '800' },

    // ETA Badge
    etaBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomLeftRadius: 16,
        borderTopRightRadius: 18
    },
    etaBadgeSelected: { backgroundColor: Colors.primary },
    etaText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
    etaTextSelected: { color: 'white' },

    // Context Tags & Helper Counter
    tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingHorizontal: 4 },
    tagChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
    tagChipActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
    tagIcon: { fontSize: 14 },
    tagText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    tagTextActive: { color: '#DC2626' },
    helperSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    // helperLabel style is defined in Inline Controls section
    helperCounter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    counterBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    counterBtnText: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    counterValue: { fontSize: 16, fontWeight: '800', color: '#92400E', minWidth: 20, textAlign: 'center' },

    // Cargo Input
    cargoInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },

    // Payment Row
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    paymentLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    paymentToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
    paymentOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 6 },
    paymentActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    paymentText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    paymentTextActive: { color: Colors.primary },

    // Book Button
    bookBtn: {
        backgroundColor: Colors.primary,
        margin: 16,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fixedBookBtn: {
        backgroundColor: Colors.primary,
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 8,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    bookBtnPhotoAction: {
        backgroundColor: '#DC2626', // Red for mandatory photo action
    },
    bookBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Phone Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24 },
    phoneInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
    modalButton: { backgroundColor: Colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    modalButtonDisabled: { opacity: 0.5 },
    modalButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    modalCancel: { color: '#64748B', fontSize: 16, textAlign: 'center' },
});
