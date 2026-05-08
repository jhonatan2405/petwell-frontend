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
        <div className="relative flex items-center justify-center">
            {/* Pulsing ring background */}
            <div className="absolute inset-0 rounded-full bg-[#ED5565]/20 animate-ping" style={{ width: size, height: size }}></div>
            {/* Paw print */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 512 512"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#ED5565] animate-bounce relative z-10 drop-shadow-md"
            >
                <path d="M226.5 92.9c14.3 7.3 22.8 16.6 32.5 29.6 11 14.8 28.5 31.8 46.5 31.8 18 0 35.5-17 46.5-31.8 9.7-12.9 18.2-22.3 32.5-29.6 46.1-23.5 100.3 12 96.8 62.5-2.8 40.5-27 75.3-64.8 91.5-29.9 12.8-63.7 9.8-93.5-3.3-11.2-4.9-22.3-4.9-33.5 0-29.8 13.1-63.6 16.1-93.5 3.3-37.8-16.2-62-51-64.8-91.5-3.5-50.5 50.7-86 96.8-62.5zm-147 186.2c35.6-21.3 84.5-4.4 109.1 37.8 24.6 42.2 15.6 94.1-20 115.4-35.6 21.3-84.5 4.4-109.1-37.8-24.6-42.2-15.6-94.1 20-115.4zm353 0c35.6 21.3 26.6 73.2 2 115.4-24.6 42.2-73.5 59.1-109.1 37.8-35.6-21.3-26.6-73.2-2-115.4 24.6-42.2 73.5-59.1 109.1-37.8zM256 256c-11.2 0-21.8 1.4-31.8 3.9-34.9 8.8-64.4 34.6-78.5 69.1-14.5 35.6-9.6 74 12.4 105.5 21 29.9 54.4 47.9 90.7 47.9h14.4c36.3 0 69.7-18 90.7-47.9 22-31.5 26.9-69.9 12.4-105.5-14.1-34.5-43.6-60.3-78.5-69.1-10-2.5-20.6-3.9-31.8-3.9z"/>
            </svg>
        </div>
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
