import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'PetWell – Servicios Veterinarios y Cuidado Animal',
  description:
    'Plataforma de gestión veterinaria profesional. Gestiona tus mascotas, citas y registros médicos en un solo lugar.',
  keywords: ['veterinaria', 'mascotas', 'cuidado animal', 'gestión veterinaria', 'PetWell'],
  authors: [{ name: 'PetWell' }],
  openGraph: {
    title: 'PetWell – Servicios Veterinarios y Cuidado Animal',
    description: 'Plataforma de gestión veterinaria profesional.',
    type: 'website',
    locale: 'es_CO',
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head><meta charSet="utf-8" /></head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
