import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // An account is required before any application is accepted. This route used
    // to answer guests with {success:true} while persisting NOTHING — telling the
    // applicant their visa application was received when it had been discarded.
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: "Please create an account or sign in so we can save and track your application." },
        { status: 401 },
      )
    }

    const body = await req.json()

    const {
      fullName, nationality, passportNumber, passportExpiry, dateOfBirth, phone, contactEmail,
      companyName, companyAddress, jobTitle, companyRegNumber, tinNumber,
      purpose, travelDates, stayDuration, previousVisits,
      requiresAuthLetter,
    } = body

    if (!fullName || !nationality || !passportNumber || !phone || !contactEmail || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const app = await db.visaApplication.create({
      data: {
        userId,
        fullName, nationality, passportNumber,
        passportExpiry: passportExpiry || null,
        dateOfBirth: dateOfBirth || null,
        phone, contactEmail,
        companyName: companyName || null,
        companyAddress: companyAddress || null,
        jobTitle: jobTitle || null,
        companyRegNumber: companyRegNumber || null,
        tinNumber: tinNumber || null,
        requiresAuthLetter: !!requiresAuthLetter,
        purpose,
        travelDates: travelDates || null,
        stayDuration: stayDuration || null,
        previousVisits: previousVisits || null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, id: app.id })
  } catch (e: any) {
    console.error("Visa apply error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
