import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ProfileContent, type ProfileUser, type ProfileDocument, type ApplicationRow, type DownloadItem } from "./profile-content"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!user) redirect("/login")

  // Derive account type
  let userTypes: string[] = []
  try { userTypes = JSON.parse(user.userTypes || "[]") } catch {}
  const accountType = ["ADMIN", "SUPER_ADMIN"].includes(user.role)
    ? "ADMIN"
    : (userTypes[0] ?? "STUDENT")

  // Fetch all application types in parallel
  const [apps, studyApps, visaApps, scholApps] = await Promise.all([
    db.application.findMany({
      where: { userId: session.user.id },
      include: { opportunity: { select: { title: true, type: true, organization: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.studyApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.visaApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.scholarshipApplication.findMany({
      where: { userId: session.user.id },
      include: { scholarship: { select: { title: true, level: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Collect downloadable admin-generated files
  const downloads: DownloadItem[] = []
  for (const a of apps) {
    if (a.admissionLetter) downloads.push({ label: `Admission Letter — ${a.opportunity.title}`, url: a.admissionLetter, date: a.updatedAt.toISOString() })
    if (a.offerLetter)     downloads.push({ label: `Offer Letter — ${a.opportunity.title}`,     url: a.offerLetter,     date: a.updatedAt.toISOString() })
  }
  for (const s of studyApps) {
    if (s.admissionLetter)   downloads.push({ label: `Admission Letter — Study in China (${s.degreeLevel})`, url: s.admissionLetter,   date: s.updatedAt.toISOString() })
    if (s.preAdmissionOffer) downloads.push({ label: `Pre-Admission Offer — ${s.degreeLevel}`,               url: s.preAdmissionOffer, date: s.updatedAt.toISOString() })
  }

  // Build unified application rows
  const applicationRows: ApplicationRow[] = [
    ...apps.map(a => ({
      id: a.id, kind: "application" as const,
      title: a.opportunity.title,
      org: a.opportunity.organization,
      oppType: a.opportunity.type,
      status: a.status,
      date: a.createdAt.toISOString(),
      href: `/dashboard/applications/${a.id}`,
    })),
    ...studyApps.map(s => ({
      id: s.id, kind: "study" as const,
      title: `Study in China — ${s.degreeLevel}`,
      org: s.preferredUniversities ?? "EA Trade Link",
      oppType: "SCHOLARSHIP",
      status: s.status,
      date: s.createdAt.toISOString(),
      href: `/dashboard/applications/${s.id}`,
    })),
    ...visaApps.map(v => ({
      id: v.id, kind: "visa" as const,
      title: "Business Visa Application",
      org: v.companyName ?? "EA Trade Link",
      oppType: "BUSINESS_VISA",
      status: v.status,
      date: v.createdAt.toISOString(),
      href: `/dashboard/applications/${v.id}`,
    })),
    ...scholApps.map(sc => ({
      id: sc.id, kind: "scholarship" as const,
      title: sc.scholarship.title,
      org: `${sc.scholarship.level} Scholarship`,
      oppType: "SCHOLARSHIP",
      status: sc.status,
      date: sc.createdAt.toISOString(),
      href: `/dashboard/applications/${sc.id}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const profileUser: ProfileUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    nationality: user.nationality,
    address: user.address ?? null,
    image: user.image,
    userTypes,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }

  const profileDocs: ProfileDocument[] = user.documents.map(d => ({
    id: d.id,
    documentType: d.documentType,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    isVerified: d.isVerified,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <ProfileContent
      user={profileUser}
      accountType={accountType}
      documents={profileDocs}
      applicationRows={applicationRows}
      downloads={downloads}
    />
  )
}
