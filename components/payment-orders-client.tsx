
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useRealtime } from "@/hooks/use-realtime"
import { Check, X, MoreHorizontal, Pencil, Trash, Plus, ShieldCheck, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddPaymentOrderModal } from "@/components/add-payment-order-modal"
import { PaymentOrderDetailsModal } from "@/components/payment-order-details-modal"
import { PaymentOrder } from "@/lib/types"
import { updatePaymentOrderStatus, deletePaymentOrder } from "@/lib/actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PaymentOrdersClientProps {
    initialPaymentOrders: PaymentOrder[]
    canManage: boolean
    isAdmin: boolean
}

export function PaymentOrdersClient({ initialPaymentOrders, canManage, isAdmin }: PaymentOrdersClientProps) {
    const router = useRouter()
    const [modalOpen, setModalOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)

    const [editingOrder, setEditingOrder] = useState<PaymentOrder | null>(null)
    const [deletingOrder, setDeletingOrder] = useState<PaymentOrder | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)

    // Filter state
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Listen for real-time changes to the payment_orders table
    useRealtime("payment_orders", () => {
        router.refresh()
    })

    // Filter logic
    const filteredPaymentOrders = useMemo(() => {
        return initialPaymentOrders.filter(order => {
            const matchesSearch =
                order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.amount.toString().includes(searchTerm)

            const matchesStatus = statusFilter === "all" || order.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [initialPaymentOrders, searchTerm, statusFilter])

    // Derived pagination data
    const totalItems = filteredPaymentOrders.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const displayedPaymentOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredPaymentOrders.slice(start, start + itemsPerPage)
    }, [filteredPaymentOrders, currentPage, itemsPerPage])

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(Number(value))
        setCurrentPage(1)
    }



    const handleAdd = () => {
        setEditingOrder(null)
        setModalOpen(true)
    }

    const handleEdit = (order: PaymentOrder) => {
        setEditingOrder(order)
        setModalOpen(true)
    }

    const handleDelete = (order: PaymentOrder) => {
        if (!isAdmin) {
            toast.error("Solo el administrador principal puede eliminar órdenes de pago")
            return
        }
        setDeletingOrder(order)
    }

    const handleRowClick = (order: PaymentOrder) => {
        setSelectedOrder(order)
        setDetailsModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingOrder) return

        const result = await deletePaymentOrder(deletingOrder.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Orden de pago eliminada")
        }
        setDeletingOrder(null)
    }

    const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
        console.log(`[PaymentOrdersClient] Triggering status change: ${id} -> ${status}`)
        const result = await updatePaymentOrderStatus(id, status)
        console.log(`[PaymentOrdersClient] Server response:`, result)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(status === "approved" ? "Pago aprobado" : "Pago rechazado")
        }
    }

    const getStatusBadge = (order: PaymentOrder) => {
        const { status, is_rectified } = order
        return (
            <div className="flex flex-col gap-1 items-start">
                {status === "approved" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
                ) : status === "rejected" ? (
                    <Badge className="bg-red-500 hover:bg-red-600">Rechazado</Badge>
                ) : (
                    <Badge className="bg-orange-500 hover:bg-orange-600">Pendiente</Badge>
                )}
                {is_rectified && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-500 text-blue-600">
                        Rectificado
                    </Badge>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ordenes de pago</h2>
                    <p className="text-muted-foreground">Gestiona y aprueba los pagos pendientes.</p>
                </div>
                <div className="flex items-center gap-3">


                    <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Pago
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                Listado de Pagos
                            </CardTitle>
                            <CardDescription>
                                Revisa y actualiza el estado de los pagos. Haz clic en una fila para ver detalles.
                            </CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por descripción..."
                                    className="pl-9 bg-secondary/50 border-border"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(val) => {
                                setStatusFilter(val)
                                setCurrentPage(1)
                            }}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-secondary/50 border-border">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Estado" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                    <SelectItem value="approved">Aprobados</SelectItem>
                                    <SelectItem value="rejected">Rechazados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedPaymentOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            {searchTerm || statusFilter !== "all"
                                                ? "No se encontraron pagos con estos filtros."
                                                : "No hay órdenes de pago registradas."}
                                            {(searchTerm || statusFilter !== "all") && (
                                                <Button
                                                    variant="link"
                                                    className="text-blue-600 h-auto p-0"
                                                    onClick={() => {
                                                        setSearchTerm("")
                                                        setStatusFilter("all")
                                                    }}
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedPaymentOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleRowClick(order)}
                                    >
                                        <TableCell>
                                            {/* Fix hydration error by parsing YYYY-MM-DD string directly */}
                                            {order.date.includes('T') ? format(new Date(order.date), "dd/MM/yyyy") : order.date.split('-').reverse().join('/')}
                                        </TableCell>
                                        <TableCell className="font-medium">{order.description}</TableCell>
                                        <TableCell>{order.payment_method}</TableCell>
                                        <TableCell className="text-right">${order.amount.toLocaleString('en-US')}</TableCell>
                                        <TableCell>{getStatusBadge(order)}</TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status === "pending" && canManage && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleStatusChange(order.id, "approved")
                                                            }}
                                                            title="Aprobar"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleStatusChange(order.id, "rejected")
                                                            }}
                                                            title="Rechazar"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                {true && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            {(order.status === 'pending' || order.status === 'rejected') && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleEdit(order)}>
                                                                        {order.status === 'rejected' ? (
                                                                            <><Pencil className="mr-2 h-4 w-4" /> Rectificar</>
                                                                        ) : (
                                                                            <><Pencil className="mr-2 h-4 w-4" /> Editar</>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}
                                                            {isAdmin && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(order)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" /> Eliminar
                                                                </DropdownMenuItem>
                                                            )}
                                                            {order.status === 'approved' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        const { generatePaymentOrderPDF } = await import("@/lib/generate-payment-order-pdf")
                                                                        generatePaymentOrderPDF(order)
                                                                    }}>
                                                                        <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Ver:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={itemsPerPage.toString()} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium text-foreground">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-medium text-foreground">{totalItems}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="h-8 px-2"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground mx-2">
                                Página <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{totalPages || 1}</span>
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="h-8 px-2"
                        >
                            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>

            <AddPaymentOrderModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                orderToEdit={editingOrder}
            />

            <PaymentOrderDetailsModal
                open={detailsModalOpen}
                onOpenChange={setDetailsModalOpen}
                order={selectedOrder}
                canManage={canManage}
                onApprove={(id) => handleStatusChange(id, "approved")}
                onReject={(id) => handleStatusChange(id, "rejected")}
                onRectify={handleEdit}
            />

            <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la orden de pago.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

