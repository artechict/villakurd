import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Arabic, Vazirmatn } from 'next/font/google';
import '@/styles/globals.css';
import { getTranslations } from 'next-intl/server';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-sans-arabic',
  display: 'swap',
});

const vazirmatn = Vazirmatn({
  subsets: ['latin', 'arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VillaKurd - Villa Rental Marketplace in Kurdistan',
    template: '%s | VillaKurd',
  },
  description: 'Book verified villas in Erbil, Sulaymaniyah, Duhok, and Halabja. Secure payments, escrow protection, and free professional photography for hosts.',
  keywords: ['villa rental', 'Kurdistan', 'Erbil', 'Sulaymaniyah', 'Duhok', 'Halabja', 'vacation rental', 'booking'],
  authors: [{ name: 'VillaKurd' }],
  creator: 'VillaKurd',
  publisher: 'VillaKurd',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ckb_IQ',
    alternateLocales: ['ar_IQ', 'en_US', 'fa_IR'],
    url: 'https://villakurd.com',
    siteName: 'VillaKurd',
    title: 'VillaKurd - Villa Rental Marketplace in Kurdistan',
    description: 'Book verified villas in Kurdistan Iraq. Secure payments, escrow protection.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VillaKurd - Luxury Villas in Kurdistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VillaKurd - Villa Rental Marketplace',
    description: 'Book verified villas in Kurdistan Iraq',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations('layout');
  const isRTL = ['ckb', 'ar', 'fa'].includes(locale);
  const dir = isRTL ? 'rtl' : 'ltr';
  const lang = locale === 'ckb' ? 'ckb' : locale;

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${notoSansArabic.variable} ${vazirmatn.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.villakurd.com" />
        <link rel="dns-prefetch" href="https://images.villakurd.com" />
      </head>
      <body className={`font-sans antialiased ${isRTL ? 'rtl' : 'ltr'}`}>
        {children}
      </body>
    </html>
  );
}