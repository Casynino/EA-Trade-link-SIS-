import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "EA Trade Link SIS",
    template: "%s | EA Trade Link SIS",
  },
  description:
    "China–Tanzania Education and Business Service Platform. Scholarships, Visa, Sourcing, Factory Visits, and Currency Exchange.",
  keywords: ["China scholarships", "Tanzania", "business visa", "product sourcing", "factory visits"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
