import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations('home.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

const stats = [
  { key: 'villas', labelKey: 'stats.villas', value: '500+' },
  { key: 'bookings', labelKey: 'stats.bookings', value: '10,000+' },
  { key: 'hosts', labelKey: 'stats.hosts', value: '300+' },
  { key: 'rating', labelKey: 'stats.rating', value: '4.9/5' },
];

const features = [
  {
    key: 'verified',
    icon: 'shield-check',
    titleKey: 'features.verified.title',
    descKey: 'features.verified.desc',
  },
  {
    key: 'escrow',
    icon: 'lock',
    titleKey: 'features.escrow.title',
    descKey: 'features.escrow.desc',
  },
  {
    key: 'photography',
    icon: 'camera',
    titleKey: 'features.photography.title',
    descKey: 'features.photography.desc',
  },
  {
    key: 'support',
    icon: 'headphones',
    titleKey: 'features.support.title',
    descKey: 'features.support.desc',
  },
];

const locations = [
  { key: 'erbil', nameKey: 'locations.erbil', image: '/images/erbil.jpg', villas: 180 },
  { key: 'sulaymaniyah', nameKey: 'locations.sulaymaniyah', image: '/images/sulaymaniyah.jpg', villas: 150 },
  { key: 'duhok', nameKey: 'locations.duhok', image: '/images/duhok.jpg', villas: 100 },
  { key: 'halabja', nameKey: 'locations.halabja', image: '/images/halabja.jpg', villas: 70 },
];

export default async function HomePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('home');
  const isRTL = ['ckb', 'ar', 'fa'].includes(params.locale);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary-50 via-white to-secondary-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-secondary-900/20">
        <div className="absolute inset-0 bg-[url('/patterns/mesh-gradient.svg')] opacity-50" aria-hidden="true" />

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              {t('badge')}
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {t('hero.title')}
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Link
                href={`/${params.locale}/villas`}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {t('hero.cta.primary')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href={`/${params.locale}/host`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {t('hero.cta.secondary')}
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-16 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Link
              href={`/${params.locale}/villas`}
              className="block group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] transition-shadow duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 relative">
                    <label htmlFor="location" className="sr-only">{t('search.location')}</label>
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      id="location"
                      placeholder={t('search.locationPlaceholder')}
                      className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      readOnly
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor="checkin" className="sr-only">{t('search.checkIn')}</label>
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      id="checkin"
                      className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor="checkout" className="sr-only">{t('search.checkOut')}</label>
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      id="checkout"
                      className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    />
                  </div>
                  <button
                    type="submit"
                    className="col-span-1 md:col-span-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{t('search.button')}</span>
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.key} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <article
                key={feature.key}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-all duration-300">
                  <FeatureIcon name={feature.icon} className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t('locations.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('locations.subtitle')}
              </p>
            </div>
            <Link
              href={`/${params.locale}/locations`}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t('locations.viewAll')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {locations.map((location, index) => (
              <Link
                key={location.key}
                href={`/${params.locale}/villas?governorate=${location.key}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                     style={{ backgroundImage: `url(${location.image})` }}
                     aria-hidden="true" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {t(location.nameKey)}
                  </h3>
                  <p className="text-white/80 text-lg">
                    {location.villas} {t('locations.villas')}
                  </p>
                </div>
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white/90 dark:bg-gray-900/90 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {t('locations.explore')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${params.locale}/villas`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-primary-600 bg-white hover:bg-primary-50 rounded-xl transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                {t('cta.buttonGuest')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href={`/${params.locale}/host`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-primary-700 hover:bg-primary-800 border-2 border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                {t('cta.buttonHost')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href={`/${params.locale}`} className="inline-block mb-6">
                <span className="text-2xl font-bold text-white">VillaKurd</span>
              </Link>
              <p className="text-gray-400 text-lg max-w-md mb-6">
                {t('footer.description')}
              </p>
              <div className="flex gap-4">
                <a href="https://facebook.com/villakurd" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://instagram.com/villakurd" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.44-.645 1.44-1.44-.645-1.44-1.44-1.44z"/></svg>
                </a>
                <a href="https://twitter.com/villakurd" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
                <a href="https://linkedin.com/company/villakurd" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">{t('footer.forGuests')}</h4>
              <nav className="space-y-3">
                <Link href={`/${params.locale}/villas`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.browseVillas')}</Link>
                <Link href={`/${params.locale}/how-it-works`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.howItWorks')}</Link>
                <Link href={`/${params.locale}/safety`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.safety')}</Link>
                <Link href={`/${params.locale}/cancellation-policies`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.cancellation')}</Link>
                <Link href={`/${params.locale}/help`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.helpCenter')}</Link>
              </nav>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">{t('footer.forHosts')}</h4>
              <nav className="space-y-3">
                <Link href={`/${params.locale}/host`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.listProperty')}</Link>
                <Link href={`/${params.locale}/host/pricing`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.pricing')}</Link>
                <Link href={`/${params.locale}/host/photography`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.photography')}</Link>
                <Link href={`/${params.locale}/host/verification`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.verification')}</Link>
                <Link href={`/${params.locale}/host/dashboard`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.hostDashboard')}</Link>
              </nav>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">{t('footer.company')}</h4>
              <nav className="space-y-3">
                <Link href={`/${params.locale}/about`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.about')}</Link>
                <Link href={`/${params.locale}/careers`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.careers')}</Link>
                <Link href={`/${params.locale}/press`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.press')}</Link>
                <Link href={`/${params.locale}/terms`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.terms')}</Link>
                <Link href={`/${params.locale}/privacy`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.privacy')}</Link>
                <Link href={`/${params.locale}/contact`} className="text-gray-400 hover:text-white transition-colors block">{t('footer.contact')}</Link>
              </nav>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} VillaKurd. {t('footer.rightsReserved')}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <select className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Language">
                <option value="ckb">Kurdish (Sorani)</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fa">فارسی</option>
              </select>
              <select className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Currency">
                <option value="IQD">IQD - Iraqi Dinar</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    'shield-check': (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'lock': (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    'camera': (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'headphones': (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  };
  return icons[name] || icons['shield-check'];
}