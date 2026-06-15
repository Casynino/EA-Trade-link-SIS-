// ── Universal Application Engine ─────────────────────────────────────────────
// All opportunity types share the same workflow.
// Only documents, fields, and notification text change.

export interface AppField {
  id: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea"
  required: boolean
  placeholder?: string
  options?: string[]
  note?: string        // shown below the field as a small hint
  fullWidth?: boolean  // span full width in the grid
}

export interface AppConfig {
  note?: string       // a prominent warning/note shown at top of Step 2
}

export interface RequiredDoc {
  id: string
  label: string
  required: boolean
}

// ── Default fields per opportunity type ───────────────────────────────────────

const DEFAULT_FIELDS: Record<string, AppField[]> = {
  SCHOLARSHIP: [
    { id: "degreeLevel",  label: "Degree Level Sought",   type: "select",   required: true,  options: ["BACHELOR","MASTER","PHD","LANGUAGE","CERTIFICATE"] },
    { id: "fieldOfStudy", label: "Intended Field of Study", type: "text",   required: true,  placeholder: "e.g. Computer Science, Business Administration" },
    { id: "gpa",          label: "Current GPA (out of 4.0)", type: "number", required: false, placeholder: "e.g. 3.5" },
    { id: "languages",    label: "Languages Spoken",       type: "text",     required: false, placeholder: "e.g. English, Swahili, Chinese" },
  ],
  JOB: [
    { id: "currentJob",  label: "Current / Most Recent Job Title", type: "text",     required: false, placeholder: "e.g. Electrician, Factory Supervisor" },
    { id: "experience",  label: "Relevant Work Experience",        type: "textarea", required: true,  placeholder: "Describe your experience, skills, and achievements…" },
  ],
  BUSINESS_VISA: [
    { id: "companyName",     label: "Company / Business Name",          type: "text",     required: true,  placeholder: "Your registered company name" },
    { id: "position",        label: "Position / Job Title",             type: "text",     required: true,  placeholder: "e.g. Managing Director, CEO" },
    { id: "businessLicense", label: "Business License Number",          type: "text",     required: true,  placeholder: "Your business registration number",
      note: "If the Business License does not match your passport name, you must provide a company authorization letter." },
    { id: "tinNumber",       label: "TIN Number",                       type: "text",     required: true,  placeholder: "Tax Identification Number",
      note: "If the TIN does not match your passport name, you must provide a company authorization letter." },
    { id: "passportNumber",  label: "Passport Number",                  type: "text",     required: true,  placeholder: "As shown on your passport data page" },
    { id: "invitingCompany", label: "Inviting Company Name (in China)", type: "text",     required: true,  placeholder: "Name of the Chinese company or person inviting you" },
    { id: "invitingPerson",  label: "Inviting Person Full Name",        type: "text",     required: false, placeholder: "Full name of your contact person in China (if individual)" },
    { id: "experience",      label: "Purpose of Visit to China",        type: "textarea", required: true,  placeholder: "Describe the nature of your business visit, meetings, and objectives…", fullWidth: true },
  ],
  FACTORY_VISIT: [
    { id: "companyName", label: "Company / Business Name",    type: "text",     required: true,  placeholder: "Your business name" },
    { id: "experience",  label: "Products / Industries of Interest", type: "textarea", required: true, placeholder: "What types of factories or products are you looking for?" },
    { id: "groupSize",   label: "Group Size",                 type: "number",   required: false, placeholder: "How many people in your group?" },
  ],
  CANTON_FAIR: [
    { id: "companyName", label: "Company / Business Name",    type: "text",     required: true,  placeholder: "Your business name" },
    { id: "experience",  label: "Products / Categories of Interest", type: "textarea", required: true, placeholder: "What product categories are you interested in sourcing?" },
  ],
  TRADE_EXHIBITION: [
    { id: "companyName", label: "Company / Business Name",    type: "text",     required: true,  placeholder: "Your business name" },
    { id: "experience",  label: "Business Goals",             type: "textarea", required: true,  placeholder: "What are your goals for attending this exhibition?" },
  ],
  CONFERENCE: [
    { id: "companyName", label: "Organisation / Institution", type: "text",     required: false, placeholder: "Your organisation or university" },
    { id: "position",    label: "Position / Title",           type: "text",     required: false, placeholder: "Your job title or academic role" },
    { id: "experience",  label: "Why do you want to attend?", type: "textarea", required: true,  placeholder: "Briefly describe your motivation for attending…" },
  ],
  EXCHANGE: [
    { id: "experience",  label: "Exchange Purpose / Details", type: "textarea", required: true,  placeholder: "Describe the purpose of your exchange and amount needed…" },
  ],
}

// ── Default required documents per type ───────────────────────────────────────

const DEFAULT_DOCS: Record<string, RequiredDoc[]> = {
  SCHOLARSHIP: [
    { id: "passport",          label: "Valid Passport (6+ months remaining)",   required: true  },
    { id: "transcripts",       label: "Academic Transcripts",                   required: true  },
    { id: "certificate",       label: "High School / Degree Certificate",       required: true  },
    { id: "personal_statement",label: "Personal Statement / Study Plan",        required: true  },
    { id: "photos",            label: "2× Passport-Size Photos",                required: true  },
    { id: "medical",           label: "Medical / Health Certificate",           required: false },
    { id: "recommendation",    label: "Recommendation Letter",                  required: false },
    { id: "bank_statement",    label: "Bank Statement (last 3 months)",         required: false },
  ],
  JOB: [
    { id: "passport",    label: "Passport Copy",                  required: true  },
    { id: "cv",          label: "CV / Resume",                    required: true  },
    { id: "certificate", label: "Diplomas / Certificates",        required: true  },
    { id: "experience",  label: "Work Experience Letters",        required: false },
    { id: "medical",     label: "Medical Certificate",            required: false },
    { id: "photos",      label: "2× Passport-Size Photos",       required: true  },
  ],
  BUSINESS_VISA: [
    { id: "passport_data",     label: "Passport Data Page (photo page scan)",                              required: true  },
    { id: "passport_photo",    label: "Passport-Size Photo (white background, recent)",                    required: true  },
    { id: "business_license",  label: "Business License / Company Registration Certificate",               required: true  },
    { id: "tin_cert",          label: "TIN Certificate",                                                   required: true  },
    { id: "bank_statement",    label: "Bank Statement — last 3 months (min. USD 15,000–20,000 balance)",   required: true  },
    { id: "invitation",        label: "Invitation Letter from Chinese Company or Individual (MANDATORY)",   required: true  },
    { id: "inviting_docs",     label: "Inviting Company's Registration Documents OR Inviting Person's ID", required: true  },
    { id: "auth_letter",       label: "Company Authorization Letter (if Business License / TIN name differs from passport)", required: false },
  ],
  FACTORY_VISIT: [
    { id: "passport",        label: "Passport Copy",                required: true  },
    { id: "company_profile", label: "Company Profile / Business Card", required: true  },
    { id: "business_letter", label: "Business Intent Letter",       required: false },
  ],
  CANTON_FAIR: [
    { id: "passport",        label: "Passport Copy",              required: true  },
    { id: "business_letter", label: "Company Letter / Business Card", required: true  },
  ],
  TRADE_EXHIBITION: [
    { id: "passport",        label: "Passport Copy",              required: true  },
    { id: "business_letter", label: "Company Letter",            required: true  },
  ],
  CONFERENCE: [
    { id: "passport",  label: "Passport Copy",                    required: true  },
    { id: "letter",    label: "Institution / Company Letter",     required: true  },
  ],
  EXCHANGE: [
    { id: "id",        label: "National ID or Passport Copy",     required: true  },
    { id: "amount",    label: "Amount and Purpose Details",       required: true  },
  ],
}

// ── Per-type important notes shown prominently in Step 2 ─────────────────────

const TYPE_NOTES: Record<string, string> = {
  BUSINESS_VISA:
    "⚠️ Important: If the name on your Business License or TIN Certificate does not match the name on your passport, you must provide an official Company Authorization Letter. The Invitation Letter from your Chinese host is mandatory and must be submitted with your application.",
}

export function getTypeNote(type: string): string | null {
  return TYPE_NOTES[type] ?? null
}

export function getDefaultDocs(type: string): RequiredDoc[] {
  return DEFAULT_DOCS[type] ?? DEFAULT_DOCS.SCHOLARSHIP
}

export function getDefaultFields(type: string): AppField[] {
  return DEFAULT_FIELDS[type] ?? []
}

export function parseDocs(json: string | null | undefined, type: string): RequiredDoc[] {
  if (!json || json === "[]") return getDefaultDocs(type)
  try { return JSON.parse(json) } catch { return getDefaultDocs(type) }
}

export function parseFields(json: string | null | undefined, type: string): AppField[] {
  if (!json || json === "[]") return getDefaultFields(type)
  try { return JSON.parse(json) } catch { return getDefaultFields(type) }
}

// ── Notification text by category ─────────────────────────────────────────────

export function getSubmissionMessage(type: string): string {
  if (type === "SCHOLARSHIP") {
    return "Your application has been successfully received by the International Education Processing Center. It is now under review. You will receive a response within 5 days."
  }
  if (type === "BUSINESS_VISA") {
    return "Your visa application has been successfully received by the Visa Processing Unit. It is now under review. You will receive a response within 5 days."
  }
  return "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days."
}
