/**
 * VillaKurd - Database Seed Script
 * Run with: pnpm prisma db seed
 */

import { PrismaClient, UserRole, UserStatus, PropertyStatus, PropertyType, CancellationPolicy } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // CLEAN UP (Development only)
  // ============================================
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.analyticsEvent.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.pricingRule.deleteMany();
    await prisma.property.deleteMany();
    await prisma.payout.deleteMany();
    await prisma.walletTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.device.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.propertyAmenity.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.dailyMetric.deleteMany();
    console.log('✅ Cleanup complete');
  }

  // ============================================
  // AMENITIES
  // ============================================
  console.log('🏷️ Creating amenities...');
  const amenities = [
    // Outdoor
    { key: 'pool', nameCkb: 'پۆڵ', nameAr: 'مسبح', nameEn: 'Swimming Pool', nameFa: 'استخر', icon: 'waves', category: 'outdoor', sortOrder: 1 },
    { key: 'bbq', nameCkb: 'باربەکيو', nameAr: 'شواء', nameEn: 'BBQ Grill', nameFa: 'بارب큐', icon: 'flame', category: 'outdoor', sortOrder: 2 },
    { key: 'garden', nameCkb: 'باغ', nameAr: 'حديقة', nameEn: 'Garden', nameFa: 'باغ', icon: 'tree-pine', category: 'outdoor', sortOrder: 3 },
    { key: 'parking', nameCkb: 'پارکینگ', nameAr: 'موقف سيارات', nameEn: 'Parking', nameFa: 'پارکینگ', icon: 'car', category: 'outdoor', sortOrder: 4 },
    { key: 'terrace', nameCkb: 'تەрас', nameAr: 'تراس', nameEn: 'Terrace', nameFa: 'تراس', icon: 'layout-grid', category: 'outdoor', sortOrder: 5 },
    { key: 'playground', nameCkb: 'بازیگە', nameAr: 'منطقة ألعاب', nameEn: 'Playground', nameFa: 'زمین بازی', icon: 'baby', category: 'outdoor', sortOrder: 6 },
    { key: 'ev_charger', nameCkb: 'چارژەر برقی', nameAr: 'شاحن كهربائي', nameEn: 'EV Charger', nameFa: 'شارژر برقی', icon: 'zap', category: 'outdoor', sortOrder: 7 },

    // Indoor
    { key: 'wifi', nameCkb: 'وای‌فای', nameAr: 'واي فاي', nameEn: 'WiFi', nameFa: 'وای‌فای', icon: 'wifi', category: 'indoor', sortOrder: 10 },
    { key: 'ac', nameCkb: 'کولر', nameAr: 'تكييف', nameEn: 'Air Conditioning', nameFa: 'کولر', icon: 'snowflake', category: 'indoor', sortOrder: 11 },
    { key: 'heating', nameCkb: 'گرمایش', nameAr: 'تدفئة', nameEn: 'Heating', nameFa: 'گرمایش', icon: 'thermometer', category: 'indoor', sortOrder: 12 },
    { key: 'kitchen', nameCkb: 'کیتچن', nameAr: 'مطبخ', nameEn: 'Full Kitchen', nameFa: 'آشپزخانه کامل', icon: 'chef-hat', category: 'indoor', sortOrder: 13 },
    { key: 'washer', nameCkb: 'شوێر', nameAr: 'غسالة', nameEn: 'Washing Machine', nameFa: 'ماشین لباسشویی', icon: 'droplets', category: 'indoor', sortOrder: 14 },
    { key: 'dryer', nameCkb: 'خشک‌کن', nameAr: 'مجفف', nameEn: 'Dryer', nameFa: 'ماشین خشک‌کن', icon: 'wind', category: 'indoor', sortOrder: 15 },
    { key: 'dishwasher', nameCkb: 'بەستەری جوان', nameAr: 'غسالة صحون', nameEn: 'Dishwasher', nameFa: 'ماشین ظرفشویی', icon: 'sparkles', category: 'indoor', sortOrder: 16 },
    { key: 'workspace', nameCkb: 'ماڵپەڕی کار', nameAr: 'مساحة عمل', nameEn: 'Workspace', nameFa: 'فضای کار', icon: 'laptop', category: 'indoor', sortOrder: 17 },
    { key: 'tv', nameCkb: 'تەلەفیزیۆن', nameAr: 'تلفزيون', nameEn: 'TV', nameFa: 'تلویزیون', icon: 'tv', category: 'indoor', sortOrder: 18 },
    { key: 'sound_system', nameCkb: 'سیستەمی دەنگ', nameAr: 'نظام صوتي', nameEn: 'Sound System', nameFa: 'سیستم صدا', icon: 'speaker', category: 'indoor', sortOrder: 19 },

    // Safety
    { key: 'security', nameCkb: 'ئاسایش', nameAr: 'أمن', nameEn: 'Security', nameFa: 'امنیت', icon: 'shield', category: 'safety', sortOrder: 20 },
    { key: 'fire_extinguisher', nameCkb: 'دەنگی ئاگر', nameAr: 'طفاية حريق', nameEn: 'Fire Extinguisher', nameFa: 'کپسول آتش‌نشانی', icon: 'flame-kindling', category: 'safety', sortOrder: 21 },
    { key: 'first_aid', nameCkb: 'یارمەتی یەکەم', nameAr: 'إسعافات أولية', nameEn: 'First Aid Kit', nameFa: 'کمک‌های اولیه', icon: 'cross', category: 'safety', sortOrder: 22 },
    { key: 'smoke_detector', nameCkb: 'گەیشتوونی دود', nameAr: 'كاشف دخان', nameEn: 'Smoke Detector', nameFa: 'دودگیر', icon: 'alert-circle', category: 'safety', sortOrder: 23 },

    // Entertainment
    { key: 'games', nameCkb: 'خێزان', nameAr: 'ألعاب', nameEn: 'Board Games', nameFa: 'بازی‌های میزی', icon: 'gamepad-2', category: 'entertainment', sortOrder: 30 },
    { key: 'console', nameCkb: 'کۆنسۆڵ', nameAr: 'وحدة تحكم', nameEn: 'Gaming Console', nameFa: 'کنسول بازی', icon: 'joystick', category: 'entertainment', sortOrder: 31 },
    { key: 'projector', nameCkb: 'پڕۆجەکتۆر', nameAr: 'بروجكتور', nameEn: 'Projector', nameFa: 'پروژه‌ر', icon: 'film', category: 'entertainment', sortOrder: 32 },

    // Pets
    { key: 'pet_friendly', nameCkb: 'هاوڵاتی کەچڵ', nameAr: 'الحيوانات الأليفة', nameEn: 'Pet Friendly', nameFa: 'دوستان حیوانات', icon: 'paw-print', category: 'pets', sortOrder: 40 },
  ];

  for (const amenity of amenities) {
    await prisma.propertyAmenity.upsert({
      where: { key: amenity.key },
      update: amenity,
      create: amenity,
    });
  }
  console.log(`✅ Created ${amenities.length} amenities`);

  // ============================================
  // SYSTEM CONFIGS
  // ============================================
  console.log('⚙️ Creating system configs...');
  const configs = [
    { key: 'platform_commission_percent', value: 12, description: 'Platform commission percentage', isPublic: true },
    { key: 'cleaning_fee_percent', value: 5, description: 'Cleaning fee percentage', isPublic: true },
    { key: 'service_fee_percent', value: 3, description: 'Service fee percentage', isPublic: true },
    { key: 'tax_percent', value: 0, description: 'Tax percentage', isPublic: true },
    { key: 'currency', value: 'IQD', description: 'Default currency', isPublic: true },
    { key: 'default_locale', value: 'ckb', description: 'Default locale', isPublic: true },
    { key: 'supported_locales', value: ['ckb', 'ar', 'en', 'fa'], description: 'Supported locales', isPublic: true },
    { key: 'timezone', value: 'Asia/Baghdad', description: 'Default timezone', isPublic: true },
    { key: 'min_booking_nights', value: 1, description: 'Minimum booking nights', isPublic: true },
    { key: 'max_booking_nights', value: 30, description: 'Maximum booking nights', isPublic: true },
    { key: 'host_approval_required', value: true, description: 'Host must approve bookings', isPublic: false },
    { key: 'instant_booking_enabled', value: true, description: 'Instant booking feature', isPublic: true },
    { key: 'escrow_enabled', value: true, description: 'Escrow payment system', isPublic: true },
    { key: 'review_after_stay_days', value: 14, description: 'Days after stay to allow review', isPublic: false },
    { key: 'auto_cancel_pending_hours', value: 24, description: 'Hours before pending booking auto-cancels', isPublic: false },
    { key: 'payout_schedule', value: 'weekly', description: 'Payout schedule: weekly, monthly', isPublic: false },
    { key: 'min_payout_amount', value: 50000, description: 'Minimum payout amount in IQD', isPublic: false },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description, isPublic: config.isPublic },
      create: config,
    });
  }
  console.log(`✅ Created ${configs.length} system configs`);

  // ============================================
  // USERS (Development)
  // ============================================
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Creating test users...');

    const passwordHash = await bcrypt.hash('password123', 12);

    // Admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@villakurd.com' },
      update: {},
      create: {
        email: 'admin@villakurd.com',
        phone: '+9647501234567',
        passwordHash,
        firstName: 'Admin',
        lastName: 'VillaKurd',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        verificationLevel: 4,
        referralCode: 'ADMIN001',
      },
    });

    // Host users
    const host1 = await prisma.user.upsert({
      where: { email: 'host1@villakurd.com' },
      update: {},
      create: {
        email: 'host1@villakurd.com',
        phone: '+9647501111111',
        passwordHash,
        firstName: 'Ahmed',
        lastName: 'Rashid',
        role: UserRole.HOST,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        verificationLevel: 4,
        referralCode: 'HOST001',
      },
    });

    const host2 = await prisma.user.upsert({
      where: { email: 'host2@villakurd.com' },
      update: {},
      create: {
        email: 'host2@villakurd.com',
        phone: '+9647502222222',
        passwordHash,
        firstName: 'Sara',
        lastName: 'Mohammed',
        role: UserRole.HOST,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        verificationLevel: 4,
        referralCode: 'HOST002',
      },
    });

    // Guest users
    const guest1 = await prisma.user.upsert({
      where: { email: 'guest1@villakurd.com' },
      update: {},
      create: {
        email: 'guest1@villakurd.com',
        phone: '+9647503333333',
        passwordHash,
        firstName: 'Ali',
        lastName: 'Hassan',
        role: UserRole.GUEST,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        verificationLevel: 2,
        referralCode: 'GUEST001',
      },
    });

    const guest2 = await prisma.user.upsert({
      where: { email: 'guest2@villakurd.com' },
      update: {},
      create: {
        email: 'guest2@villakurd.com',
        phone: '+9647504444444',
        passwordHash,
        firstName: 'Fatima',
        lastName: 'Ali',
        role: UserRole.GUEST,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
        phoneVerified: new Date(),
        verificationLevel: 2,
        referralCode: 'GUEST002',
      },
    });

    // Create wallets for all users
    for (const user of [admin, host1, host2, guest1, guest2]) {
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, balance: 0, currency: 'IQD' },
      });
    }

    // Notification preferences
    for (const user of [admin, host1, host2, guest1, guest2]) {
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    console.log('✅ Created test users');

    // ============================================
    // PROPERTIES (Development)
    // ============================================
    console.log('🏠 Creating test properties...');

    const properties = [
      {
        title: 'Luxury Villa with Pool in Erbil',
        slug: 'luxury-villa-pool-erbil',
        description: 'Beautiful luxury villa with private pool, garden, and BBQ area. Perfect for family vacations.',
        shortDescription: 'Luxury villa with pool & garden in Erbil',
        type: PropertyType.VILLA,
        status: PropertyStatus.ACTIVE,
        governorate: 'Erbil',
        district: 'Ankawa',
        neighborhood: 'Italian Village',
        address: 'Italian Village, Ankawa, Erbil',
        latitude: 36.1911,
        longitude: 44.0093,
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        beds: 5,
        areaSqm: 350,
        basePriceNightly: 250000,
        cleaningFee: 30000,
        serviceFee: 15000,
        securityDeposit: 100000,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        minNights: 1,
        maxNights: 30,
        instantBook: true,
        cancellationPolicy: CancellationPolicy.MODERATE,
        amenities: ['pool', 'bbq', 'garden', 'wifi', 'ac', 'kitchen', 'washer', 'parking', 'security', 'tv', 'sound_system'],
        coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
        ],
        featured: true,
        hostId: host1.id,
      },
      {
        title: 'Cozy Chalet in Sulaymaniyah Mountains',
        slug: 'cozy-chalet-sulaymaniyah',
        description: 'Charming mountain chalet with fireplace, stunning views, and hiking trails nearby.',
        shortDescription: 'Mountain chalet with fireplace & views',
        type: PropertyType.CHALET,
        status: PropertyStatus.ACTIVE,
        governorate: 'Sulaymaniyah',
        district: 'Piramagrun',
        neighborhood: 'Mountain View',
        address: 'Piramagrun Mountain, Sulaymaniyah',
        latitude: 35.5650,
        longitude: 45.4333,
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        beds: 4,
        areaSqm: 200,
        basePriceNightly: 180000,
        cleaningFee: 25000,
        serviceFee: 12000,
        securityDeposit: 80000,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        minNights: 2,
        maxNights: 14,
        instantBook: false,
        cancellationPolicy: CancellationPolicy.FLEXIBLE,
        amenities: ['fireplace', 'heating', 'wifi', 'kitchen', 'washer', 'parking', 'tv', 'games', 'pet_friendly'],
        coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
        images: [
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
          'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',
        ],
        featured: true,
        hostId: host2.id,
      },
      {
        title: 'Modern Villa in Duhok City Center',
        slug: 'modern-villa-duhok-center',
        description: 'Modern luxury villa in heart of Duhok, walking distance to markets and restaurants.',
        shortDescription: 'Modern villa in Duhok center',
        type: PropertyType.VILLA,
        status: PropertyStatus.ACTIVE,
        governorate: 'Duhok',
        district: 'Duhok Center',
        neighborhood: 'Azadi',
        address: 'Azadi Street, Duhok',
        latitude: 36.8676,
        longitude: 42.9891,
        maxGuests: 10,
        bedrooms: 5,
        bathrooms: 4,
        beds: 6,
        areaSqm: 400,
        basePriceNightly: 300000,
        cleaningFee: 40000,
        serviceFee: 20000,
        securityDeposit: 150000,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        minNights: 1,
        maxNights: 30,
        instantBook: true,
        cancellationPolicy: CancellationPolicy.STRICT,
        amenities: ['pool', 'bbq', 'garden', 'wifi', 'ac', 'heating', 'kitchen', 'washer', 'dryer', 'dishwasher', 'parking', 'security', 'ev_charger', 'workspace', 'tv', 'sound_system', 'console'],
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        ],
        featured: true,
        hostId: host1.id,
      },
      {
        title: 'Traditional Cottage in Halabja',
        slug: 'traditional-cottage-halabja',
        description: 'Authentic Kurdish cottage with traditional architecture, modern amenities, and mountain views.',
        shortDescription: 'Traditional Kurdish cottage in Halabja',
        type: PropertyType.COTTAGE,
        status: PropertyStatus.ACTIVE,
        governorate: 'Halabja',
        district: 'Halabja Center',
        neighborhood: 'Old Town',
        address: 'Old Town, Halabja',
        latitude: 35.1814,
        longitude: 45.9892,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        beds: 2,
        areaSqm: 120,
        basePriceNightly: 120000,
        cleaningFee: 20000,
        serviceFee: 10000,
        securityDeposit: 50000,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        minNights: 1,
        maxNights: 30,
        instantBook: true,
        cancellationPolicy: CancellationPolicy.FLEXIBLE,
        amenities: ['garden', 'wifi', 'heating', 'kitchen', 'washer', 'parking', 'fireplace', 'tv', 'pet_friendly'],
        coverImage: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
        images: [
          'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
        ],
        featured: false,
        hostId: host2.id,
      },
    ];

    for (const prop of properties) {
      await prisma.property.create({
        data: {
          ...prop,
          availability: {
            create: generateAvailability(prop.id),
          },
        },
      });
    }

    console.log(`✅ Created ${properties.length} test properties`);

    // ============================================
    // BOOKINGS (Development)
    // ============================================
    console.log('📅 Creating test bookings...');

    const now = new Date();
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const bookings = [
      {
        bookingNumber: 'VK-2026-000001',
        status: 'COMPLETED',
        checkIn: futureDate(-30),
        checkOut: futureDate(-28),
        nights: 2,
        adults: 4,
        children: 1,
        basePrice: 500000,
        cleaningFee: 30000,
        serviceFee: 15000,
        taxes: 0,
        discount: 0,
        totalPrice: 545000,
        platformFeePercent: 12,
        platformFee: 65400,
        hostPayout: 479600,
        guestId: guest1.id,
        propertyId: (await prisma.property.findFirst({ where: { slug: 'luxury-villa-pool-erbil' } }))!.id,
        hostId: host1.id,
        confirmedAt: futureDate(-35),
        completedAt: futureDate(-28),
      },
      {
        bookingNumber: 'VK-2026-000002',
        status: 'CONFIRMED',
        checkIn: futureDate(10),
        checkOut: futureDate(13),
        nights: 3,
        adults: 2,
        children: 0,
        basePrice: 540000,
        cleaningFee: 25000,
        serviceFee: 12000,
        taxes: 0,
        discount: 0,
        totalPrice: 577000,
        platformFeePercent: 12,
        platformFee: 69240,
        hostPayout: 507760,
        guestId: guest2.id,
        propertyId: (await prisma.property.findFirst({ where: { slug: 'cozy-chalet-sulaymaniyah' } }))!.id,
        hostId: host2.id,
        confirmedAt: futureDate(5),
      },
      {
        bookingNumber: 'VK-2026-000003',
        status: 'PENDING',
        checkIn: futureDate(20),
        checkOut: futureDate(22),
        nights: 2,
        adults: 6,
        children: 2,
        basePrice: 600000,
        cleaningFee: 40000,
        serviceFee: 20000,
        taxes: 0,
        discount: 50000,
        totalPrice: 610000,
        platformFeePercent: 12,
        platformFee: 73200,
        hostPayout: 536800,
        guestId: guest1.id,
        propertyId: (await prisma.property.findFirst({ where: { slug: 'modern-villa-duhok-center' } }))!.id,
        hostId: host1.id,
      },
    ];

    for (const booking of bookings) {
      await prisma.booking.create({ data: booking });
    }

    console.log(`✅ Created ${bookings.length} test bookings`);

    // ============================================
    // REVIEWS (Development)
    // ============================================
    console.log('⭐ Creating test reviews...');

    const completedBooking = await prisma.booking.findFirst({ where: { bookingNumber: 'VK-2026-000001' } });
    if (completedBooking) {
      await prisma.review.create({
        data: {
          bookingId: completedBooking.id,
          authorId: guest1.id,
          recipientId: host1.id,
          propertyId: completedBooking.propertyId,
          rating: 5,
          cleanliness: 5,
          accuracy: 5,
          checkin: 5,
          communication: 5,
          location: 5,
          value: 5,
          comment: 'Amazing villa! The pool was perfect for kids, host was very responsive. Highly recommended!',
          isVerifiedStay: true,
          isPublic: true,
        },
      });
    }

    console.log('✅ Created test reviews');
  }

  console.log('🎉 Database seed completed successfully!');
}

function generateAvailability(propertyId: string) {
  const availabilities = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Generate 1 year of availability
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Randomly block some dates (5% chance)
    const isAvailable = Math.random() > 0.05;

    availabilities.push({
      propertyId,
      date,
      isAvailable,
      priceOverride: null,
      note: null,
    });
  }

  return availabilities;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });