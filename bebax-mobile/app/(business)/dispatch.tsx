
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import MapView, { Marker } from 'react-native-maps';

const VEHICLES = [
    { id: 'boda', label: 'Boda', icon: 'motorcycle', price: 2000 },
    { id: 'toyo', label: 'Toyo', icon: 'tricycle', price: 5000 },
    { id: 'pickup', label: 'Pickup', icon: 'truck', price: 25000 },
    { id: 'canter', label: 'Canter', icon: 'truck-moving', price: 60000 },
];

export default function DispatchConsole() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();

    // Org Data
    const orgData = useQuery(api.b2b.getOrgStats);
    const dispatchRide = useMutation(api.b2b.dispatchRide);

    // Form State
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [cargoDesc, setCargoDesc] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('boda');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-fill from Params (Inventory Link)
    useEffect(() => {
        if (params.productName) {
            setCargoDesc(params.productName as string);
        }
    }, [params]);

    // Real Pricing from Backend (Source of Truth)
    const estimate = useQuery(api.pricing.getEstimate, {
        distance: 5.2, // Mock distance for now (would be calc'd from map)
        vehicleType: selectedVehicle,
        isBusiness: true, // Triggers B2B Margin
    });

    const handleDispatch = async () => {
        if (!recipientName || !recipientPhone || !cargoDesc) {
            Alert.alert("Missing Info", "Please fill in all recipient and cargo details.");
            return;
        }

        if (!orgData?.organization?.location) {
            Alert.alert("Error", "Store location not set. Please contact admin.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Hardcoded "Distance" and "Dropoff" for MVP Demo
            const mockDropoff = {
                lat: orgData.organization.location.lat + 0.01,
                lng: orgData.organization.location.lng + 0.01,
                address: "Customer Location (Tegeta)"
            };

            const result = await dispatchRide({
                recipient_name: recipientName,
                recipient_phone: recipientPhone, // Format: 255...
                vehicle_type: selectedVehicle,
                cargo_description: cargoDesc,
                dropoff_location: mockDropoff,
                distance: 5.2,
                fare_estimate: estimate?.fare || 0,
            });

            // VIRAL LOOP: WhatsApp Sharing
            // "Your package is on the way! Track it here: bebax.app/track/WB-123"
            const trackingLink = `https://bebax.app/track/${result.waybillNumber}`;
            const message = `Hello ${recipientName}, your order from ${organization?.name} is on the way! 🚚\n\nTrack your delivery here: ${trackingLink}`;
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${recipientPhone}`;

            Alert.alert(
                "Dispatch Successful!",
                `Waybill: ${result.waybillNumber}\n\nShare tracking link with customer?`,
                [
                    { text: "No", onPress: () => router.back(), style: "cancel" },
                    {
                        text: "Share via WhatsApp",
                        onPress: async () => {
                            // Deep Link to WhatsApp
                            const canOpen = await Linking.canOpenURL(whatsappUrl);
                            if (canOpen) {
                                await Linking.openURL(whatsappUrl);
                            } else {
                                Alert.alert("WhatsApp not installed", "Could not open WhatsApp.");
                            }
                            router.back();
                        }
                    }
                ]
            );
        } catch (err: any) {
            Alert.alert("Dispatch Failed", err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!orgData) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const { organization } = orgData;

    return (
        <View style={styles.container}>
            {/* --- HEADER --- */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Dispatch Console</Text>
                    <Text style={styles.headerSub}>{organization?.name || "Store"}</Text>
                </View>
                <View style={styles.walletPill}>
                    <Text style={styles.walletLabel}>WALLET</Text>
                    <Text style={styles.walletVal}>Tsh {orgData.stats.walletBalance.toLocaleString()}</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* 1. MAP SECTION (LOCKED PICKUP) */}
                    <View style={styles.mapSection}>
                        <Text style={styles.sectionTitle}>Route</Text>
                        <View style={styles.routeCard}>
                            {/* Pickup (Locked) */}
                            <View style={styles.routeRow}>
                                <View style={styles.dotCircle}>
                                    <View style={styles.innerDot} />
                                </View>
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeLabel}>PICKUP (LOCKED)</Text>
                                    <Text style={styles.routeVal}>{organization?.location?.address || "Store Location"}</Text>
                                </View>
                                <MaterialIcons name="lock" size={16} color="#94A3B8" />
                            </View>

                            <View style={styles.routeLine} />

                            {/* Dropoff (Simplified for MVP) */}
                            <View style={styles.routeRow}>
                                <View style={[styles.dotCircle, { borderColor: Colors.primary }]}>
                                    <View style={[styles.innerDot, { backgroundColor: Colors.primary }]} />
                                </View>
                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeLabel}>DROPOFF</Text>
                                    <Text style={styles.routeVal}>Customer's Location</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 2. RECIPIENT INFO */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Recipient Details</Text>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#64748B" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Customer Name"
                                    value={recipientName}
                                    onChangeText={setRecipientName}
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#64748B" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number (e.g. 255...)"
                                    keyboardType="phone-pad"
                                    value={recipientPhone}
                                    onChangeText={setRecipientPhone}
                                />
                            </View>
                        </View>
                    </View>

                    {/* 3. CARGO DETAILS */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Cargo</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="inventory" size={20} color="#64748B" />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 50 Bags of Cement"
                                value={cargoDesc}
                                onChangeText={setCargoDesc}
                            />
                        </View>
                    </View>

                    {/* 4. VEHICLE SELECTION */}
                    <View style={styles.vehicleSection}>
                        <Text style={styles.sectionTitle}>Select Vehicle</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleList}>
                            {VEHICLES.map((v) => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[styles.vehicleCard, selectedVehicle === v.id && styles.vehicleCardActive]}
                                    onPress={() => setSelectedVehicle(v.id)}
                                >
                                    <FontAwesome5
                                        name={v.icon as any}
                                        size={24}
                                        color={selectedVehicle === v.id ? Colors.primary : "#64748B"}
                                    />
                                    <Text style={[styles.vehicleLabel, selectedVehicle === v.id && styles.activeText]}>{v.label}</Text>
                                    <Text style={styles.vehiclePrice}>
                                        {/* Show roughly the price based on mock backend estimate if selected */}
                                        {/* Ideally we'd fetch for ALL vehicles, but for now we rely on the main estimate */}
                                        Start @ {v.price.toLocaleString()}=
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 5. SUMMARY & ACTION */}
                    <View style={styles.footerSpacer} />

                </ScrollView>
            </KeyboardAvoidingView>

            {/* FLOATING FOOTER */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.fareRow}>
                    <Text style={styles.totalLabel}>Estimated Cost (Incl. Tax)</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        {estimate ? (
                            <Text style={styles.totalVal}>Tsh {estimate.fare.toLocaleString()}</Text>
                        ) : (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        )}
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>Backend Verified</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.dispatchBtn, (!estimate || isSubmitting) && { opacity: 0.7 }]}
                    onPress={handleDispatch}
                    disabled={isSubmitting || !estimate}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.dispatchBtnText}>DISPATCH TRUCK</Text>
                            <Ionicons name="paper-plane" size={20} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: 'white' },
    headerSub: { fontSize: 13, color: '#94A3B8' },
    walletPill: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'flex-end',
    },
    walletLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
    walletVal: { fontSize: 14, color: '#10B981', fontWeight: '800' },

    content: { padding: 20, paddingBottom: 150 },

    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, textTransform: 'uppercase' },

    // Route Card
    mapSection: { marginBottom: 24 },
    routeCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    routeInfo: { flex: 1 },
    routeLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 2 },
    routeVal: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    dotCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#64748B', justifyContent: 'center', alignItems: 'center' },
    innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#64748B' },
    routeLine: { width: 2, height: 24, backgroundColor: '#E2E8F0', marginLeft: 7, marginVertical: 4 },

    // Form
    formSection: { marginBottom: 24 },
    inputGroup: { gap: 12 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, paddingHorizontal: 12, height: 50, gap: 10
    },
    input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },

    // Vehicles
    vehicleSection: { marginBottom: 24 },
    vehicleList: { gap: 12, paddingRight: 20 },
    vehicleCard: {
        width: 100, padding: 12, backgroundColor: 'white', borderRadius: 12,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 8
    },
    vehicleCardActive: { borderColor: Colors.primary, backgroundColor: '#F0F9FF', borderWidth: 2 },
    vehicleLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    activeText: { color: Colors.primary },
    vehiclePrice: { fontSize: 11, fontWeight: '700', color: '#1E293B' },

    footerSpacer: { height: 40 },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
        padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 10
    },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 14, color: '#64748B' },
    totalVal: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    dispatchBtn: {
        backgroundColor: Colors.primary, height: 56, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
    },
    dispatchBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

});
