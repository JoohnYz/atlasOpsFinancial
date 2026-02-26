"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "./signature-pad"
import { PenTool, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getUserSignature, upsertUserSignature } from "@/lib/signature-actions"
import { UserSignature } from "@/lib/types"

interface SignatureManagementSectionProps {
    userEmail: string | null
}

export function SignatureManagementSection({ userEmail }: SignatureManagementSectionProps) {
    const [signerName, setSignerName] = useState("")
    const [signatureData, setSignatureData] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [existingSignature, setExistingSignature] = useState<UserSignature | null>(null)

    useEffect(() => {
        const loadSignature = async () => {
            if (!userEmail) return

            setInitialLoading(true)
            try {
                const signature = await getUserSignature(userEmail)
                if (signature) {
                    setExistingSignature(signature)
                    setSignerName(signature.signer_name)
                    setSignatureData(signature.signature_data)
                }
            } catch (error) {
                console.error("Error loading signature:", error)
            } finally {
                setInitialLoading(false)
            }
        }

        loadSignature()
    }, [userEmail])

    const handleSaveSignature = async () => {
        if (!userEmail) {
            toast.error("Error de sesión", { description: "No se encontró el email del usuario activo." })
            return
        }

        if (!signerName.trim()) {
            toast.error("Campo requerido", { description: "Por favor, ingresa el nombre del firmante." })
            return
        }

        if (!signatureData) {
            toast.error("Firma requerida", { description: "Por favor, dibuja tu firma." })
            return
        }

        setLoading(true)
        try {
            const result = await upsertUserSignature({
                user_email: userEmail,
                signer_name: signerName.trim(),
                signature_data: signatureData
            })

            if (result.success) {
                toast.success("Firma guardada", { description: "La firma se ha registrado correctamente." })
                // Update local state to show it was saved
                setExistingSignature({
                    id: existingSignature?.id || 'new',
                    user_email: userEmail,
                    signer_name: signerName.trim(),
                    signature_data: signatureData
                })
            } else {
                toast.error("Error", { description: result.error || "No se pudo guardar la firma." })
            }
        } catch (error) {
            toast.error("Error", { description: "Ocurrió un error inesperado al guardar." })
        } finally {
            setLoading(false)
        }
    }

    const handleSignatureChange = (data: string | null) => {
        setSignatureData(data)
    }

    const isChanged =
        signerName !== (existingSignature?.signer_name || "") ||
        signatureData !== (existingSignature?.signature_data || null)

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <PenTool className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-foreground text-xl">Mis Firmas</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground max-w-2xl">
                    Registra tu firma digital para ser utilizada en reportes, órdenes de pago y otros documentos oficiales. Esta firma es estrictamente personal.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {initialLoading ? (
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-secondary/20">
                        <span className="text-muted-foreground animate-pulse text-sm">Cargando firma...</span>
                    </div>
                ) : (
                    <div className="max-w-lg space-y-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-blue-500 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Tu firma se asociará exclusivamente a tu cuenta (<span className="font-semibold">{userEmail}</span>). Asegúrate de que el nombre coincida con tu identidad.</p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="signerName" className="text-foreground flex items-baseline justify-between">
                                Nombre del Firmante
                                <span className="text-xs text-muted-foreground font-normal">Tal como aparecerá en los documentos</span>
                            </Label>
                            <Input
                                id="signerName"
                                placeholder="Ej: Ing. Juan Pérez"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                className="bg-secondary border-border"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-foreground">Dibuja tu firma</Label>
                            <SignaturePad
                                initialSignature={existingSignature?.signature_data}
                                onSignatureChange={handleSignatureChange}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            onClick={handleSaveSignature}
                            disabled={loading || !signerName.trim() || !signatureData || !isChanged}
                            className="w-full sm:w-auto"
                        >
                            {loading ? (
                                <>Guardando...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {existingSignature ? "Actualizar Firma" : "Guardar Firma"}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
