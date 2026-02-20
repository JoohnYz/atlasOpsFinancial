"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        // @ts-ignore
        if (!document.startViewTransition) {
            setTheme(theme === "light" ? "dark" : "light")
            return
        }

        // @ts-ignore
        const isDark = theme === "dark"
        const nextTheme = isDark ? "light" : "dark"

        // @ts-ignore
        const transition = document.startViewTransition(() => {
            setTheme(nextTheme)
        })

        transition.ready.then(() => {
            const x = window.innerWidth / 2
            const y = window.innerHeight / 2
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            )

            // If going to Dark (nextTheme === 'dark'): Dark expands (Grow New)
            // If going to Light (nextTheme === 'light'): Dark shrinks (Shrink Old)

            const isGoingToDark = nextTheme === "dark"

            const clips = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ]

            document.documentElement.animate(
                {
                    clipPath: isGoingToDark ? clips : [...clips].reverse(),
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    // If to Dark: Animate New (Dark) growing
                    // If to Light: Animate Old (Dark) shrinking
                    pseudoElement: isGoingToDark
                        ? "::view-transition-new(root)"
                        : "::view-transition-old(root)",
                    fill: "forwards",
                }
            )
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
        >
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
        </Button>
    )
}
