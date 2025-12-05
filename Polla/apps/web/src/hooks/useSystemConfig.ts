import { useState, useEffect } from 'react';

export const useSystemConfig = () => {
    // In the future, this could fetch from an API
    const [config, setConfig] = useState({
        socials: {
            instagram: "https://instagram.com/tupolla",
            facebook: "https://facebook.com/tupolla",
            whatsapp: "https://wa.me/123456",
            tiktok: "https://tiktok.com/@tupolla"
        },
        links: {
            terms: "/terms",
            privacy: "/privacy"
        },
        copyright: "Copyright © 2026 TuApp. Todos los derechos reservados."
    });

    return config;
};
