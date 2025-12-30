import api from '@/lib/api';

export const superAdminService = {
    // --- USERS ---
    getAllUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    updateUserPoints: async (userId: string, points: number) => {
        const response = await api.patch(`/users/${userId}`, { globalPoints: points });
        return response.data;
    },

    // --- LEAGUES ---
    getAllLeagues: async () => {
        const response = await api.get('/leagues/all');
        return response.data;
    },

    // --- TRANSACTIONS ---
    getAllTransactions: async () => {
        const response = await api.get('/transactions');
        return response.data;
    },

    downloadVoucher: async (transactionId: string) => {
        const response = await api.get(`/transactions/${transactionId}/voucher`, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `voucher-${transactionId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    createTransaction: async (data: { packageType: string, amount: number, leagueId: string }) => {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    approveTransaction: async (id: string) => {
        const response = await api.patch(`/transactions/${id}/approve`, {});
        return response.data;
    },

    // --- SYSTEM SETTINGS ---
    getSettings: async () => {
        const response = await api.get('/system-settings');
        return response.data;
    },

    updateSettings: async (settings: any) => {
        const response = await api.patch('/system-settings', settings);
        return response.data;
    },

    // --- MATCHES ---
    getAllMatches: async () => {
        const response = await api.get('/matches');
        return response.data;
    },

    updateMatch: async (id: string, data: any) => {
        const response = await api.patch(`/matches/${id}`, data);
        return response.data;
    },

    forceSync: async () => {
        const response = await api.post('/matches/sync', {});
        return response.data;
    },

    createMatch: async (data: any) => {
        const response = await api.post('/matches', data);
        return response.data;
    },

    simulateMatches: async () => {
        const response = await api.post('/matches/simulate-results');
        return response.data;
    },

    resetAllMatches: async () => {
        const response = await api.post('/matches/reset-all');
        return response.data;
    },

    // --- STATS (Calculated on frontend for now) ---
    getDashboardStats: async () => {
        const [users, leagues, transactions] = await Promise.all([
            superAdminService.getAllUsers(),
            superAdminService.getAllLeagues(),
            superAdminService.getAllTransactions()
        ]);

        const totalIncome = transactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        const today = new Date().toISOString().split('T')[0];
        const todaySales = transactions
            .filter((tx: any) => tx.createdAt.startsWith(today))
            .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

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
            recentTransactions: transactions.slice(0, 10),
            users
        };
    }
};
