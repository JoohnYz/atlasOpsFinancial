"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

interface SignaturePadProps {
    onSignatureChange: (signature: string | null) => void
    initialSignature?: string | null
    disabled?: boolean
}

export function SignaturePad({ onSignatureChange, initialSignature, disabled = false }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    // Initialize canvas with existing signature if provided
    useEffect(() => {
        if (initialSignature && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                const img = new Image()
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                    setHasSignature(true)
                }
                img.src = initialSignature
            }
        }
    }, [initialSignature])

    // Resize canvas for better resolution and clear on resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            // Set actual size in memory (scaled to account for extra pixel density)
            const rect = canvas.parentElement?.getBoundingClientRect()
            if (rect) {
                // We set fixed width/height for simplicity, but could be responsive
                canvas.width = rect.width || 400
                canvas.height = 200

                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                    ctx.strokeStyle = '#000000' // Dark ink
                }
            }
        }
    }, [])

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }

        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()

        // Calculate scale factors
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            }
        }

        return {
            x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
            y: ((e as React.MouseEvent).clientY - rect.top) * scaleY
        }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return

        e.preventDefault()
        setIsDrawing(true)
        const coords = getCoordinates(e)

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.beginPath()
                ctx.moveTo(coords.x, coords.y)
            }
        }
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return

        e.preventDefault()
        const coords = getCoordinates(e)

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.lineTo(coords.x, coords.y)
                ctx.stroke()
                if (!hasSignature) setHasSignature(true)
            }
        }
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false)
            saveSignature()
        }
    }

    const clearSignature = () => {
        if (disabled || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setHasSignature(false)
            onSignatureChange(null)
        }
    }

    const saveSignature = () => {
        if (!canvasRef.current || !hasSignature) return
        const dataUrl = canvasRef.current.toDataURL('image/png')
        onSignatureChange(dataUrl)
    }

    return (
        <div className="space-y-3">
            <div className="relative border-2 border-dashed border-border rounded-lg bg-white overflow-hidden touch-none w-full max-w-lg">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[200px] cursor-crosshair bg-white block"
                />
                {disabled && (
                    <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10" />
                )}
            </div>

            <div className="flex justify-between items-center max-w-lg">
                <p className="text-xs text-muted-foreground">
                    {hasSignature ? "Firma registrada" : "Dibuja tu firma en el recuadro"}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    disabled={disabled || !hasSignature}
                    className="h-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                    <Eraser className="w-3.5 h-3.5 mr-2" />
                    Limpiar
                </Button>
            </div>
        </div>
    )
}
