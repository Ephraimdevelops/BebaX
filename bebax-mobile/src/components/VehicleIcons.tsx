import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// BebaX Brand Colors
const DEEP_ASPHALT = '#121212';
const SAFETY_ORANGE = '#FF5722';

interface IconProps {
    color?: string;
    width?: number;
    height?: number;
}

export const BodaIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path d="M5 17C3.89543 17 3 17.8954 3 19C3 20.1046 3.89543 21 5 21C6.10457 21 7 20.1046 7 19C7 17.8954 6.10457 17 5 17Z" fill={color} stroke="none" />
        <Path d="M19 17C17.8954 17 17 17.8954 17 19C17 20.1046 17.8954 21 19 21C20.1046 21 21 20.1046 21 19C21 17.8954 20.1046 17 19 17Z" fill={color} stroke="none" />
        <Path d="M15 6L9 8L8 12L13 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M19 19H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="19" cy="19" r="2" stroke={color} strokeWidth="1.5" />
        <Circle cx="5" cy="19" r="2" stroke={color} strokeWidth="1.5" />
    </Svg>
);

export const BajajIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L4 6V18L12 22L20 18V6L12 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 22V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 12L20 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 12L4 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const KirikuuIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="4" width="20" height="14" rx="1" stroke={color} strokeWidth="1.5" />
        <Path d="M16 4V18" stroke={color} strokeWidth="1.5" />
        <Path d="M2 12H16" stroke={color} strokeWidth="1.5" />
        <Circle cx="6" cy="19" r="2" fill={color} stroke="none" />
        <Circle cx="18" cy="19" r="2" fill={color} stroke="none" />
    </Svg>
);

export const PickupSIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path d="M2 11L5 7H11L12 11H2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="2" y="11" width="20" height="6" stroke={color} strokeWidth="1.5" />
        <Path d="M12 7V11" stroke={color} strokeWidth="1.5" />
        <Circle cx="6" cy="18" r="2" fill={color} stroke="none" />
        <Circle cx="18" cy="18" r="2" fill={color} stroke="none" />
    </Svg>
);

export const PickupDIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path d="M2 11L5 7H14L15 11H2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="2" y="11" width="20" height="6" stroke={color} strokeWidth="1.5" />
        <Path d="M9 7V11" stroke={color} strokeWidth="1.5" />
        <Path d="M15 7V11" stroke={color} strokeWidth="1.5" />
        <Circle cx="6" cy="18" r="2" fill={color} stroke="none" />
        <Circle cx="18" cy="18" r="2" fill={color} stroke="none" />
    </Svg>
);

export const TruckIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="6" width="14" height="11" rx="1" stroke={color} strokeWidth="1.5" />
        <Path d="M16 10H19L22 13V17H16V10Z" stroke={color} strokeWidth="1.5" />
        <Circle cx="6" cy="18" r="2" fill={color} stroke="none" />
        <Circle cx="18" cy="18" r="2" fill={color} stroke="none" />
    </Svg>
);

export const SemiIcon = ({ color = DEEP_ASPHALT, width = 40, height = 40 }: IconProps) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="5" width="12" height="12" stroke={color} strokeWidth="1.5" />
        <Rect x="16" y="9" width="6" height="8" stroke={color} strokeWidth="1.5" />
        <Circle cx="5" cy="18" r="2" fill={color} stroke="none" />
        <Circle cx="11" cy="18" r="2" fill={color} stroke="none" />
        <Circle cx="19" cy="18" r="2" fill={color} stroke="none" />
    </Svg>
);

export const getVehicleIcon = (id: string) => {
    switch (id) {
        case 'boda': return BodaIcon;
        case 'bajaj': return BajajIcon;
        case 'kirikuu': return KirikuuIcon;
        case 'pickup_s': return PickupSIcon;
        case 'pickup_d': return PickupDIcon;
        case 'semi': return SemiIcon;
        default: return TruckIcon;
    }
};

export { DEEP_ASPHALT, SAFETY_ORANGE };
