import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { MessageSquare } from "lucide-react"
import { formatDate, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { isAdminMessage: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { name: true, role: true } },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Communication with the EA Trade Link team"
      />
      {messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Messages from the admin team regarding your applications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.isAdminMessage ? "border-primary/20 bg-primary/5" : ""}>
              <CardContent className="flex items-start gap-3 p-4">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`text-xs ${msg.isAdminMessage ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.isAdminMessage ? "EA" : getInitials(msg.sender.name ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {msg.isAdminMessage ? "EA Trade Link Team" : msg.sender.name}
                    </span>
                    {msg.isAdminMessage && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Admin</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{msg.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
