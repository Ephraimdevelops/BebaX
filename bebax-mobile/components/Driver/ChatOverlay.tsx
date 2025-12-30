import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Phone, CheckCircle, Clock } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';

interface ChatOverlayProps {
    customerPhone?: string;
    onSendMessage?: (msg: string) => void;
}

export default function ChatOverlay({ customerPhone, onSendMessage }: ChatOverlayProps) {
    const handleCall = () => {
        if (customerPhone) {
            Linking.openURL(`tel:${customerPhone}`);
        }
    };

    const sendCanned = (text: string) => {
        if (onSendMessage) onSendMessage(text);
    };

    return (
        <View style={styles.container}>
            <View style={styles.quickReplies}>
                <TouchableOpacity style={styles.msgBtn} onPress={() => sendCanned("Niko njiani / On my way")}>
                    <Clock size={16} color={Colors.textDim} />
                    <Text style={styles.msgText}>Niko njiani</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.msgBtn} onPress={() => sendCanned("Nimefika / I'm here")}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.msgText}>Nimefika</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.msgBtn} onPress={() => sendCanned("Nitachelewa / Stuck in traffic")}>
                    <Text style={styles.msgText}>Nitachelewa</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Phone size={24} color="white" />
                <Text style={styles.callText}>Mpigie Abiria</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 120, // Above bottom tabs
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    quickReplies: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    msgBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        gap: 4,
    },
    msgText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary, // Safety Orange
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    callText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
