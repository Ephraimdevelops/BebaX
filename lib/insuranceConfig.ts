export const INSURANCE_TIERS = {
    BASIC: {
        id: 'basic',
        name: 'Basic Coverage',
        description: 'Standard liability coverage',
        fee: 500,
        requiresPhoto: false,
        coverageLimit: 50000,
    },
    STANDARD: {
        id: 'standard',
        name: 'Standard Protection',
        description: 'Full cargo protection up to 1M TZS',
        fee: 2500, // Base fee, logic might adjust this
        requiresPhoto: true,
        coverageLimit: 1000000,
    },
    CORPORATE: {
        id: 'corporate',
        name: 'Corporate Shield',
        description: 'Enterprise-grade protection included',
        fee: 0, // Included in B2B rates
        requiresPhoto: false,
        coverageLimit: 5000000,
    },
};

export const calculateInsuranceFee = (tierId: string, declaredValue: number = 0): number => {
    const tier = Object.values(INSURANCE_TIERS).find((t) => t.id === tierId);
    if (!tier) return 0;

    if (tier.id === 'standard' && declaredValue > 0) {
        // 1% of declared value for high value items, min 2500
        return Math.max(2500, Math.ceil(declaredValue * 0.01));
    }

    return tier.fee;
};

export const getInsuranceTier = (id: string) => {
    return Object.values(INSURANCE_TIERS).find((t) => t.id === id);
};
