"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useRealtime } from "@/hooks/use-realtime"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getPendingPaymentOrders, getPaymentOrderHistory } from "@/lib/actions"
import { PaymentOrder } from "@/lib/types"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface NotificationsBellProps {
    canAccess?: boolean
    canManage?: boolean
    currentUserEmail?: string
}

export function NotificationsBell({ canAccess = false, canManage = false, currentUserEmail }: NotificationsBellProps) {
    const router = useRouter()
    const [pendingOrders, setPendingOrders] = useState<PaymentOrder[]>([])
    const [historyOrders, setHistoryOrders] = useState<PaymentOrder[]>([])
    const [view, setView] = useState<'pending' | 'history'>('pending')
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [seenIds, setSeenIds] = useState<string[]>([])

    const knownHistoryIds = useRef<Set<string>>(new Set())
    const knownPendingIds = useRef<Set<string>>(new Set())
    const isInitialLoad = useRef(true)

    // Helper to get composite key - NOW ID ONLY for v3
    const getSeenKey = (order: PaymentOrder) => order.id

    // Load seen IDs from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('seen_notification_ids_v3')
        if (saved) {
            try {
                setSeenIds(JSON.parse(saved))
            } catch (e) {
                console.error("Error parsing seen_notification_ids", e)
            }
        }
    }, [])

    // Update localStorage when seenIds change
    useEffect(() => {
        // Use a persistent flag for the very first render skip
        if (isInitialLoad.current && seenIds.length === 0) {
            return
        }
        localStorage.setItem('seen_notification_ids_v3', JSON.stringify(seenIds))
    }, [seenIds])

    const fetchPendingOrders = useCallback(async () => {
        setLoading(true)
        const result = await getPendingPaymentOrders()
        if (result.data) {
            const newPending = result.data as PaymentOrder[]

            // Check for new pending payments (only for managers)
            if (!isInitialLoad.current && canManage) {
                newPending.forEach(auth => {
                    if (!knownPendingIds.current.has(auth.id)) {
                        toast(`Nuevo pago registrado para autorizar: ${auth.description}`, {
                            style: {
                                background: '#1e40af', // Blue 800
                                color: '#ffffff',
                                border: '1px solid #1d4ed8',
                                fontWeight: '600'
                            },
                        })
                    }
                })
            }

            setPendingOrders(newPending)
            knownPendingIds.current = new Set(newPending.map(a => a.id))
        }
        setLoading(false)
    }, [canManage])

    const fetchHistoryOrders = useCallback(async (isSilent = false) => {
        if (!isSilent) setHistoryLoading(true)
        const result = await getPaymentOrderHistory()
        if (result.data) {
            const newHistory = result.data as PaymentOrder[]

            // Check for status changes (new entries in history)
            if (!isInitialLoad.current) {
                newHistory.forEach(auth => {
                    if (!knownHistoryIds.current.has(auth.id)) {
                        // Notify ONLY if they are the creator
                        const isCreator = currentUserEmail && auth.created_by === currentUserEmail
                        const shouldNotify = isCreator

                        if (shouldNotify) {
                            if (auth.status === 'approved') {
                                toast(`Su pago de ${auth.description} ha sido aprobado`, {
                                    icon: <CheckCircle className="h-5 w-5 text-white" />,
                                    style: {
                                        background: '#059669', // Emerald 600
                                        color: '#ffffff',
                                        border: '1px solid #047857',
                                        fontWeight: '600'
                                    },
                                })
                            } else if (auth.status === 'rejected') {
                                toast(`Su pago de ${auth.description} ha sido rechazado`, {
                                    icon: <XCircle className="h-5 w-5 text-white" />,
                                    style: {
                                        background: '#dc2626', // Red 600
                                        color: '#ffffff',
                                        border: '1px solid #b91c1c',
                                        fontWeight: '600'
                                    },
                                })
                            }
                        }
                    }
                })
            }

            setHistoryOrders(newHistory)
            knownHistoryIds.current = new Set(newHistory.map(a => a.id))
            isInitialLoad.current = false
        }
        if (!isSilent) setHistoryLoading(false)
    }, [currentUserEmail])

    useEffect(() => {
        if (view === 'history' && open) {
            fetchHistoryOrders()
        }
    }, [view, open, fetchHistoryOrders])

    const refreshData = useCallback(async () => {
        if (!canAccess) return
        await fetchPendingOrders()
        await fetchHistoryOrders(true)
    }, [canAccess, fetchPendingOrders, fetchHistoryOrders])

    useEffect(() => {
        refreshData()
    }, [refreshData])

    useRealtime("payment_orders", refreshData)

    const handleItemClick = (order?: PaymentOrder) => {
        if (order) {
            const key = getSeenKey(order)
            if (!seenIds.includes(key)) {
                setSeenIds([...seenIds, key])
            }
        }
        setOpen(false)
        router.push("/dashboard/payment-orders")
    }

    const handleMarkAllAsRead = () => {
        // Mark ALL current notifications as read, not just the currently unread ones
        // This ensures they stay in history and don't pop back to pending if something changes
        const allNotifications = [
            ...pendingOrders,
            ...historyOrders
        ]

        if (allNotifications.length === 0) return

        const newKeys = allNotifications.map(a => getSeenKey(a))
        const updatedSeenIds = Array.from(new Set([...seenIds, ...newKeys]))

        setSeenIds(updatedSeenIds)
        setView('history')
        toast.success("Notificaciones marcadas como leídas y movidas al historial")
    }

    if (!canAccess) return null

    const unreadPendingOrders = pendingOrders.filter(a => !seenIds.includes(getSeenKey(a)))
    const unreadHistoryOrders = historyOrders.filter(a => {
        const isCreator = currentUserEmail && a.created_by === currentUserEmail
        const shouldBeNotified = isCreator // Restrict to creator only
        return shouldBeNotified && !seenIds.includes(getSeenKey(a))
    })

    const pendingCount = (canManage ? unreadPendingOrders.length : 0)
    const unreadHistoryCount = unreadHistoryOrders.length

    const totalUnreadCount = pendingCount + unreadHistoryCount

    const seenPendingOrders = pendingOrders.filter(a => seenIds.includes(getSeenKey(a)))
    const seenHistoryOrders = historyOrders.filter(a => seenIds.includes(getSeenKey(a)))
    const totalSeenCount = seenPendingOrders.length + seenHistoryOrders.length

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative ml-2">
                    <Bell className="h-5 w-5 text-foreground" />
                    {!loading && totalUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {totalUnreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex flex-col">
                            <h4 className="font-medium leading-none">Notificaciones</h4>
                            {totalUnreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 hover:underline cursor-pointer text-left w-fit p-0 bg-transparent border-0"
                                >
                                    Marcar todo como leído
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant={view === 'pending' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('pending')}
                                className="h-7 text-xs px-2 relative"
                            >
                                {pendingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                Pendientes
                            </Button>
                            <Button
                                variant={view === 'history' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('history')}
                                className="h-7 text-xs px-2 relative"
                            >
                                {unreadHistoryCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                                Historial
                            </Button>
                        </div>
                    </div>

                    {view === 'pending' ? (
                        <>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">
                                    {loading ? "Cargando..." : (
                                        totalUnreadCount > 0
                                            ? `Tienes ${totalUnreadCount} notificaciones sin leer.`
                                            : "No tienes notificaciones pendientes."
                                    )}
                                </p>
                            </div>
                            {!loading && totalUnreadCount > 0 ? (
                                <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                                    {/* Unread Status Changes (Approvals/Rejections) */}
                                    {unreadHistoryOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleItemClick(order)}
                                            className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-blue-800/30 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {order.status === 'approved' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )}
                                                <div className="grid gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm font-medium leading-none truncate max-w-[120px]">{order.description}</p>
                                                        <span className="bg-blue-600 dark:bg-blue-500 text-[8px] text-white px-1 rounded-full font-bold uppercase">NUEVO</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(order.date), "dd/MM/yyyy")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">
                                                    {order.currency === 'BS' ? 'Bs.' : '$'} {order.amount.toLocaleString('en-US')}
                                                </p>
                                                <span className={`text-[10px] uppercase font-bold ${order.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {order.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Actual Pending Payment Orders (Only for Managers) */}
                                    {canManage && unreadPendingOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => handleItemClick(order)}
                                        >
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none truncate max-w-[150px]">{order.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(order.date), "dd/MM/yyyy")}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {order.currency === 'BS' ? 'Bs.' : '$'} {order.amount.toLocaleString('en-US')}
                                                </p>
                                                <span className="text-[10px] uppercase font-bold text-blue-600/70 dark:text-blue-400/70">Pendiente</span>
                                            </div>
                                        </div>
                                    ))}

                                    {totalUnreadCount > 10 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full text-xs text-muted-foreground mt-2 h-auto py-2"
                                            onClick={() => handleItemClick()}
                                        >
                                            Ver todos en el tablero
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                !loading && (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                        Has leído todas las notificaciones.
                                    </div>
                                )
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Registro de notificaciones ya vistas.
                            </p>
                            {historyLoading ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">Cargando historial...</div>
                            ) : totalSeenCount > 0 ? (
                                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {/* Seen Status Changes */}
                                    {seenHistoryOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleItemClick(order)}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border cursor-pointer opacity-80"
                                        >
                                            <div className="flex items-center gap-2">
                                                {order.status === 'approved' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )}
                                                <div className="grid gap-1">
                                                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">{order.description}</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(order.date), "dd/MM/yyyy")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">
                                                    {order.currency === 'BS' ? 'Bs.' : '$'} {order.amount.toLocaleString('en-US')}
                                                </p>
                                                <span className={`text-[10px] uppercase font-bold ${order.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {order.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Seen Pending (Only for Managers) */}
                                    {canManage && seenPendingOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleItemClick(order)}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border cursor-pointer opacity-80"
                                        >
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none truncate max-w-[150px]">{order.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(order.date), "dd/MM/yyyy")}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">
                                                    {order.currency === 'BS' ? 'Bs.' : '$'} {order.amount.toLocaleString('en-US')}
                                                </p>
                                                <span className="text-[10px] uppercase font-bold text-blue-600/50">Pendiente</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    No hay notificaciones en el historial.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

