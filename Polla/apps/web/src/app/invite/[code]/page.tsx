import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import InviteHandler from '@/components/InviteHandler';

interface PageProps {
    params: {
        code: string;
    };
}

export default async function InvitePage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    const code = params.code;

    if (!session) {
        // Redirigir al login con callbackUrl para volver aquí después
        const callbackUrl = encodeURIComponent(`/invite/${code}`);
        redirect(`/api/auth/signin?callbackUrl=${callbackUrl}`);
    }

    // Si tiene sesión, manejar la invitación en el cliente
    return <InviteHandler code={code} />;
}
