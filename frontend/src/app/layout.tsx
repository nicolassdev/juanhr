import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "JuanHR v3 — OJT HR System",
  description: "OJT HR & Attendance System with DTR tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Inline script prevents flash of wrong theme on first load */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            var t = localStorage.getItem('theme');
            if(t === 'light') document.documentElement.classList.add('light');
          })();
        `,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--card-bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "13px",
            },
            success: {
              iconTheme: { primary: "#00d4ff", secondary: "#080b12" },
            },
            error: { iconTheme: { primary: "#ff5050", secondary: "#080b12" } },
          }}
        />
      </body>
    </html>
  );
}
