import { FC } from "react"
import { cn } from "@/lib/utils"

interface WindowIdentifierProps {
  id: string
  className?: string
}

export const WindowIdentifier: FC<WindowIdentifierProps> = ({
  id,
  className
}) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-50 select-none rounded bg-gray-800/90 px-2 py-1 font-mono text-xs text-gray-300",
        "dark:bg-gray-200/90 dark:text-gray-700",
        className
      )}
    >
      {id}
    </div>
  )
}
