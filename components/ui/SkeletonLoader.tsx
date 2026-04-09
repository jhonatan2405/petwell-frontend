import React from 'react';

// ─── Bloque skeleton base ─────────────────────────────────────────────────────
function Bone({ className = '' }: { className?: string }) {
    return <div className={`skeleton ${className}`} />;
}

// ─── Skeleton: AppointmentCard ────────────────────────────────────────────────
export function AppointmentCardSkeleton() {
    return (
        <div className="card-glass p-4 rounded-2xl flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Bone className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="space-y-2">
                        <Bone className="h-4 w-32" />
                        <Bone className="h-3 w-24" />
                    </div>
                </div>
                <Bone className="h-6 w-20 rounded-full" />
            </div>
            {/* Info row */}
            <div className="grid grid-cols-2 gap-3 mt-1">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-3/4" />
                <Bone className="h-3 w-3/4" />
            </div>
            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-100 pt-2">
                <Bone className="h-8 flex-1 rounded-lg" />
            </div>
        </div>
    );
}

// ─── Skeleton: PetCard ────────────────────────────────────────────────────────
export function PetCardSkeleton() {
    return (
        <div className="card-glass p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Bone className="w-14 h-14 rounded-2xl flex-shrink-0" />
                    <div className="space-y-2">
                        <Bone className="h-5 w-28" />
                        <Bone className="h-3 w-20" />
                    </div>
                </div>
                <Bone className="h-6 w-16 rounded-full" />
            </div>
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Bone className="h-2.5 w-10" />
                    <Bone className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                    <Bone className="h-2.5 w-10" />
                    <Bone className="h-4 w-20" />
                </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Bone className="h-9 flex-1 rounded-xl" />
                <Bone className="h-9 flex-1 rounded-xl" />
                <Bone className="h-9 w-12 rounded-xl" />
            </div>
        </div>
    );
}

// ─── Skeleton: Dashboard stat card ───────────────────────────────────────────
export function StatCardSkeleton() {
    return (
        <div className="card-glass p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Bone className="h-3 w-24" />
                    <Bone className="h-5 w-16" />
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton: Fila de tabla ──────────────────────────────────────────────────
export function TableRowSkeleton() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
            <Bone className="w-8 h-8 rounded-full flex-shrink-0" />
            <Bone className="h-3 flex-1" />
            <Bone className="h-3 w-24" />
            <Bone className="h-6 w-20 rounded-full" />
        </div>
    );
}

// ─── Grid de skeletons de mascotas ────────────────────────────────────────────
export function PetsGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <PetCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── Grid de skeletons de citas ───────────────────────────────────────────────
export function AppointmentsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <AppointmentCardSkeleton key={i} />
            ))}
        </div>
    );
}
