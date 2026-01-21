'use client';
import { BonusView } from '@/components/BonusView';
import { useParams } from 'next/navigation';

export default function BonusPage() {
    const params = useParams();
    const leagueId = params.id as string;

    return (
        <div className="pb-20">
            <BonusView leagueId={leagueId} />
        </div>
    );
}
