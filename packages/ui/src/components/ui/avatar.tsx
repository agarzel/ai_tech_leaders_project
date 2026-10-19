"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { UserRoundIcon } from "lucide-react"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 3): the only full circle in the system
// (P13); one size, 32 px (B43); neutral fallback – initials in muted-foreground on muted, the same for
// everyone, never a colour per person (B44, A01; 7.01:1); no presence badge, no group with a "+N"
// counter (B45, P9, P10).
function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  )
}

/** The person's photo. `alt=""` when the name is written next to it (it would be read twice). */
function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-full object-cover", className)}
      {...props}
    />
  )
}

/**
 * Shown while the photo loads or when there is none: 1–2 initials, or a neutral person icon when
 * there are no initials (B44).
 */
function AvatarFallback({
  className,
  children,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted type-meta font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? <UserRoundIcon aria-hidden="true" className="size-4" />}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
