import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/utility/providers"
import { Inter } from "next/font/google"
import { Metadata } from "next"
import "../[locale]/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Game Time Demo | Chatbot UI",
  description: "Test and explore the game time tracking system for TTRPGs"
}

export default function GameTimeDemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="dark">
          <Toaster richColors position="top-center" duration={3000} />
          <div className="bg-background text-foreground min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
