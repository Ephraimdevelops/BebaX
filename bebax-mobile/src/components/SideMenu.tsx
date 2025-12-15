import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth, useUser } from '@clerk/clerk-expo';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = SCREEN_WIDTH * 0.8;

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { signOut, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleNavigation = (route: string) => {
        onClose();
        // Small delay to allow menu to close slightly before nav
        setTimeout(() => {
            if (route === 'logout') {
                signOut();
                return;
            }

            // AUTH GUARD for protected routes
            if (!isSignedIn && (route === '/(customer)/wallet' || route === '/(customer)/activity')) {
                router.push('/(auth)/welcome');
                return;
            }

            if (route) {
                router.push(route as any);
            }
        }, 100);
    };

    const handleAuthAction = () => {
        onClose();
        router.push('/(auth)/welcome');
    };

    if (!visible && fadeAnim._value === 0) return null; // Optimization? Or allow render for animation out? 
    // Actually, we should render if visible OR animating. 
    // For simplicity, we just render and use pointerEvents.

    return (
        <View style={[styles.overlay, !visible && { pointerEvents: 'none' }]}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            {/* Menu Panel */}
            <Animated.View
                style={[
                    styles.menu,
                    { transform: [{ translateX: slideAnim }], paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                ]}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    {isSignedIn ? (
                        <TouchableOpacity style={styles.profileContainer} onPress={() => handleNavigation('/(customer)/profile')}>
                            {user?.imageUrl ? (
                                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={40} color={Colors.surface} />
                                </View>
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user?.fullName || 'BebaX User'}</Text>
                                <View style={styles.verifiedBadge}>
                                    <MaterialIcons name="verified" size={14} color={Colors.surface} />
                                    <Text style={styles.verifiedText}>Verified Customer</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.guestBanner} onPress={handleAuthAction}>
                            <View>
                                <Text style={styles.guestTitle}>WELCOME, GUEST</Text>
                                <Text style={styles.guestSubtitle}>Sign in to unlock full features</Text>
                            </View>
                            <View style={styles.signInButton}>
                                <Text style={styles.signInText}>SIGN IN / REGISTER</Text>
                                <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Menu Items */}
                <View style={styles.itemsContainer}>
                    <MenuItem
                        icon="history"
                        label="My Activity"
                        onPress={() => handleNavigation('/(customer)/activity')}
                        restricted={!isSignedIn}
                    />
                    <MenuItem
                        icon="account-balance-wallet"
                        label="Wallet"
                        onPress={() => handleNavigation('/(customer)/wallet')}
                        restricted={!isSignedIn}
                    />
                    <MenuItem
                        icon="support-agent"
                        label="Support & SOS"
                        onPress={() => handleNavigation('/(customer)/support')}
                    />
                    <MenuItem
                        icon="settings"
                        label="Settings"
                        onPress={() => Alert.alert("Settings", "App Settings coming soon.")}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {isSignedIn && (
                        <TouchableOpacity style={styles.logoutButton} onPress={() => handleNavigation('logout')}>
                            <MaterialIcons name="logout" size={20} color={Colors.error || '#FF4444'} />
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.versionText}>v2.0.1 Industrial</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const MenuItem = ({ icon, label, onPress, restricted }: { icon: any, label: string, onPress: () => void, restricted?: boolean }) => (
    <TouchableOpacity style={[styles.menuItem, restricted && styles.menuItemRestricted]} onPress={onPress}>
        <View style={styles.menuIconContainer}>
            <MaterialIcons name={icon} size={24} color={restricted ? Colors.textDim : Colors.primary} />
        </View>
        <Text style={[styles.menuLabel, restricted && styles.menuLabelRestricted]}>{label}</Text>
        {restricted && <MaterialIcons name="lock" size={16} color={Colors.textDim} style={{ marginLeft: 'auto' }} />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    menu: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: MENU_WIDTH,
        backgroundColor: 'rgba(18, 18, 18, 0.98)', // Deep Asphalt
        borderRightWidth: 1,
        borderRightColor: Colors.border,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.textDim,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.success || '#00C851', // Use verify color
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    verifiedText: {
        color: Colors.surface,
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    guestBanner: {
        backgroundColor: 'transparent',
    },
    guestTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textDim,
        letterSpacing: 1,
        marginBottom: 4,
    },
    guestSubtitle: {
        fontSize: 12,
        color: Colors.textDim,
        marginBottom: 16,
    },
    signInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    signInText: {
        color: Colors.surface,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginRight: 8,
    },
    itemsContainer: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    menuItemRestricted: {
        opacity: 0.6,
    },
    menuIconContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    menuLabelRestricted: {
        color: Colors.textDim,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        color: Colors.error || '#FF4444',
        fontWeight: 'bold',
        marginLeft: 12,
    },
    versionText: {
        color: Colors.textDim,
        fontSize: 10,
        textAlign: 'center',
        opacity: 0.5,
    },
});
