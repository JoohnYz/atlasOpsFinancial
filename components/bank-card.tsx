"use client"

import { Landmark, MoreHorizontal, Pencil, Trash, Mail, Phone, CreditCard, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Bank } from "@/lib/types"

interface BankCardProps {
    bank: Bank
    onEdit: (bank: Bank) => void
    onDelete: (bank: Bank) => void
    canManage?: boolean
}

export function BankCard({ bank, onEdit, onDelete, canManage = true }: BankCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow bg-card border-border">
            <CardContent className="p-0">
                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                            <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {canManage && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menú</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onEdit(bank)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(bank)}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                    >
                                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h3 className="text-lg font-bold text-foreground leading-tight">{bank.bank_name}</h3>
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                                <User className="w-3.5 h-3.5" />
                                {bank.account_holder}
                            </p>
                        </div>

                        <div className="pt-2 border-t border-border grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CreditCard className="w-4 h-4 text-blue-500/70" />
                                <span>{bank.document_type}: {bank.document_number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                                <Mail className="w-4 h-4 text-blue-500/70 flex-shrink-0" />
                                <span className="truncate" title={bank.email}>{bank.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 text-blue-500/70" />
                                <span>{bank.phone_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
