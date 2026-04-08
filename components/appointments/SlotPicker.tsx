'use client';

import type { AvailabilitySlot } from '@/types';

interface SlotPickerProps {
    slots: AvailabilitySlot[];
    selected: string | null;
    onSelect: (slot: AvailabilitySlot) => void;
    loading?: boolean;
}

export default function SlotPicker({ slots, selected, onSelect, loading }: SlotPickerProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-10 rounded-xl bg-gray-100 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-4xl mb-2">🕐</p>
                <p className="text-gray-500 text-sm font-medium">
                    No hay disponibilidad para esta fecha
                </p>
                <p className="text-gray-400 text-xs mt-1">Intenta con otra fecha o veterinario</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs text-gray-500 mb-3">
                {slots.length} slots disponibles
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {slots.map((slot, idx) => {
                    if (!slot.start_time) return null; // Validación defensiva

                    const isSelected = selected === slot.start_time;
                    const uniqueKey = slot.veterinarian_id ? `${slot.start_time}-${slot.veterinarian_id}` : `${slot.start_time}-${idx}`;

                    return (
                        <button
                            key={uniqueKey}
                            disabled={false}
                            onClick={() => onSelect(slot)}
                            className={`
                                py-2 px-1 rounded-xl text-sm font-semibold transition-all duration-150
                                ${isSelected
                                    ? 'bg-petwell-blue text-white shadow-md scale-105'
                                    : 'bg-petwell-light text-petwell-blue hover:bg-petwell-blue hover:text-white border border-petwell-blue/20'
                                }
                            `}
                        >
                            {slot.start_time} - {slot.end_time}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
