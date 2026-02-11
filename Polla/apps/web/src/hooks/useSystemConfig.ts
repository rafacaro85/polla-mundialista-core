import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useSystemConfig = () => {

    // Initial State (Default / Loading)
    const [config, setConfig] = useState({
        socials: {
            instagram: "https://instagram.com",
            facebook: "https://facebook.com",
            whatsapp: "https://wa.me/573045414087",
            tiktok: "https://tiktok.com"
        },
        links: {
            terms: "/terminos",
            privacy: "/privacidad"
        },
        copyright: "Copyright © 2026. Todos los derechos reservados."
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/system-settings');
                if (data) {
                    setConfig({
                        socials: {
                            instagram: data.instagram || "https://instagram.com",
                            facebook: data.facebook || "https://facebook.com",
                            whatsapp: data.whatsapp || "https://whatsapp.com",
                            tiktok: data.tiktok || "https://tiktok.com"
                        },
                        links: {
                            terms: data.termsUrl || "/terminos",
                            privacy: data.privacyUrl || "/privacidad"
                        },
                        copyright: data.copyright || "Copyright © 2026"
                    });
                }
            } catch (error) {
                console.error("Failed to load system config:", error);
            }
        };

        fetchSettings();
    }, []);

    return config;
};
