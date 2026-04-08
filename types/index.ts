// ─── Roles de usuario ───────────────────────────────────────────────────────

export type UserRole =
    | 'ADMIN'
    | 'CLINIC_ADMIN'
    | 'VETERINARIO'
    | 'RECEPCIONISTA'
    | 'DUENO_MASCOTA';

// ─── Tipos de Usuario ────────────────────────────────────────────────────────

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole | string;
    clinic_id?: string;
    photo_url?: string | null;
    clinic_logo_url?: string | null;
    is_active?: boolean;
    created_at: string;
    updated_at?: string;
}

// ─── Tipo de cuenta en registro ───────────────────────────────────────────────

export type AccountType = 'owner' | 'clinic';

// ─── Peticiones de Autenticación ─────────────────────────────────────────────

export interface RegisterRequest {
    name: string;
    email: string;
    phone?: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

// ─── Registro de Clínica Veterinaria ─────────────────────────────────────────

export interface ClinicRegisterRequest {
    clinic_name: string;
    admin_name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
    tax_id: string;
    opening_hours?: string;
    specialties?: string;
}

export interface Clinic {
    id: string;
    clinic_name: string;
    admin_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    tax_id: string;
    opening_hours?: string;
    specialties?: string;
    is_active?: boolean;
    created_at: string;
}

export interface ClinicResponse {
    success: boolean;
    message: string;
    data?: {
        token?: string;
        clinic: Clinic;
    };
}

// ─── Agregar Veterinario ──────────────────────────────────────────────────────

export interface VeterinarianRequest {
    name: string;
    email: string;
    password: string;
    license_number: string;
    phone?: string;
}

// ─── Agregar Recepcionista ────────────────────────────────────────────────────

export interface ReceptionistRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

// ─── Respuestas de la API ─────────────────────────────────────────────────────

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: User;
    };
}

export interface ProfileResponse {
    success: boolean;
    message?: string;
    data?: User;
}

export interface ApiError {
    success: false;
    message: string;
    errors?: string[];
}

// ─── Estado de Formulario ─────────────────────────────────────────────────────

export interface FormState {
    loading: boolean;
    error: string | null;
    success: string | null;
}

// ─── Cambio de contraseña ─────────────────────────────────────────────────────

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

// ─── Actualizar perfil de usuario ─────────────────────────────────────────────

export interface UpdateProfileRequest {
    name: string;
    email: string;
    phone?: string;
}

// ─── Respuesta genérica ───────────────────────────────────────────────────────

export interface BaseResponse {
    success: boolean;
    message: string;
}

// ─── Detalle de clínica (GET /clinics/:id) ─────────────────────────────────

export interface ClinicDetail {
    id: string;
    clinic_name: string;
    admin_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    tax_id?: string;
    logo_url?: string | null;
    opening_hours?: string;
    specialties?: string;
    is_active?: boolean;
    created_at: string;
    updated_at?: string;
}

export interface ClinicDetailResponse {
    success: boolean;
    message?: string;
    data?: ClinicDetail;
}

// ─── Personal de clínica (GET /clinics/:id/staff) ──────────────────────────

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'VETERINARIO' | 'RECEPCIONISTA';
    license_number?: string;
    is_active?: boolean;
    created_at?: string;
}

export interface StaffListResponse {
    success: boolean;
    message?: string;
    data?: StaffMember[];
}

// ─── Mascotas (Pet Service) ───────────────────────────────────────────────────

export interface Pet {
    id: string;
    owner_id: string;
    owner_ids?: string[];
    name: string;
    species: string;
    breed?: string;
    birth_date?: string;
    sex?: string;
    weight?: number;
    microchip?: string;
    allergies?: string;
    primary_clinic_id?: string;
    photo_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface PetRequest {
    name: string;
    species: string;
    breed?: string;
    birth_date?: string;
    sex?: string;
    weight?: number;
    microchip?: string;
    allergies?: string;
    primary_clinic_id?: string;
}

export interface PetResponse {
    success: boolean;
    message?: string;
    data?: Pet;
}

export interface PetListResponse {
    success: boolean;
    message?: string;
    data?: Pet[];
}

// ─── Historial Clínico (EHR Service) ─────────────────────────────────────────

export interface EhrRecord {
    id: string;
    pet_id: string;
    clinic_id: string;
    visit_date: string;
    reason?: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface EhrRequest {
    visit_date: string;
    visit_time?: string;        // HH:MM — optional, sent when known from appointment
    veterinarian_id?: string;  // UUID — the vet who attended the visit
    reason?: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
}

export interface EhrResponse {
    success: boolean;
    message?: string;
    data?: EhrRecord;
}

export interface EhrListResponse {
    success: boolean;
    message?: string;
    data?: EhrRecord[];
}

// ─── Auditoría de accesos al EHR ─────────────────────────────────────────────

export type EhrAuditAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface EhrAuditEntry {
    id: string;
    ehr_id?: string;
    pet_id: string;
    actor_id: string;
    actor_name?: string;
    actor_role?: string;
    clinic_name?: string;
    action: EhrAuditAction;
    timestamp: string;
    detail?: string;
}

export interface EhrAuditResponse {
    success: boolean;
    message?: string;
    data?: EhrAuditEntry[];
}

// ─── Vacunas (Vaccination Service) ───────────────────────────────────────

export interface Vaccination {
    id: string;
    pet_id: string;
    clinic_id: string;
    vaccine_name: string;
    application_date: string;     // YYYY-MM-DD
    next_due_date?: string | null; // YYYY-MM-DD
    batch_number?: string | null;
    veterinarian_id?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface VaccinationRequest {
    pet_id: string;
    vaccine_name: string;
    application_date: string;   // YYYY-MM-DD
    next_due_date?: string;     // YYYY-MM-DD
    batch_number?: string;
    veterinarian_id?: string;
    notes?: string;
}

export interface VaccinationResponse {
    success: boolean;
    message?: string;
    data?: Vaccination;
}

export interface VaccinationListResponse {
    success: boolean;
    message?: string;
    data?: Vaccination[];
}

// ─── Consentimiento de clínicas sobre el EHR ─────────────────────────────────

export interface EhrConsentEntry {
    id: string;
    pet_id: string;
    clinic_id: string;
    clinic_name?: string;
    granted_at: string;
    granted_by?: string;
}

export interface EhrConsentResponse {
    success: boolean;
    message?: string;
    data?: EhrConsentEntry[];
}

// ─── Módulo de Citas (Appointment Service) ───────────────────────────────────

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type AppointmentType = 'PRESENCIAL' | 'TELEMEDICINA';
export type AppointmentReasonType = 'CONSULTA' | 'VACUNACION' | 'URGENCIA';

export interface Appointment {
    id: string;
    clinic_id: string;
    veterinarian_id: string;
    veterinarian_name?: string;
    pet_id: string;
    pet_name?: string;
    pet_photo_url?: string | null;
    owner_id: string;
    owner_name?: string;
    owner_photo_url?: string | null;
    veterinarian_photo_url?: string | null;
    appointment_date: string; // YYYY-MM-DD
    start_time: string;      // HH:MM
    end_time?: string;       // HH:MM
    status: AppointmentStatus;
    type: AppointmentType;
    reason_type?: AppointmentReasonType; // CONSULTA | VACUNACION | URGENCIA
    reason?: string;
    notes?: string;
    cancelled_reason?: string;
    clinic_name?: string;
    clinic_logo_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface AppointmentRequest {
    pet_id: string;
    clinic_id: string;
    veterinarian_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    type: AppointmentType;
    reason_type?: AppointmentReasonType;
    reason?: string;
    notes?: string;
}

export interface AppointmentStatusRequest {
    status: AppointmentStatus;
    cancelled_reason?: string;
}

export interface AppointmentResponse {
    success: boolean;
    message?: string;
    data?: Appointment;
}

export interface AppointmentListResponse {
    success: boolean;
    message?: string;
    data?: Appointment[];
}

export interface AvailabilitySlot {
    start_time: string;    // HH:MM
    end_time: string;      // HH:MM
    veterinarian_id?: string;  // backend lo incluye cuando hay múltiples vets
    veterinarian_name?: string;
}

export interface AvailabilityResponse {
    success: boolean;
    message?: string;
    data?: AvailabilitySlot[];
}

// ─── Horarios de clínica (Schedules) ─────────────────────────────────────────

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matches backend number enum)
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAY_OF_WEEK_MAP: Record<DayOfWeek, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
};

export const REVERSE_DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
};

export interface ClinicSchedule {
    id: string;
    clinic_id: string;
    day_of_week: number;  // 0=Sunday … 6=Saturday
    start_time: string;   // HH:MM
    end_time: string;     // HH:MM
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ScheduleRequest {
    day_of_week: number;  // 0=Sunday … 6=Saturday — clinic_id comes from JWT
    start_time: string;   // HH:MM
    end_time: string;     // HH:MM
    is_active?: boolean;
}

export interface ScheduleResponse {
    success: boolean;
    message?: string;
    data?: ClinicSchedule;
}

export interface ScheduleListResponse {
    success: boolean;
    message?: string;
    data?: ClinicSchedule[];
}

// ─── Bloques de veterinario (VetBlocks) ──────────────────────────────────────

export interface VetBlock {
    id: string;
    clinic_id: string;
    veterinarian_id: string;
    veterinarian_name?: string;
    day_of_week: DayOfWeek;
    start_time: string;  // HH:MM
    end_time: string;    // HH:MM
    slot_duration_minutes: number; // 15 | 30 | 45 | 60
    created_at?: string;
    updated_at?: string;
}

export interface VetBlockRequest {
    clinic_id: string;
    veterinarian_id: string;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
}

export interface VetBlockResponse {
    success: boolean;
    message?: string;
    data?: VetBlock;
}

export interface VetBlockListResponse {
    success: boolean;
    message?: string;
    data?: VetBlock[];
}

// ─── Lista de espera (Waitlist) ───────────────────────────────────────────────

export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'SCHEDULED' | 'CANCELLED';

export interface WaitlistEntry {
    id: string;
    clinic_id: string;
    pet_id: string;
    pet_name?: string;
    owner_id: string;
    owner_name?: string;
    preferred_date?: string;
    preferred_time?: string;
    reason?: string;
    status: WaitlistStatus;
    created_at?: string;
    updated_at?: string;
}

export interface WaitlistListResponse {
    success: boolean;
    message?: string;
    data?: WaitlistEntry[];
}
