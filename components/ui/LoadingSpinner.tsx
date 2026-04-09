interface LoadingSpinnerProps {
    size?: number;
    text?: string;
    /**
     * fullPage: muestra un overlay centrado que cubre toda la página.
     * Ideal para esperar respuestas de microservicios.
     */
    fullPage?: boolean;
}

function Spinner({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-spin"
        >
            <circle cx="24" cy="24" r="20" stroke="#e8f4fd" strokeWidth="4" />
            <path
                d="M24 4a20 20 0 0 1 20 20"
                stroke="#2e86c1"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function LoadingSpinner({ size = 48, text, fullPage = false }: LoadingSpinnerProps) {
    const inner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size={size} />
            {text && (
                <p className="text-petwell-blue font-medium text-sm tracking-wide animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="card-glass px-10 py-8 flex flex-col items-center gap-4 animate-fade-in">
                    <Spinner size={size} />
                    {text && (
                        <p className="text-petwell-blue font-semibold text-sm tracking-wide animate-pulse">
                            {text}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return inner;
}
