import { Suspense } from 'react';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';

export default function SuperAdminPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando Admin...</div>}>
            <SuperAdminDashboard />
        </Suspense>
    );
}
