import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../src/constants/Colors';

interface IllustrationProps {
    width?: number;
    height?: number;
    color?: string;
}

export const WelcomeIllustration = ({ width = 200, height = 200, color = Colors.primary }: IllustrationProps) => (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
        <Circle cx="100" cy="100" r="80" fill={color} opacity="0.1" />
        <Path
            d="M60 100L90 130L140 70"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Circle cx="160" cy="40" r="10" fill={color} opacity="0.6" />
        <Circle cx="40" cy="160" r="15" fill="#333" opacity="0.2" />
        <Path
            d="M100 20V180"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.3"
        />
    </Svg>
);

export const DriverIllustration = ({ width = 200, height = 200, color = Colors.primary }: IllustrationProps) => (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
        <Circle cx="100" cy="100" r="90" stroke={color} strokeWidth="2" opacity="0.2" />
        <Circle cx="100" cy="100" r="60" stroke="#333" strokeWidth="2" opacity="0.1" />
        {/* Abstract Map Marker */}
        <Path d="M100 60C100 60 130 90 130 110C130 126.569 116.569 140 100 140C83.4315 140 70 126.569 70 110C70 90 100 60 100 60Z" fill={color} />
        <Circle cx="100" cy="110" r="15" fill="white" />
        {/* Route Line */}
        <Path d="M40 160C40 160 80 160 100 140" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" opacity="0.5" />
    </Svg>
);

export const SecurityIllustration = ({ width = 200, height = 200, color = Colors.primary }: IllustrationProps) => (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
        {/* Shield Shape */}
        <Path d="M100 40L160 70V110C160 150 100 180 100 180C100 180 40 150 40 110V70L100 40Z" fill={color} opacity="0.1" stroke={color} strokeWidth="4" />
        {/* Lock Body */}
        <Rect x="80" y="100" width="40" height="30" rx="5" fill={color} />
        <Path d="M90 100V90C90 84.4772 94.4772 80 100 80C105.523 80 110 84.4772 110 90V100" stroke={color} strokeWidth="6" />
        {/* Sparkles */}
        <Path d="M170 50L175 60L185 65L175 70L170 80L165 70L155 65L165 60L170 50Z" fill="#FFD700" />
    </Svg>
);

export const BebaXLogoText = ({ color = Colors.text }: { color?: string }) => (
    <Svg width={120} height={40} viewBox="0 0 120 40" fill="none">
        <Path d="M10 30V10H25C30 10 30 15 25 20H10" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 20H25C30 20 30 30 25 30H10" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Simple geometric representation of letters if needed, mostly handled by text in UI though */}
    </Svg>
);
