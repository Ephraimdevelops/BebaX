/**
 * BebaX Notification Utilities
 * Mock notification service for development
 * In production, replace with Africa's Talking, Twilio, or Firebase
 */

export interface NotificationPayload {
    userId: string;
    phone?: string;
    title: string;
    message: string;
    type: 'sms' | 'push' | 'in_app';
    data?: Record<string, any>;
}

// Development mode - mock notifications
const isDev = __DEV__ || process.env.NODE_ENV === 'development';

/**
 * Send a mock SMS notification (Development)
 */
export const sendMockSMS = (phone: string, message: string): void => {
    console.log('═══════════════════════════════════════════════');
    console.log('📱 [SMS MOCK]');
    console.log(`   To: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log('═══════════════════════════════════════════════');
};

/**
 * Send a mock push notification (Development)
 */
export const sendMockPush = (userId: string, title: string, body: string): void => {
    console.log('═══════════════════════════════════════════════');
    console.log('🔔 [PUSH MOCK]');
    console.log(`   User ID: ${userId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Body: ${body}`);
    console.log('═══════════════════════════════════════════════');
};

/**
 * Unified notification sender
 */
export const sendNotification = (payload: NotificationPayload): void => {
    if (isDev) {
        switch (payload.type) {
            case 'sms':
                sendMockSMS(payload.phone || 'N/A', payload.message);
                break;
            case 'push':
                sendMockPush(payload.userId, payload.title, payload.message);
                break;
            case 'in_app':
                console.log('📩 [IN-APP MOCK]', payload);
                break;
        }
    } else {
        // TODO: Implement production notification services
        // - Africa's Talking for SMS (Tanzania)
        // - Expo Push Notifications for Push
        // - Convex for in-app notifications
        console.warn('[PROD] Notification service not implemented');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION STATUS NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const VERIFICATION_MESSAGES = {
    DRIVER: {
        APPROVED: (name: string) => `🎉 Hongera ${name}! Your BebaX driver account is now ACTIVE. Start accepting rides now!`,
        REJECTED: (reason: string) => `⚠️ BebaX: Your driver application needs attention. Reason: ${reason}. Please check the app to fix this.`,
        CHANGES_REQUESTED: (reason: string) => `📝 BebaX: Please update your documents. Issue: ${reason}. Open the app to re-upload.`,
    },
    BUSINESS: {
        APPROVED: (name: string) => `🎉 Hongera! ${name} is now verified on BebaX. Start dispatching now!`,
        REJECTED: (reason: string) => `⚠️ BebaX: Your business application needs attention. Reason: ${reason}. Please check the app.`,
        CHANGES_REQUESTED: (reason: string) => `📝 BebaX: Please update your business documents. Issue: ${reason}. Open the app to fix.`,
    },
};

// Pre-defined rejection reasons for quick selection
export const REJECTION_REASONS = {
    DRIVER: [
        { id: 'blurry_doc', label: 'Blurry Document', description: 'The uploaded document is not clear enough to read' },
        { id: 'expired_license', label: 'Expired License', description: 'Your driving license has expired' },
        { id: 'name_mismatch', label: 'Name Mismatch', description: 'The name on the document does not match your profile' },
        { id: 'invalid_nida', label: 'Invalid NIDA', description: 'The NIDA number could not be verified' },
        { id: 'missing_photo', label: 'Missing Photo', description: 'Required photo is missing or not visible' },
        { id: 'other', label: 'Other', description: 'Custom reason' },
    ],
    BUSINESS: [
        { id: 'invalid_tin', label: 'Invalid TIN', description: 'The TIN number could not be verified with TRA' },
        { id: 'blurry_license', label: 'Blurry Business License', description: 'The business license photo is not clear' },
        { id: 'expired_license', label: 'Expired Business License', description: 'Your business license has expired' },
        { id: 'address_mismatch', label: 'Address Mismatch', description: 'The address does not match the registration' },
        { id: 'incomplete_docs', label: 'Incomplete Documents', description: 'Some required documents are missing' },
        { id: 'other', label: 'Other', description: 'Custom reason' },
    ],
};

export type RejectionAction = 'request_changes' | 'permanent_ban';

export interface RejectionPayload {
    action: RejectionAction;
    reasonId: string;
    reasonLabel: string;
    customMessage?: string;
}
