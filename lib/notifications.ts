import { db } from "@/lib/db"

type OppType =
  | "SCHOLARSHIP"
  | "JOB"
  | "BUSINESS_VISA"
  | "FACTORY_VISIT"
  | "CANTON_FAIR"
  | "TRADE_EXHIBITION"
  | "CONFERENCE"
  | "EXCHANGE"
  | string

const SUBMISSION_TEMPLATES: Record<string, { title: string; message: string }> = {
  SCHOLARSHIP: {
    title: "Application Received — International Education Processing Center",
    message:
      "Your application has been successfully received by the International Education Processing Center. It is now under review. You will receive a response within 5 days.",
  },
  JOB: {
    title: "Application Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
  BUSINESS_VISA: {
    title: "Application Received — Visa Processing Unit",
    message:
      "Your visa application has been successfully received by the Visa Processing Unit. It is now under review. You will receive a response within 5 days.",
  },
  FACTORY_VISIT: {
    title: "Registration Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
  CANTON_FAIR: {
    title: "Registration Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
  TRADE_EXHIBITION: {
    title: "Registration Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
  CONFERENCE: {
    title: "Registration Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
  DEFAULT: {
    title: "Registration Received — EA Trade Link Coordination Team",
    message:
      "Your registration has been successfully received by the EA Trade Link Coordination Team. It is now under review. You will receive feedback within 2–5 days.",
  },
}

export async function notifyPaymentConfirmed(userId: string, applicationId: string) {
  await db.notification.create({
    data: {
      userId,
      type: "PAYMENT_CONFIRMED",
      title: "Payment Confirmed — Processing Started",
      message:
        "Your payment has been confirmed by our team. Your application is now being actively processed. We will notify you when it is complete.",
      link: `/dashboard/applications/${applicationId}`,
    },
  })
}

const STATUS_TEMPLATES: Record<string, { title: string; message: string }> = {
  UNDER_REVIEW: {
    title: "Application Under Review",
    message:
      "Good news — your application is now being actively reviewed by our team. We'll update you soon.",
  },
  DOCUMENTS_REQUIRED: {
    title: "Documents Required",
    message:
      "We need additional documents to process your application. Please log in and check the details.",
  },
  SHORTLISTED: {
    title: "You've Been Shortlisted!",
    message:
      "Congratulations! You have been shortlisted for the next stage. Stay tuned for further instructions.",
  },
  ACCEPTED: {
    title: "Application Accepted!",
    message:
      "Congratulations! Your application has been accepted. Please log in to view your approval details.",
  },
  PAYMENT_PENDING: {
    title: "Payment Required — Secure Your Spot",
    message:
      "Your application has been approved! To secure your placement and begin official processing, please complete the required payment. Log in to view payment details.",
  },
  PAYMENT_COMPLETED: {
    title: "Payment Confirmed — Processing Started",
    message:
      "Your payment has been confirmed by our team. Your application is now being actively processed. We will notify you when it is complete.",
  },
  REJECTED: {
    title: "Application Update",
    message:
      "Thank you for your interest. After careful review, we are unable to proceed with your application at this time. We encourage you to explore other opportunities.",
  },
  PROCESSING: {
    title: "Application Being Processed",
    message:
      "Your application is now being processed. We will notify you once it is complete.",
  },
  COMPLETED: {
    title: "Application Completed",
    message:
      "Your application process is complete. Congratulations and welcome aboard!",
  },
}

export async function notifySubmission(
  userId: string,
  oppType: OppType,
  applicationId: string
) {
  const tpl = SUBMISSION_TEMPLATES[oppType] ?? SUBMISSION_TEMPLATES.DEFAULT
  await db.notification.create({
    data: {
      userId,
      type: "APPLICATION_SUBMITTED",
      title: tpl.title,
      message: tpl.message,
      link: `/dashboard/applications/${applicationId}`,
    },
  })
}

export async function notifyStatusChange(
  userId: string,
  newStatus: string,
  applicationId: string
) {
  const tpl = STATUS_TEMPLATES[newStatus]
  if (!tpl) return
  await db.notification.create({
    data: {
      userId,
      type: `APPLICATION_${newStatus}`,
      title: tpl.title,
      message: tpl.message,
      link: `/dashboard/applications/${applicationId}`,
    },
  })
}
