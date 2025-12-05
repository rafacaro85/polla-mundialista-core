import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const superAdminService = {
    // --- USERS ---
    getAllUsers: async () => {
        const response = await axios.get(`${API_URL}/api/users`, getHeaders());
        return response.data;
    },

    updateUserPoints: async (userId: string, points: number) => {
        const response = await axios.patch(`${API_URL}/api/users/${userId}`, { globalPoints: points }, getHeaders());
        return response.data;
    },

    // --- LEAGUES ---
    getAllLeagues: async () => {
        const response = await axios.get(`${API_URL}/api/leagues/all`, getHeaders());
        return response.data;
    },

    // --- TRANSACTIONS ---
    getAllTransactions: async () => {
        const response = await axios.get(`${API_URL}/api/transactions`, getHeaders());
        return response.data;
    },

    downloadVoucher: async (transactionId: string) => {
        const response = await axios.get(`${API_URL}/api/transactions/${transactionId}/voucher`, {
            ...getHeaders(),
            responseType: 'blob', // Important for PDF download
        });

        // Create a blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `voucher-${transactionId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // --- SYSTEM SETTINGS ---
    getSettings: async () => {
        const response = await axios.get(`${API_URL}/api/system-settings`, getHeaders());
        return response.data;
    },

    updateSettings: async (settings: any) => {
        const response = await axios.patch(`${API_URL}/api/system-settings`, settings, getHeaders());
        return response.data;
    },

    // --- MATCHES ---
    getAllMatches: async () => {
        const response = await axios.get(`${API_URL}/api/matches`, getHeaders());
        return response.data;
    },

    updateMatch: async (id: string, data: any) => {
        const response = await axios.patch(`${API_URL}/api/matches/${id}`, data, getHeaders());
        return response.data;
    },

    forceSync: async () => {
        const response = await axios.post(`${API_URL}/api/matches/sync`, {}, getHeaders());
        return response.data;
    },

    createMatch: async (data: any) => {
        const response = await axios.post(`${API_URL}/api/matches`, data, getHeaders());
        return response.data;
    },

    // --- STATS (Calculated on frontend for now) ---
    getDashboardStats: async () => {
        const [users, leagues, transactions] = await Promise.all([
            superAdminService.getAllUsers(),
            superAdminService.getAllLeagues(),
            superAdminService.getAllTransactions()
        ]);

        // Calculate Total Income
        const totalIncome = transactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        // Calculate Today's Sales
        const today = new Date().toISOString().split('T')[0];
        const todaySales = transactions
            .filter((tx: any) => tx.createdAt.startsWith(today))
            .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        // Calculate Sales Trend (Last 7 days)
        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const displayDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

            const dailyTotal = transactions
                .filter((tx: any) => tx.createdAt.startsWith(dateStr))
                .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

            salesTrend.push({ date: displayDate, value: dailyTotal });
        }

        return {
            kpis: {
                totalIncome,
                activeLeagues: leagues.length,
                totalUsers: users.length,
                todaySales
            },
            salesTrend,
            recentTransactions: transactions.slice(0, 10), // Last 10
            users // For search
        };
    }
};
