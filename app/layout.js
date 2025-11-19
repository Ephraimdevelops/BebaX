import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BebaX - Uber for Moving Trucks',
  description: 'Connect with verified drivers for all your moving needs in Tanzania',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}