'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notificationService';
import { UserNotification } from '@/types';
import { getToken } from '@/utils/auth';

export default function NotificationBell() {
    const { isAuthenticated } = useAuthContext();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const token = getToken();

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            console.log("🔑 token:", token);
            const data = await getNotifications(token);
            // Sort notifications by date (newest first) in case the API doesn't
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setNotifications(sortedData);
        } catch (error) {
            console.warn("No se pudieron cargar notificaciones");
        }
    };

    useEffect(() => {
        if (!token || loaded) return;

        fetchNotifications();
        setLoaded(true);

        // Refrescar cada 15 segundos (Polling en tiempo real)
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, loaded]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const [prevUnreadCount, setPrevUnreadCount] = useState(0);
    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        if (unreadCount > prevUnreadCount) {
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 3000);
        }
        setPrevUnreadCount(unreadCount);
    }, [unreadCount, prevUnreadCount]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead || !token) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            await markAsRead(id, token);
        } catch (error) {
            console.error('Error marcando como leída', error);
            // Revert on error
            fetchNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token || unreadCount === 0) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await markAllAsRead(token);
        } catch (error) {
            console.error('Error marcando todas como leídas', error);
            // Revert on error
            fetchNotifications();
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white/80 hover:text-white transition-colors relative focus:outline-none flex items-center justify-center mt-1"
                aria-label="Notificaciones"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className={`absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-petwell-navy ${isBouncing ? 'animate-bounce ring-2 ring-red-400' : ''}`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-petwell-navy">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-petwell-teal bg-petwell-teal/10 px-2 py-0.5 rounded-full font-medium">
                                    {unreadCount} nuevas
                                </span>
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="text-[11px] text-gray-500 hover:text-petwell-teal transition-colors underline decoration-transparent hover:decoration-petwell-teal"
                                >
                                    Marcar todas listas
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center">
                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                No tienes notificaciones
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-petwell-navy' : 'font-medium text-gray-700'}`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-petwell-teal mt-1.5 flex-shrink-0 ml-2"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{notification.message}</p>
                                        <div className="mt-2 text-[10px] text-gray-400 font-medium">
                                            {new Date(notification.created_at).toLocaleString('es-ES', { 
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
