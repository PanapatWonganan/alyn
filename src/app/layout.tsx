import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "อลิน — แพลตฟอร์มนิยายออนไลน์",
    template: "%s | อลิน",
  },
  description: "อลิน (Alyn) แพลตฟอร์มอ่านและเขียนนิยายออนไลน์คุณภาพ โรแมนติก แฟนตาซี สยองขวัญ และอีกมากมาย",
  keywords: ["นิยายออนไลน์", "อ่านนิยาย", "เขียนนิยาย", "นิยายไทย", "อลิน", "Alyn"],
  authors: [{ name: "Alyn" }],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "อลิน",
    title: "อลิน — แพลตฟอร์มนิยายออนไลน์",
    description: "แพลตฟอร์มอ่านและเขียนนิยายออนไลน์คุณภาพ",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo/Text_Primary.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('alyn_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
