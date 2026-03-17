'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-bold text-white">
        Algo salió mal 😕
      </h2>
      <p className="text-slate-400 text-sm text-center">
        Ocurrió un error inesperado al cargar el dashboard.
        Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
