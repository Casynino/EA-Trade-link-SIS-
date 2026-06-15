import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding EA Trade Link SIS...")

  // ─── Users ──────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@eatradelink.com" },
    update: {},
    create: {
      name: "EA Trade Link Admin",
      email: "admin@eatradelink.com",
      password: adminPw,
      role: "SUPER_ADMIN",
      userTypes: JSON.stringify(["OTHER"]),
      emailVerified: new Date(),
    },
  })

  const studentPw = await bcrypt.hash("student123!", 12)
  await prisma.user.upsert({
    where: { email: "student@demo.com" },
    update: {},
    create: {
      name: "Amina Hassan",
      email: "student@demo.com",
      password: studentPw,
      role: "USER",
      userTypes: JSON.stringify(["STUDENT"]),
      emailVerified: new Date(),
      nationality: "Tanzania",
      phone: "+255712345678",
    },
  })

  const bizPw = await bcrypt.hash("business123!", 12)
  await prisma.user.upsert({
    where: { email: "business@demo.com" },
    update: {},
    create: {
      name: "John Msigwa",
      email: "business@demo.com",
      password: bizPw,
      role: "USER",
      userTypes: JSON.stringify(["BUSINESS"]),
      emailVerified: new Date(),
      nationality: "Tanzania",
      phone: "+255787654321",
    },
  })

  const jobPw = await bcrypt.hash("jobseeker123!", 12)
  await prisma.user.upsert({
    where: { email: "jobseeker@demo.com" },
    update: {},
    create: {
      name: "David Kamau",
      email: "jobseeker@demo.com",
      password: jobPw,
      role: "USER",
      userTypes: JSON.stringify(["JOB_SEEKER"]),
      emailVerified: new Date(),
      nationality: "Tanzania",
      phone: "+255722111222",
    },
  })

  // ─── Exchange rate ───────────────────────────────────────────────────────────
  await prisma.exchangeRate.upsert({
    where: { id: "default-rate" },
    update: {},
    create: {
      id: "default-rate",
      rmbToTzs: 390.5,
      tzsToRmb: 0.00256,
      notes: "Initial rate",
    },
  })

  // ─── Opportunities ───────────────────────────────────────────────────────────
  const opportunities = [
    // ── SCHOLARSHIPS ──
    {
      type: "SCHOLARSHIP",
      title: "Chinese Government Scholarship (CSC) – Bachelor 2025",
      organization: "Beijing Normal University",
      location: "Beijing, China",
      description: "Full scholarship for undergraduate studies at one of China's top universities. Covers tuition, accommodation, and monthly living allowance. Open to Tanzanian students with excellent academic records.",
      requirements: "GPA 3.0+, Age 17–25, High school certificate, English/Chinese proficiency, Medical certificate",
      benefits: "Full tuition, accommodation, ¥2,500/month living allowance, annual flight ticket",
      deadline: new Date("2025-03-31"),
      startDate: new Date("2025-09-01"),
      degreeLevel: "BACHELOR",
      fieldOfStudy: "Engineering, Sciences, Medicine, Business, Arts",
      minGpa: 3.0,
      coverageType: "Full",
      tuitionCovered: true,
      livingAllowance: true,
      flightTicket: true,
      slots: 10,
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["STUDENT", "ALL"]),
      tags: JSON.stringify(["scholarship", "bachelor", "full-funded", "china"]),
    },
    {
      type: "SCHOLARSHIP",
      title: "Tsinghua University Master's Scholarship 2025",
      organization: "Tsinghua University",
      location: "Beijing, China",
      description: "Prestigious full scholarship for master's degree at Tsinghua University — ranked #1 in Asia. Programs in Engineering, Computer Science, Business, and Economics.",
      requirements: "Bachelor's degree, GPA 3.2+, Age under 35, Research proposal, Two recommendation letters",
      benefits: "Full tuition, accommodation, ¥3,000/month stipend, annual flight ticket",
      deadline: new Date("2025-03-31"),
      startDate: new Date("2025-09-01"),
      degreeLevel: "MASTER",
      fieldOfStudy: "Engineering, Computer Science, Business, Economics",
      minGpa: 3.2,
      coverageType: "Full",
      tuitionCovered: true,
      livingAllowance: true,
      flightTicket: true,
      slots: 5,
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["STUDENT"]),
      tags: JSON.stringify(["scholarship", "master", "tsinghua", "full-funded"]),
    },
    {
      type: "SCHOLARSHIP",
      title: "Confucius Institute Chinese Language Scholarship",
      organization: "Yunnan Normal University",
      location: "Kunming, China",
      description: "1-year Mandarin language scholarship through the Confucius Institute network. No prior Chinese required. Perfect stepping stone to longer-term study in China.",
      requirements: "Age 18–45, High school minimum, No Chinese background needed",
      benefits: "Tuition, accommodation, ¥1,400/month allowance",
      deadline: new Date("2025-05-31"),
      startDate: new Date("2025-09-01"),
      degreeLevel: "LANGUAGE",
      minGpa: 2.5,
      coverageType: "Full",
      tuitionCovered: true,
      livingAllowance: true,
      flightTicket: false,
      slots: 15,
      imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
      isFeatured: false,
      targetAudience: JSON.stringify(["STUDENT", "ALL"]),
      tags: JSON.stringify(["scholarship", "language", "chinese", "beginner"]),
    },
    {
      type: "SCHOLARSHIP",
      title: "FOCAC African Talent PhD Scholarship",
      organization: "Fudan University",
      location: "Shanghai, China",
      description: "Under the Forum on China-Africa Cooperation, Fudan University offers fully-funded PhD positions for outstanding African scholars in Medicine, Public Health, and Sciences.",
      requirements: "Master's degree, GPA 3.5+, Research publications preferred, Age under 45",
      benefits: "Full tuition, accommodation, ¥3,500/month stipend, annual round-trip flight",
      deadline: new Date("2025-04-15"),
      startDate: new Date("2025-09-01"),
      degreeLevel: "PHD",
      fieldOfStudy: "Medicine, Public Health, Sciences, Engineering",
      minGpa: 3.5,
      coverageType: "Full",
      tuitionCovered: true,
      livingAllowance: true,
      flightTicket: true,
      slots: 3,
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["STUDENT"]),
      tags: JSON.stringify(["scholarship", "phd", "focac", "africa", "full-funded"]),
    },

    // ── JOBS ──
    {
      type: "JOB",
      title: "Skilled Technician – Electronics Assembly",
      organization: "Shenzhen TechFab Co. Ltd",
      location: "Shenzhen, China",
      description: "We are hiring skilled technicians for our electronics assembly lines. Candidates must have basic technical training. Full on-the-job training provided. Housing included.",
      requirements: "Secondary education minimum, Technical training preferred, Age 22–35, Clean health record",
      benefits: "¥6,000–8,000/month, Free housing, Free meals, Annual flight home",
      salary: "¥6,000–8,000/month",
      jobType: "SKILLED",
      contractDuration: "2 years renewable",
      slots: 20,
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["JOB_SEEKER", "ALL"]),
      tags: JSON.stringify(["job", "factory", "technician", "shenzhen", "electronics"]),
    },
    {
      type: "JOB",
      title: "Factory Supervisor – Textile Production",
      organization: "Guangzhou Fabric Industries",
      location: "Guangzhou, China",
      description: "Experienced factory supervisors needed for our textile production facility. Manage a team of 20–30 workers, oversee quality control, and coordinate with management.",
      requirements: "3+ years factory/supervisor experience, Leadership skills, English communication, Age 25–45",
      benefits: "¥8,000–12,000/month, Accommodation, Insurance, Annual bonus",
      salary: "¥8,000–12,000/month",
      jobType: "SKILLED",
      contractDuration: "2 years",
      slots: 5,
      imageUrl: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&auto=format&fit=crop",
      isFeatured: false,
      targetAudience: JSON.stringify(["JOB_SEEKER"]),
      tags: JSON.stringify(["job", "supervisor", "textile", "guangzhou"]),
    },
    {
      type: "JOB",
      title: "Internship Program – International Trade",
      organization: "Yiwu International Trade Center",
      location: "Yiwu, China",
      description: "6-month paid internship program for young African professionals at the world's largest small commodities market. Learn import-export, trade negotiations, and supplier relations.",
      requirements: "University degree (any field), Age 22–30, English proficiency, Business interest",
      benefits: "¥3,000/month stipend, Accommodation, Trade certification on completion",
      salary: "¥3,000/month + accommodation",
      jobType: "INTERNSHIP",
      contractDuration: "6 months",
      slots: 10,
      imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["JOB_SEEKER", "STUDENT", "ALL"]),
      tags: JSON.stringify(["internship", "trade", "yiwu", "africa"]),
    },

    // ── EVENTS ──
    {
      type: "CANTON_FAIR",
      title: "136th Canton Fair – Phase 1 (Electronics & Machinery)",
      organization: "China Import and Export Fair",
      location: "Guangzhou, China",
      description: "The Canton Fair is China's largest and most comprehensive trade fair. Phase 1 covers Electronics, Hardware, Machinery. Meet 25,000+ Chinese exporters, discover new products, negotiate deals.",
      requirements: "Business registration preferred, Passport, Invitation letter required (we arrange it)",
      eventDates: "October 15–19, 2025",
      venue: "Canton Fair Complex, Guangzhou",
      registrationFee: "Free (service fee applies)",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["BUSINESS", "ALL"]),
      tags: JSON.stringify(["canton-fair", "trade", "electronics", "guangzhou", "2025"]),
    },
    {
      type: "TRADE_EXHIBITION",
      title: "China International SME Expo 2025",
      organization: "CISMEF",
      location: "Guangzhou, China",
      description: "Annual trade expo connecting African buyers with Chinese SMEs across manufacturing, agriculture, and technology sectors. Includes B2B meeting arrangements.",
      requirements: "Business owner or representative",
      eventDates: "November 5–8, 2025",
      venue: "Guangzhou International Convention Centre",
      registrationFee: "$50 (waived with EA Trade Link)",
      imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
      isFeatured: false,
      targetAudience: JSON.stringify(["BUSINESS"]),
      tags: JSON.stringify(["exhibition", "sme", "trade", "china-africa"]),
    },
    {
      type: "CONFERENCE",
      title: "Forum on China-Africa Cooperation (FOCAC) Business Summit",
      organization: "China Council for the Promotion of International Trade",
      location: "Beijing, China",
      description: "High-level business conference bringing together African entrepreneurs and Chinese companies to forge partnerships in infrastructure, technology, and agriculture.",
      requirements: "Established business, Invitation required",
      eventDates: "September 2025",
      venue: "China National Convention Center, Beijing",
      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["BUSINESS"]),
      tags: JSON.stringify(["conference", "focac", "china-africa", "business"]),
    },

    // ── FACTORY VISIT ──
    {
      type: "FACTORY_VISIT",
      title: "Yiwu Small Commodities Market Factory Tour",
      organization: "EA Trade Link",
      location: "Yiwu, Zhejiang, China",
      description: "5-day organized factory visit to Yiwu — the world's largest wholesale market. Visit 10+ factories, meet suppliers directly, negotiate deals. Includes interpreter and transport.",
      requirements: "Business owner or buyer, Minimum order intention",
      benefits: "Accommodation, Transport, Interpreter, Factory verification report",
      visitDuration: "5 days",
      groupSizeMax: 15,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["BUSINESS", "ALL"]),
      tags: JSON.stringify(["factory-visit", "yiwu", "wholesale", "sourcing"]),
    },
    {
      type: "FACTORY_VISIT",
      title: "Guangzhou Electronics Factory Tour",
      organization: "EA Trade Link",
      location: "Guangzhou / Shenzhen, China",
      description: "3-day electronics factory tour covering Huaqiangbei Electronics Market and 5 major factories. Perfect for importers of phones, accessories, solar, and electrical goods.",
      requirements: "Importer or business buyer",
      benefits: "Ground transport, Interpreter, Supplier contacts, Quotation support",
      visitDuration: "3 days",
      groupSizeMax: 10,
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop",
      isFeatured: false,
      targetAudience: JSON.stringify(["BUSINESS"]),
      tags: JSON.stringify(["factory-visit", "electronics", "shenzhen", "guangzhou"]),
    },

    // ── BUSINESS VISA ──
    {
      type: "BUSINESS_VISA",
      title: "China Business Visa (M Visa) Service",
      organization: "EA Trade Link",
      location: "Chinese Embassy, Dar es Salaam",
      description: "Complete China business visa (M Visa) processing service. We handle everything — from invitation letter to embassy submission. Fast-track available.",
      requirements: "Valid passport (6+ months), Business purpose, Company documents",
      benefits: "Full application support, Invitation letter arrangement, Embassy liaison",
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop",
      isFeatured: true,
      targetAudience: JSON.stringify(["BUSINESS", "ALL"]),
      tags: JSON.stringify(["visa", "business-visa", "china", "m-visa"]),
    },
  ]

  for (const opp of opportunities) {
    await prisma.opportunity.create({ data: opp as never })
  }

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Demo Accounts:")
  console.log("  Admin:      admin@eatradelink.com  / admin123!")
  console.log("  Student:    student@demo.com        / student123!")
  console.log("  Business:   business@demo.com       / business123!")
  console.log("  Job Seeker: jobseeker@demo.com      / jobseeker123!")
  console.log(`\n🎯 Created ${opportunities.length} opportunities`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
