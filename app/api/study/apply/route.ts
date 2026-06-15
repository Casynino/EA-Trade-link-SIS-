import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()

    const {
      degreeLevel, fieldOfStudy, intendedMajor, preferredIntake, preferredUniversities,
      fullName, gender, nationality, passportNumber, passportExpiry, dateOfBirth,
      phone, contactEmail, homeAddress,
      currentEducation, institutionName, graduationYear, gpa,
      englishProficiency, chineseProficiency, languageLevel,
      documentsJson,
    } = body

    if (!degreeLevel || !fullName || !nationality || !phone || !contactEmail || !currentEducation || !intendedMajor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = session?.user?.id ?? null

    if (!userId) {
      return NextResponse.json({
        success: true,
        message: "Application received. Please create an account to track your application.",
      })
    }

    // Check for duplicate
    const existing = await db.studyApplication.findFirst({
      where: { userId, degreeLevel },
    })
    if (existing) {
      return NextResponse.json({ error: "You already have a study application for this program. Check your dashboard." }, { status: 409 })
    }

    const app = await db.studyApplication.create({
      data: {
        userId,
        degreeLevel,
        fieldOfStudy: fieldOfStudy || intendedMajor,
        intendedMajor: intendedMajor || null,
        preferredIntake: preferredIntake || null,
        preferredUniversities: preferredUniversities || null,
        fullName,
        gender: gender || null,
        nationality,
        passportNumber: passportNumber || null,
        passportExpiry: passportExpiry || null,
        dateOfBirth: dateOfBirth || null,
        phone,
        contactEmail,
        homeAddress: homeAddress || null,
        currentEducation,
        institutionName: institutionName || null,
        graduationYear: graduationYear || null,
        gpa: gpa || null,
        englishProficiency: englishProficiency || null,
        chineseProficiency: chineseProficiency || null,
        languageLevel: languageLevel || null,
        documentsJson: documentsJson || "[]",
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, id: app.id })
  } catch (e: any) {
    console.error("Study apply error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
