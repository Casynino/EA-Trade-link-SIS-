import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate, getInitials } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminMessagesPage() {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/dashboard")

  const messages = await db.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sender: { select: { name: true, email: true, role: true } },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="All Messages" description={`${messages.length} messages`} />
      <div className="space-y-3">
        {messages.map((msg) => (
          <Card key={msg.id} className={msg.isAdminMessage ? "border-primary/20" : ""}>
            <CardContent className="flex items-start gap-3 p-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={`text-xs ${msg.sender.role !== "USER" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {getInitials(msg.sender.name ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{msg.sender.name}</span>
                  {msg.sender.role !== "USER" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Admin</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{msg.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No messages yet</div>
        )}
      </div>
    </div>
  )
}
