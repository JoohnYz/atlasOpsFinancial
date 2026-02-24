"use client"

import { useEffect, useState, useRef } from "react"

interface AmountTickerProps {
    value: number
    prefix?: string
    suffix?: string
    className?: string
    decimals?: number
}

export function AmountTicker({
    value,
    prefix = "",
    suffix = "",
    className = "",
    decimals = 2,
}: AmountTickerProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const countRef = useRef<number>(0)
    const startTimeRef = useRef<number | null>(null)

    // Logic: Higher values = faster completion
    // Base duration is 2000ms for small values
    // We reduce duration as value increases, but keep a minimum of 400ms
    // Formula: duration = max(400, 2000 - log10(max(1, value)) * 300)
    const duration = Math.max(400, 2000 - Math.log10(Math.max(1, value)) * 300)

    useEffect(() => {
        let animationFrameId: number

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

            // Easing function: easeOutExpo for a premium feel
            const easeOutExpo = (x: number): number => {
                return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
            }

            const currentCount = value * easeOutExpo(progress)
            setDisplayValue(currentCount)

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate)
            } else {
                setDisplayValue(value)
            }
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(animationFrameId)
            startTimeRef.current = null
        }
    }, [value, duration])

    return (
        <span className={className}>
            {prefix}
            {displayValue.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </span>
    )
}
