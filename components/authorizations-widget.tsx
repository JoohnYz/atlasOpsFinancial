"use client"

import { Check, X, ShieldCheck, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Authorization } from "@/lib/types"
import { updateAuthorizationStatus } from "@/lib/actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { PaymentDetailsModal } from "@/components/payment-details-modal"

interface AuthorizationsWidgetProps {
    authorizations: Authorization[]
    canManage: boolean
}

export function AuthorizationsWidget({ authorizations, canManage }: AuthorizationsWidgetProps) {
    const hasAuths = authorizations.length > 0
    const pendingAuths = authorizations.filter(a => a.status === 'pending')
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null)

    const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
        console.log(`[AuthorizationsWidget] Triggering status change: ${id} -> ${status}`)
        const result = await updateAuthorizationStatus(id, status)
        console.log(`[AuthorizationsWidget] Server response:`, result)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(status === "approved" ? "Pago aprobado" : "Pago rechazado")
        }
    }

    const handleRowClick = (auth: Authorization) => {
        setSelectedAuth(auth)
        setDetailsModalOpen(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-500 hover:bg-green-600 text-[10px] px-1 py-0 h-5">Aprobado</Badge>
            case "rejected":
                return <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1 py-0 h-5">Rechazado</Badge>
            default:
                return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] px-1 py-0 h-5">Pendiente</Badge>
        }
    }

    return (
        <>
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card h-full">
                <CardHeader className="pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold font-sans text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-blue-600" />
                                Autorizaciones
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-base mt-2 font-medium">
                                {pendingAuths.length} pagos pendientes de aprobación
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/authorizations">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/5 bg-transparent"
                            >
                                Ver todas
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {hasAuths ? (
                        <div className="space-y-3">
                            {authorizations.slice(0, 5).map((auth) => (
                                <div
                                    key={auth.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 border border-border hover:border-muted-foreground/20 cursor-pointer"
                                    onClick={() => handleRowClick(auth)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${auth.status === 'pending' ? 'bg-orange-100/50 dark:bg-orange-900/20' : auth.status === 'approved' ? 'bg-green-100/50 dark:bg-green-900/20' : 'bg-red-100/50 dark:bg-red-900/20'}`}>
                                            <ShieldCheck className={`w-5 h-5 ${auth.status === 'pending' ? 'text-orange-600 dark:text-orange-400' : auth.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground font-sans">{auth.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(auth.date), "dd/MM/yyyy")} • {auth.payment_method}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-bold font-sans text-foreground">
                                                ${Number(auth.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex justify-end mt-1">
                                                {getStatusBadge(auth.status)}
                                            </div>
                                        </div>

                                        {auth.status === 'pending' && canManage && (
                                            <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100/20"
                                                    onClick={() => handleStatusChange(auth.id, "approved")}
                                                    title="Aprobar"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100/20"
                                                    onClick={() => handleStatusChange(auth.id, "rejected")}
                                                    title="Rechazar"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                            <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Sin autorizaciones</p>
                            <p className="text-sm mt-1">No hay pagos pendientes</p>
                            <div className="mt-4">
                                <Link href="/dashboard/authorizations">
                                    <Button variant="outline" size="sm" className="bg-transparent">
                                        Agregar Pago
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaymentDetailsModal
                open={detailsModalOpen}
                onOpenChange={setDetailsModalOpen}
                authorization={selectedAuth}
                canManage={canManage}
                onApprove={(id) => handleStatusChange(id, "approved")}
                onReject={(id) => handleStatusChange(id, "rejected")}
            />
        </>
    )
}
