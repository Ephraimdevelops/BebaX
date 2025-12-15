import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, ScrollView, Image, Platform, Keyboard, Modal, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
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

const vehicles = [
    { id: 'boda', label: 'Boda', price: 2000, eta: '3 min', image: require('../../assets/images/boda.png') },
    { id: 'bajaji', label: 'Bajaji', price: 3000, eta: '5 min', image: require('../../assets/images/bajaji.png') },
    { id: 'classic', label: 'Classic', price: 5000, eta: '7 min', image: require('../../assets/images/car.png') },
    { id: 'boxbody', label: 'Truck', price: 15000, eta: '12 min', image: require('../../assets/images/truck.png') },
];

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
    const pickupRef = useRef<GooglePlacesAutocomplete>(null);
    const dropoffRef = useRef<GooglePlacesAutocomplete>(null);

    // State
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // 'search-focus' means the user is typing in a full-screen mode.
    const [mode, setMode] = useState<'default' | 'search-focus' | 'finding'>('default');
    // Which field is currently being edited in focus mode?
    const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('dropoff');

    const [vehicleType, setVehicleType] = useState<string>('bajaji');
    const [itemsDescription, setItemsDescription] = useState(''); // New State
    const [isBooking, setIsBooking] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [insuranceSelected, setInsuranceSelected] = useState(false);

    const createRide = useMutation(api.rides.createRide);
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
                pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                dropoff: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.address },
                vehicleType: vehicleType,
                price: vehicles.find(v => v.id === vehicleType)?.price || 0,
                paymentMethod: paymentMethod,
                // insurance: insuranceSelected,
                itemsDescription: itemsDescription // Passing description
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
            {/* MAP LAYER */}
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
                {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" pinColor={Colors.primary} />}
                {dropoff && <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} title="Dropoff" pinColor={Colors.text} />}
                {pickup && mode === 'default' && (
                    <Marker coordinate={{ latitude: pickup.lat + 0.002, longitude: pickup.lng + 0.002 }} rotation={45}>
                        <Image source={require('../../assets/images/bajaji.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                    </Marker>
                )}
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
                            autoFocus={true}
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

            {/* PREMIUM BOTTOM SHEET (Fleet & Actions) */}
            {mode === 'default' && (
                <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
                    <View style={styles.bottomSheetHandle} />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {/* Items Description Input */}
                        <View style={styles.itemsInputContainer}>
                            <View style={styles.itemsIconBox}>
                                <FontAwesome5 name="box-open" size={16} color={Colors.primary} />
                            </View>
                            <TextInput
                                style={styles.itemsInput}
                                placeholder="What are you moving? (e.g., Sofa)"
                                placeholderTextColor={Colors.textDim}
                                value={itemsDescription}
                                onChangeText={setItemsDescription}
                            />
                        </View>

                        {/* Fleet Title */}
                        <Text style={styles.sectionTitle}>Choose Fleet</Text>

                        {/* Vehicles */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.vehicleList}
                            decelerationRate="fast"
                            snapToInterval={156} // Adjusted for new card width + margin
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

                        {/* PREMIUM OPTIONS AREA */}
                        <View style={styles.premiumOptions}>
                            {/* Insurance Card */}
                            <TouchableOpacity
                                style={[styles.insuranceCard, insuranceSelected && styles.insuranceActive]}
                                onPress={() => setInsuranceSelected(!insuranceSelected)}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.shieldIconData, insuranceSelected && { backgroundColor: Colors.primary }]}>
                                    <FontAwesome5 name="shield-alt" size={18} color={insuranceSelected ? "white" : Colors.textDim} />
                                </View>
                                <View style={styles.insuranceTextContainer}>
                                    <Text style={styles.insuranceTitle}>Trip Protection</Text>
                                    <Text style={styles.insuranceSubtitle}>
                                        {insuranceSelected ? "Your goods are covered up to 5M Tsh." : "Cover damage or loss for just Tsh 500."}
                                    </Text>
                                </View>
                                {insuranceSelected ? (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                ) : (
                                    <View style={styles.addBtn}>
                                        <Text style={styles.addBtnText}>ADD</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Payment Method (Compacted) */}
                            <TouchableOpacity
                                style={styles.paymentSelector}
                                onPress={() => setPaymentMethod(paymentMethod === 'cash' ? 'wallet' : 'cash')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.paymentInfo}>
                                    <View style={[styles.paymentIconData, paymentMethod === 'wallet' ? { backgroundColor: Colors.primary } : {}]}>
                                        <Ionicons
                                            name={paymentMethod === 'cash' ? "cash" : "wallet"}
                                            size={20}
                                            color={paymentMethod === 'wallet' ? "white" : Colors.text}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.paymentLabel}>Payment Method</Text>
                                        <Text style={styles.paymentValue}>{paymentMethod === 'cash' ? 'Cash' : 'Wallet'}</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                            </TouchableOpacity>

                            {/* Confirm Button */}
                            <TouchableOpacity
                                style={styles.bookingButton}
                                onPress={handleBookRide}
                                disabled={isBooking}
                            >
                                {isBooking ? <ActivityIndicator color="white" /> : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.btnText}>Confirm & Book</Text>
                                        <Text style={styles.btnSubText}>
                                            {vehicles.find(v => v.id === vehicleType)?.label} • {vehicles.find(v => v.id === vehicleType)?.eta}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
        paddingTop: 16, // More top padding
        maxHeight: '65%', // Allow slightly more height
    },
    bottomSheetHandle: {
        width: 48, // Wider handle
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20, // More breathing room below handle
    },
    itemsInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        marginHorizontal: 24,
        paddingHorizontal: 20, // More internal padding
        paddingVertical: 16,
        borderRadius: 20, // Softer corners
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemsIconBox: {
        marginRight: 14,
    },
    itemsInput: {
        flex: 1,
        fontSize: 16, // Larger text
        fontWeight: '500',
        color: Colors.text,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        marginLeft: 24,
        marginBottom: 20, // More space below title
        marginTop: 20, // More space above title
        color: Colors.text,
    },
    vehicleList: {
        paddingHorizontal: 24,
        paddingBottom: 20, // More space below list
    },
    // Vehicle Card
    vehicleCard: {
        width: 146,
        height: 180,
        backgroundColor: 'white',
        borderRadius: 22,
        padding: 14,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    vehicleCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#fffdfb',
        borderWidth: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    vehicleImage: { width: 110, height: 65, marginBottom: 14 },
    vehicleLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    vehicleLabelSelected: { color: Colors.primary },
    vehiclePrice: { fontSize: 14, color: Colors.textDim, marginBottom: 4, fontWeight: '600' },
    vehicleEta: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    checkIcon: { position: 'absolute', top: 12, right: 12 },

    // Premium Options
    premiumOptions: {
        paddingHorizontal: 24,
        paddingTop: 28, // spacious
    },
    insuranceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    insuranceActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F0F9FF', // Subtle hint
    },
    shieldIconData: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    insuranceTextContainer: { flex: 1 },
    insuranceTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    insuranceSubtitle: { fontSize: 12, color: Colors.textDim, lineHeight: 16 },
    addBtn: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    addBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textDim },

    paymentRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    paymentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#F8F9FA',
        borderRadius: 14,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    paymentOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    paymentText: { marginLeft: 8, fontWeight: '600', color: Colors.textDim },
    paymentTextActive: { color: Colors.primary },

    bookingButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
        marginBottom: 10,
    },
    btnContent: { alignItems: 'center' },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    btnSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2, fontWeight: '500' },
});
