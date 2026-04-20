import axios from 'axios';
import { AnalyticsGlobal, AnalyticsClinic, AnalyticsResponse } from '../types';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Fetch global analytics (ADMIN only)
 */
export async function getGlobalAnalytics(token: string): Promise<AnalyticsGlobal> {
    const response = await axios.get<AnalyticsResponse<AnalyticsGlobal>>(`${API_GATEWAY_URL}/analytics/global`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error fetching global analytics');
    }

    return response.data.data;
}

/**
 * Fetch clinic analytics (CLINIC_ADMIN and ADMIN)
 */
export async function getClinicAnalytics(clinicId: string, token: string): Promise<AnalyticsClinic> {
    const response = await axios.get<AnalyticsResponse<AnalyticsClinic>>(`${API_GATEWAY_URL}/analytics/clinic/${clinicId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error fetching clinic analytics');
    }

    return response.data.data;
}
