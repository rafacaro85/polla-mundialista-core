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

    seedRound32: async () => {
        const response = await api.post('/matches/seed-r32');
        return response.data;
    },

    repairTournament: async () => {
        const response = await api.post('/matches/repair-tournament');
        return response.data;
    },

    fixEmptyTeams: async () => {
        const response = await api.post('/matches/fix-empty-teams');
        return response.data;
    },

    diagnoseKnockout: async () => {
        const matches = await api.get('/matches');
        const phases = await api.get('/knockout-phases');
        
        const knockout = matches.data.filter((m: any) => 
            ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', '3RD_PLACE'].includes(m.phase)
        );
        
        const byPhase = knockout.reduce((acc: any, m: any) => {
            acc[m.phase] = (acc[m.phase] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalKnockout: knockout.length,
            byPhase,
            phaseStatus: phases.data,
            sampleQuarter: knockout.filter((m: any) => m.phase === 'QUARTER').slice(0, 2)
        };
    },

    // --- STATS (Calculated on frontend for now) ---
    getDashboardStats: async () => {
        const [users, leagues, transactions] = await Promise.all([
            superAdminService.getAllUsers(),
            superAdminService.getAllLeagues(),
            superAdminService.getAllTransactions()
        ]);

        const totalIncome = transactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        // FIX: Usar zona horaria de Colombia para definir "Hoy"
        const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });

        const todaySales = transactions
            .filter((tx: any) => {
                // Convertir fecha de transacción (UTC) a fecha Colombia
                const txDate = new Date(tx.createdAt).toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
                return txDate === todayStr;
            })
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

        const freeLeaguesCount = leagues.filter((l: any) => l.packageType === 'familia' || (!l.isPaid && l.type !== 'COMPANY')).length;

        return {
            kpis: {
                totalIncome,
                activeLeagues: leagues.length,
                totalUsers: users.length,
                todaySales,
                freeLeagues: freeLeaguesCount
            },
            salesTrend,
            recentTransactions: transactions, // Devolvemos TODAS para permitir filtrado en frontend
            users
        };
    }
};
