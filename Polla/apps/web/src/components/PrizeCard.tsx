import React from 'react';
import { Gift } from 'lucide-react';

interface PrizeCardProps {
    imageUrl?: string;
    description?: string;
    logoUrl?: string;
}

const STYLES = {
    card: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #FACC15', // Gold border
        padding: '20px',
        textAlign: 'center' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(250, 204, 21, 0.1)'
    },
    badge: {
        position: 'absolute' as const,
        top: '12px',
        right: '12px',
        backgroundColor: '#FACC15',
        color: '#0F172A',
        fontSize: '10px',
        fontWeight: '900',
        padding: '4px 8px',
        borderRadius: '12px',
        textTransform: 'uppercase' as const,
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    logoContainer: {
        position: 'absolute' as const,
        top: '12px',
        left: '12px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 10
    },
    imageContainer: {
        width: '100%',
        height: '180px',
        borderRadius: '12px',
        backgroundColor: '#0F172A',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const
    },
    title: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FACC15',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
        fontFamily: "'Russo One', sans-serif"
    },
    description: {
        fontSize: '13px',
        color: '#94A3B8',
        lineHeight: '1.5'
    }
};

export default function PrizeCard({ imageUrl, description, logoUrl }: PrizeCardProps) {
    if (!imageUrl && !description) return null;

    return (
        <div style={STYLES.card}>
            <div style={STYLES.badge}>
                <Gift size={12} /> Premio Mayor
            </div>

            {logoUrl && (
                <div style={STYLES.logoContainer}>
                    <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}

            {imageUrl && (
                <div style={STYLES.imageContainer}>
                    <img src={imageUrl} alt="Premio" style={STYLES.image} />
                </div>
            )}

            <div style={STYLES.title}>¡Gana este Premio!</div>

            {description && (
                <div style={STYLES.description}>
                    {description}
                </div>
            )}
        </div>
    );
}
