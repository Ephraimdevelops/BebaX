import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const notifications = useQuery(api.notifications.getMyNotifications);
    const unreadCount = useQuery(api.notifications.getUnreadCount);
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const getIcon = (type: string) => {
        switch (type) {
            case 'ride_request': return 'local-taxi';
            case 'ride_accepted': return 'check-circle';
            case 'ride_completed': return 'flag';
            case 'payment': return 'payment';
            case 'verification': return 'verified';
            case 'promotion': return 'local-offer';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'ride_accepted': return Colors.success;
            case 'payment': return Colors.primary;
            case 'promotion': return '#9C27B0';
            default: return Colors.text;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const handlePress = async (notification: any) => {
        if (!notification.read) {
            await markAsRead({ notification_id: notification._id });
        }
        if (notification.ride_id) {
            router.push('/(customer)/ride-status');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount && unreadCount > 0 ? (
                    <TouchableOpacity onPress={() => markAllAsRead({})}>
                        <Text style={styles.markAllText}>Mark All Read</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 80 }} />}
            </View>

            {notifications === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="notifications-none" size={64} color={Colors.textDim} />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>You're all caught up!</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {notifications.map((notification: any) => (
                        <TouchableOpacity
                            key={notification._id}
                            style={[styles.card, !notification.read && styles.cardUnread]}
                            onPress={() => handlePress(notification)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: getIconColor(notification.type) + '20' }]}>
                                <MaterialIcons
                                    name={getIcon(notification.type)}
                                    size={24}
                                    color={getIconColor(notification.type)}
                                />
                            </View>
                            <View style={styles.content}>
                                <Text style={styles.title}>{notification.title}</Text>
                                <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
                                <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
                            </View>
                            {!notification.read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    markAllText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textLight,
        marginTop: 16,
    },
    emptyText: {
        color: Colors.textDim,
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardUnread: {
        backgroundColor: '#FFF5F0',
        borderColor: Colors.primary + '40',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        color: Colors.textDim,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 8,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
        marginLeft: 8,
    },
});
