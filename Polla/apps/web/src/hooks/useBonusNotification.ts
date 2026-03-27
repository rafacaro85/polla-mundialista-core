import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export const useBonusNotification = (leagueId?: string, tournamentId?: string) => {
    const [unansweredCount, setUnansweredCount] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;
        const fetchCount = async () => {
            try {
                const [questionsRes, answersRes] = await Promise.all([
                    api.get('/bonus/questions', { params: { leagueId, tournamentId } }),
                    api.get('/bonus/my-answers', { params: { leagueId, tournamentId } })
                ]);
                
                if (!isMounted) return;

                const questions = questionsRes.data || [];
                const answeredIds = new Set((answersRes.data || []).map((a: any) => a.questionId));

                // Questions to notify:
                // 1. Must be active (isActive === true)
                // 2. Must NOT be locked
                // 3. User hasn't answered it
                
                let count = 0;
                questions.forEach((q: any) => {
                    // Si consideramos que isActive y !correctAnswer significa abierta
                    // y el usuario no la ha respondido todavía:
                    if (q.isActive && !answeredIds.has(q.id)) {
                        count++;
                    }
                });

                setUnansweredCount(count);
            } catch (error) {
                console.error('Error fetching bonus notification count:', error);
            }
        };

        fetchCount();

        // Podríamos también usar un setInterval si queremos que se refresque mágicamente,
        // pero con un load al montar el componente de navegación suele bastar para no saturar.

        return () => {
            isMounted = false;
        };
    }, [leagueId, tournamentId, pathname]);

    // Opcional: no mostrar badge si ya estamos en la pestaña de bonus (podemos manejarlo aquí o en el layout)
    return { unansweredCount };
};
