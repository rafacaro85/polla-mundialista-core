export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirigir si el usuario ya está logueado (opcional, si hay un token válido)
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
            router.push('/');
        }
    }, [router]);

    const handleGoogleLogin = () => {
        // Limpiar completamente el localStorage y sessionStorage antes de iniciar sesión
        localStorage.clear();
        sessionStorage.clear();

        // Agregar timestamp para forzar nueva autenticación
        const timestamp = Date.now();
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log('🔐 Redirigiendo a Google OAuth:', `${API_URL}/auth/google`);
        window.location.href = `${API_URL}/auth/google?t=${timestamp}`;
    };

    return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
}
