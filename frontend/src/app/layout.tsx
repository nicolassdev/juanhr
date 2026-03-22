import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'JuanHR v3 — OJT HR System',
  description: 'OJT HR & Attendance System with DTR tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#121828',
              color: '#dde3f0',
              border: '1px solid #1e2740',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#00d4ff', secondary: '#080b12' } },
            error: { iconTheme: { primary: '#ff5050', secondary: '#080b12' } },
          }}
        />
      </body>
    </html>
  );
}
