import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getActiveCountries, getActiveSports } from "@/lib/feeds";
import { getCountry } from "@/data/countries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PULSE — Sports News",
  description: "Sports news aggregator across countries and leagues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const countryCodes = getActiveCountries();
  const navItems = countryCodes.map((code) => {
    const country = getCountry(code);
    const sports = getActiveSports(code);
    return {
      code: country.code,
      name: country.name,
      flag: country.flag,
      sports,
    };
  });

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Sidebar navItems={navItems} />
        <main className="lg:pl-64 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
