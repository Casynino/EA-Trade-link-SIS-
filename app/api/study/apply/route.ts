import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * FLOW A — General Student Application.
 *
 * The student submits their full academic profile WITHOUT choosing a programme.
 * An admin later reviews it and matches them to a published opportunity
 * (see PATCH /api/study/applications/[id]/match).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // An account is required — otherwise the application cannot be saved or tracked.
    // (This route previously returned success without persisting anything for guests.)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: "Please create an account or sign in so we can save and track your application." },
        { status: 401 },
      )
    }

    const body = await req.json()

    const {
      degreeLevel, fieldOfStudy, intendedMajor, preferredIntake, preferredUniversities,
      fullName, gender, nationality, passportNumber, passportExpiry, dateOfBirth,
      phone, contactEmail, homeAddress,
      currentEducation, institutionName, graduationYear, gpa,
      englishProficiency, chineseProficiency, languageLevel,
      documentsJson, uploadedDocuments,
    } = body

    if (!degreeLevel || !fullName || !nationality || !phone || !contactEmail || !currentEducation || !intendedMajor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // NOTE: no duplicate check — a student may submit more than one profile
    // (e.g. applying for a Master's after a Bachelor's, or resubmitting with
    // better documents). Admin reviews each submission separately.

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
        // Flow A starts unmatched — admin assigns an opportunity after review.
        matchedOpportunityId: null,
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Persist any files the applicant actually uploaded as real StudyDocument rows
    // so they are visible and downloadable in the admin case view.
    if (Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0) {
      await db.studyDocument.createMany({
        data: uploadedDocuments
          .filter((d: any) => d?.fileUrl)
          .map((d: any) => ({
            studyApplicationId: app.id,
            documentType: String(d.key ?? "other"),
            fileName: String(d.fileName ?? "document"),
            fileUrl: String(d.fileUrl),
          })),
      })
    }

    return NextResponse.json({ success: true, id: app.id })
  } catch (e: any) {
    console.error("Study apply error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
