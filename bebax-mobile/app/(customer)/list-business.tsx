import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BusinessWizard } from '../../components/BusinessWizard';
import { useUser } from '@clerk/clerk-expo';

export default function ListBusinessScreen() {
    const router = useRouter();
    const { user } = useUser();

    // Callback when wizard finishes
    const handleComplete = async () => {
        // Update metadata for frontend checks (like business tab role check)
        if (user) {
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role: 'business',
                    accountType: 'organization',
                }
            });
        }

        // Go to dashboard
        router.replace('/(customer)/my-business');
    };

    return (
        <BusinessWizard onComplete={handleComplete} />
    );
}
