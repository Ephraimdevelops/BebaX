import { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, ScrollView, Image, Platform, Keyboard, Modal, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'; // Fixed Type Import
import Link from 'expo-router/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { customMapStyle } from '../../src/constants/mapStyle';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
const { width, height } = Dimensions.get('window');

import { VEHICLE_FLEET } from '../../src/constants/vehicleRegistry';
import { DEEP_ASPHALT } from '../../src/components/VehicleIcons'; // Imported constant

// Map fleet to UI structure (adding mock ETA for now)
const vehicles = VEHICLE_FLEET.map(v => ({
    id: v.id,
    label: v.label,
    price: v.baseFare,
    eta: '5 min', // Mock ETA
    image: v.image // 3D Asset from registry
}));

interface VehicleCardProps {
    type: string;
    label: string;
    price: number;
    eta: string;
    imageSource: any;
    selected: boolean;
    onSelect: () => void;
}

const VehicleCard = ({ type, label, price, eta, imageSource, selected, onSelect }: VehicleCardProps) => (
    <TouchableOpacity
        style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
        onPress={onSelect}
        activeOpacity={0.8}
    >
        <Image source={imageSource} style={styles.vehicleImage} resizeMode="contain" />
        <View style={styles.vehicleInfo}>
            <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>{label}</Text>
            <Text style={styles.vehiclePrice}>Tsh {price.toLocaleString()}</Text>
            <Text style={styles.vehicleEta}>{eta} away</Text>
        </View>
        {selected && (
            <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            </View>
        )}
    </TouchableOpacity>
);

export default function CustomerHome() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const insets = useSafeAreaInsets();

    // Search Focus Refs
    const pickupRef = useRef<GooglePlacesAutocompleteRef>(null);
    const dropoffRef = useRef<GooglePlacesAutocompleteRef>(null);

    // State
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // LIVE DRIVERS QUERY
    const nearbyDrivers = useQuery(api.rides.getNearbyDrivers,
        location ? {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            radiusKm: 10
        } : "skip" // Skip if no location yet
    );

    // 'search-focus' means the user is typing in a full-screen mode.
    const [mode, setMode] = useState<'default' | 'search-focus' | 'finding'>('default');
    // Which field is currently being edited in focus mode?
    const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('dropoff');

    const [vehicleType, setVehicleType] = useState<string>('boda'); // Default to Boda
    const [itemsDescription, setItemsDescription] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    // const [insuranceSelected, setInsuranceSelected] = useState(false); // HIDING INSURANCE FOR NOW

    const createRide = useMutation(api.rides.create);
    const userProfile = useQuery(api.users.getCurrentProfile, {});
    const updateProfile = useMutation(api.users.updateProfile);

    // Initial Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            const initialPickup = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                address: "Current Location"
            };
            setPickup(initialPickup);
        })();
    }, []);

    // Handlers
    const handleBookRide = async () => {
        if (!pickup || !dropoff) {
            Alert.alert("Where to?", "Please select a dropoff location.");
            setActiveField('dropoff');
            setMode('search-focus');
            return;
        }

        if (!itemsDescription.trim()) {
            Alert.alert("What are you moving?", "Please describe your items (e.g., 'Sofa', 'Documents').");
            return;
        }

        setIsBooking(true);
        try {
            if (!userProfile?.phone) {
                setShowPhoneModal(true);
                setIsBooking(false);
                return;
            }

            // Creating ride
            const rideId = await createRide({
                pickup_location: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                dropoff_location: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.address },
                vehicle_type: vehicleType as any, // Cast to match union type
                fare_estimate: vehicles.find(v => v.id === vehicleType)?.price || 0,
                payment_method: paymentMethod,
                cargo_details: itemsDescription // Passing description
            });

            setMode('finding');
            setTimeout(() => {
                Alert.alert("Ride Confirmed", "Driver is on the way!");
                setIsBooking(false);
                router.push('/(customer)/ride-status');
            }, 3000);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Booking failed. Try again.");
            setIsBooking(false);
        }
    };

    const handlePhoneSubmit = async (phone: string) => {
        if (userProfile?._id) {
            await updateProfile({ phone });
            setShowPhoneModal(false);
            handleBookRide();
        }
    };

    // Full Screen Search Logic
    const openSearch = (field: 'pickup' | 'dropoff') => {
        setActiveField(field);
        setMode('search-focus');
    };

    const closeSearch = () => {
        setMode('default');
        Keyboard.dismiss();
    };

    // When an address is selected in the full screen list
    const handleAddressSelect = (data: any, details: any) => {
        const point = {
            lat: details?.geometry?.location.lat || 0,
            lng: details?.geometry?.location.lng || 0,
            address: data.description
        };

        if (activeField === 'pickup') {
            setPickup(point);
            // If dropoff is empty, switch to dropoff
            if (!dropoff) {
                setActiveField('dropoff');
                // Keep modal open
            } else {
                closeSearch();
            }
        } else {
            setDropoff(point);
            closeSearch();
        }
    };

    return (
        <View style={styles.container}>
            {/* MAP LAYER - FULL SCREEN BACKGROUND */}
            <MapView
                ref={mapRef}
                style={[styles.map, { marginBottom: mode === 'default' ? 200 : 0 }]} // Push map up slightly when overlay is valid? No, let's keep it full screen
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
                {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" pinColor={Colors.primary} />}
                {dropoff && <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} title="Dropoff" pinColor={Colors.text} />}

                {/* LIVE DRIVER MARKERS */}
                {nearbyDrivers?.map((driver: any) => {
                    const vehicleAsset = VEHICLE_FLEET.find(v => v.id === driver.vehicle_type)?.image;
                    return (
                        <Marker
                            key={driver._id}
                            coordinate={{ latitude: driver.location.lat, longitude: driver.location.lng }}
                            rotation={driver.heading || 0}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <Image
                                source={vehicleAsset || require('../../assets/images/vehicles/boda.png')}
                                style={{ width: 40, height: 40 }}
                                resizeMode="contain"
                            />
                        </Marker>
                    )
                })}
            </MapView>

            {/* HEADER / MENU BUTTON (Hidden if search focus) */}
            {mode === 'default' && (
                <TouchableOpacity
                    style={[styles.menuButton, { top: insets.top + 10 }]}
                    onPress={() => router.push('/(customer)/profile')}
                >
                    <Image source={require('../../assets/images/industrial_menu_icon.png')} style={styles.menuIcon} />
                </TouchableOpacity>
            )}

            {/* COMPACT SEARCH BAR (Visible when NOT focusing) */}
            {mode === 'default' && (
                <View style={[styles.compactSearchCard, { top: insets.top + 70 }]}>
                    <TouchableOpacity style={styles.compactInputRow} onPress={() => openSearch('pickup')}>
                        <View style={styles.blueDot} />
                        <Text numberOfLines={1} style={styles.compactInputText}>
                            {pickup?.address || "Current Location"}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.compactInputRow} onPress={() => openSearch('dropoff')}>
                        <View style={styles.squareDot} />
                        <Text numberOfLines={1} style={[styles.compactInputText, !dropoff && { color: Colors.textDim }]}>
                            {dropoff?.address || "Where to?"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* FULL SCREEN SEARCH MODAL (Using View to animate/overlay) */}
            {mode === 'search-focus' && (
                <View style={[styles.focusSearchContainer, { paddingTop: insets.top }]}>
                    <View style={styles.focusHeader}>
                        <TouchableOpacity onPress={closeSearch} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.focusTitle}>{activeField === 'pickup' ? "Set Pickup" : "Set Dropoff"}</Text>
                    </View>

                    <View style={styles.focusInputContainer}>
                        <GooglePlacesAutocomplete
                            ref={activeField === 'pickup' ? pickupRef : dropoffRef}
                            placeholder={activeField === 'pickup' ? "Enter pickup location" : "Where are you going?"}
                            onPress={handleAddressSelect}
                            query={{
                                key: GOOGLE_API_KEY,
                                language: 'en',
                                components: 'country:tz',
                            }}
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            styles={{
                                container: { flex: 0 },
                                textInput: styles.focusInput,
                                listView: styles.focusListView,
                                row: styles.focusRow,
                                description: styles.focusDescription,
                                separator: { height: 1, backgroundColor: '#f0f0f0' },
                            }}
                            textInputProps={{
                                placeholderTextColor: Colors.textDim,
                                clearButtonMode: "always",
                            }}
                        />
                    </View>
                </View>
            )}

            {/* FLOATING BOTTOM SHEET (Fleet & Actions) - REFACTORED */}
            {mode === 'default' && (
                <View style={[styles.floatingBottomContainer, { paddingBottom: insets.bottom }]}>
                    <View style={styles.bottomSheetHandle} />

                    {/* Fleet Selector (Horizontal Strip) */}
                    <Text style={styles.sectionTitle}>Choose Fleet</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.vehicleList}
                        decelerationRate="fast"
                    >
                        {vehicles.map((v) => (
                            <VehicleCard
                                key={v.id}
                                type={v.id as any}
                                label={v.label}
                                price={v.price}
                                eta={v.eta}
                                imageSource={v.image}
                                selected={vehicleType === v.id}
                                onSelect={() => setVehicleType(v.id)}
                            />
                        ))}
                    </ScrollView>

                    {/* Simple Bottom Actions */}
                    <View style={styles.simpleActionRow}>
                        <TouchableOpacity
                            style={[
                                styles.paymentSelector,
                                paymentMethod === 'wallet' && { backgroundColor: '#E0E7FF' } // Indigo tint for Coporate
                            ]}
                            onPress={() => {
                                if (paymentMethod === 'cash') {
                                    if (userProfile?.orgId) {
                                        setPaymentMethod('wallet');
                                    } else {
                                        Alert.alert("Corporate Wallet", "Ask your employer to add you to their BebaX Business account to use this feature.");
                                    }
                                } else {
                                    setPaymentMethod('cash');
                                }
                            }}
                        >
                            <Ionicons
                                name={paymentMethod === 'cash' ? "cash" : "briefcase"}
                                size={20}
                                color={paymentMethod === 'wallet' ? Colors.primary : DEEP_ASPHALT}
                            />
                            <Text style={[
                                styles.paymentValue,
                                paymentMethod === 'wallet' && { color: Colors.primary }
                            ]}>
                                {paymentMethod === 'cash' ? 'Cash' : 'Corporate'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.bookingButton}
                            onPress={handleBookRide}
                            disabled={isBooking}
                        >
                            {isBooking ? <ActivityIndicator color="white" /> : (
                                <Text style={styles.btnText}>Confirm {vehicles.find(v => v.id === vehicleType)?.label}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    menuButton: {
        position: 'absolute',
        left: 20,
        zIndex: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    menuIcon: {
        width: 44,
        height: 44,
        resizeMode: 'contain',
    },
    // Compact Search (Default View)
    compactSearchCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    compactInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    compactInputText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginLeft: 12,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginLeft: 26,
    },
    blueDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    squareDot: { width: 10, height: 10, backgroundColor: 'black', borderRadius: 2 },

    // Focus Search Mode
    focusSearchContainer: {
        flex: 1,
        backgroundColor: 'white',
        zIndex: 9999,
    },
    focusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 8,
    },
    backButton: {
        padding: 8,
    },
    focusTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    focusInputContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    focusInput: {
        backgroundColor: '#f5f5f5',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 12,
    },
    focusListView: {
        backgroundColor: 'white',
    },
    focusRow: {
        paddingVertical: 14,
    },
    focusDescription: {
        fontSize: 15,
        fontWeight: '500',
    },

    // Bottom Sheet
    floatingBottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 10,
    },
    itemsInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    itemsIconBox: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    itemsInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textDim,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vehicleList: {
        paddingBottom: 4,
        marginBottom: 8, // Compressed
    },
    vehicleCard: {
        width: 130, // Smaller width
        height: 140, // Reduced height
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    vehicleCardSelected: {
        backgroundColor: '#FFF7ED',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    vehicleImage: { width: 80, height: 60, marginBottom: 8 },
    vehicleInfo: { alignItems: 'center' },
    vehicleLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    vehicleLabelSelected: { color: Colors.primary },
    vehiclePrice: { fontSize: 12, fontWeight: '700', color: Colors.text },
    vehicleEta: { fontSize: 10, color: Colors.textDim, marginTop: 2 },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    // --- COMPACT ACTIONS ---
    simpleActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
        marginTop: 10,
    },
    paymentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '700',
        color: DEEP_ASPHALT,
    },
    bookingButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
