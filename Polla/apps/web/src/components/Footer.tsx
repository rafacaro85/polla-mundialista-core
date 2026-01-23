"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, MessageCircle, HeartHandshake } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export default function Footer() {
    const pathname = usePathname();
    const config = useSystemConfig();

    // Hide footer on Super Admin Dashboard
    if (pathname?.startsWith('/super-admin')) {
        return null;
    }

    const STYLES = {
        container: {
            backgroundColor: 'var(--brand-secondary)', // Dynamic
            borderTop: '1px solid #1E293B',
            padding: '40px 20px 140px 20px', // Extra bottom padding for mobile nav overlap
            marginTop: 'auto', // Push to bottom if flex container
            color: '#94A3B8',
            fontSize: '12px',
            textAlign: 'center' as const
        },
        socialRow: {
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px'
        },
        socialBtn: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: '1px solid #334155'
        },
        linksRow: {
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '16px',
            flexWrap: 'wrap' as const
        },
        link: {
            color: '#94A3B8',
            textDecoration: 'none',
            transition: 'color 0.2s'
        },
        copyright: {
            opacity: 0.5
        }
    };

    return (
        <footer style={STYLES.container} >
            {/* ZONA SOCIAL */}
            < div style={STYLES.socialRow} >
                <a
                    href={config.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={STYLES.socialBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E1306C'; e.currentTarget.style.borderColor = '#E1306C'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.borderColor = '#334155'; }}
                >
                    <Instagram size={20} />
                </a>
                <a
                    href={config.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={STYLES.socialBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1877F2'; e.currentTarget.style.borderColor = '#1877F2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.borderColor = '#334155'; }}
                >
                    <Facebook size={20} />
                </a>
                <a
                    href={config.socials.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={STYLES.socialBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.borderColor = '#25D366'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.borderColor = '#334155'; }}
                >
                    <MessageCircle size={20} />
                </a>
                <a
                    href={config.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={STYLES.socialBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'black'; e.currentTarget.style.borderColor = '#00f2ea'; e.currentTarget.style.color = '#ff0050'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = 'white'; }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                </a>
            </div >

            {/* LINKS LEGALES */}
            < div style={STYLES.linksRow} >
                <a href={config.links.terms} style={STYLES.link} className="hover:text-white">Términos y Condiciones</a>
                <a href={config.links.privacy} style={STYLES.link} className="hover:text-white">Política de Privacidad</a>
            </div >

            {/* COPYRIGHT */}
            < div style={STYLES.copyright} >
                {config.copyright}
            </div >
        </footer >
    );
}
