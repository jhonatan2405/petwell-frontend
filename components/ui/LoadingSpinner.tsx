export default function LoadingSpinner({ size = 48, text }: { size?: number; text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <svg
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin"
            >
                <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#e8f4fd"
                    strokeWidth="4"
                />
                <path
                    d="M24 4a20 20 0 0 1 20 20"
                    stroke="#2e86c1"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            {text && <p className="text-petwell-blue font-medium text-sm">{text}</p>}
        </div>
    );
}
