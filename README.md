# 🐾 PetWell – Frontend

Frontend principal de la plataforma de gestión veterinaria **PetWell**, construido con **Next.js 14**, **TypeScript** y **Tailwind CSS**.

---

## 🚀 Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env.local` ya está creado. Verifica que apunte al User Service correcto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

> ⚠️ El User Service debe estar corriendo en `http://localhost:3001` para que las funcionalidades de autenticación funcionen.

---

## 📁 Estructura del proyecto

```
petwell-frontend/
├── app/
│   ├── layout.tsx          # Layout raíz (Navbar + Footer)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Estilos globales + tokens PetWell
│   ├── login/
│   │   └── page.tsx        # Página de inicio de sesión
│   ├── register/
│   │   └── page.tsx        # Página de registro
│   └── dashboard/
│       └── page.tsx        # Panel del usuario autenticado
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # Barra de navegación
│   │   └── Footer.tsx      # Pie de página
│   └── ui/
│       ├── Button.tsx      # Botón reutilizable
│       ├── Input.tsx       # Campo de entrada
│       ├── Alert.tsx       # Alertas de éxito/error
│       └── LoadingSpinner.tsx
├── services/
│   └── api.ts              # Cliente HTTP centralizado → User Service
├── utils/
│   └── auth.ts             # Helpers del token JWT (localStorage)
├── types/
│   └── index.ts            # Interfaces TypeScript
└── .env.local              # Variables de entorno
```

---

## 🔗 Endpoints consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/users/register` | Registrar nuevo usuario |
| `POST` | `/users/login` | Iniciar sesión y obtener JWT |
| `GET`  | `/users/profile` | Obtener perfil autenticado |

**Header de autenticación:**
```
Authorization: Bearer <token>
```

---

## 🎨 Paleta de colores PetWell

| Token | Hex | Uso |
|-------|-----|-----|
| `petwell-navy` | `#1e3a5f` | Texto principal, fondos oscuros |
| `petwell-blue` | `#2e86c1` | Color de acento primario |
| `petwell-teal` | `#48c9a9` | Color de acento secundario |
| `petwell-light` | `#e8f4fd` | Fondos suaves |

---

## 📦 Build para producción

```bash
npm run build
npm start
```

## ☁️ Despliegue en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variable de entorno en Vercel:
# NEXT_PUBLIC_API_URL = https://tu-user-service.com/api/v1
```

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Iniciar en producción |
| `npm run lint` | Análisis de código |
