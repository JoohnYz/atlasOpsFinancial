"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createAuthorization, updateAuthorization } from "@/lib/actions"
import { toast } from "sonner"
import { Authorization } from "@/lib/types"
import { CategorySelect } from "@/components/category-select"

const formSchema = z.object({
    description: z.string().min(2, {
        message: "La descripción debe tener al menos 2 caracteres.",
    }),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El monto debe ser un número positivo.",
    }),
    date: z.date({
        required_error: "La fecha es requerida.",
    }),
    payment_method: z.string({
        required_error: "El método de pago es requerido.",
    }),
    bank_name: z.string().optional(),
    phone_number: z.string().optional(),
    document_type: z.string().optional(),
    document_number: z.string().optional(),
    currency: z.enum(["USD", "BS"]).optional(),
    account_number: z.string().optional(),
    email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
    category: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.payment_method === "Pago móvil" || data.payment_method === "Transferencia Bancaria") {
        if (!data.bank_name) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El banco es requerido.",
                path: ["bank_name"],
            })
        }
        if (!data.phone_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El número de teléfono es requerido.",
                path: ["phone_number"],
            })
        } else if (data.phone_number.length !== 11) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El número de teléfono debe tener 11 dígitos.",
                path: ["phone_number"],
            })
        }
        if (!data.document_type) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El tipo de documento es requerido.",
                path: ["document_type"],
            })
        }
        if (!data.document_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El número de documento es requerido.",
                path: ["document_number"],
            })
        }
    }

    if (data.payment_method === "Transferencia Bancaria") {
        if (!data.account_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El número de cuenta es requerido.",
                path: ["account_number"],
            })
        } else if (data.account_number.length !== 20) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El número de cuenta debe tener exactamente 20 dígitos.",
                path: ["account_number"],
            })
        }
    }

    if (data.payment_method === "Transferencia moneda extranjera") {
        if (!data.bank_name) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El banco es requerido.",
                path: ["bank_name"],
            })
        }
        if (!data.email) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El correo electrónico es requerido.",
                path: ["email"],
            })
        }
    }
})

interface AddAuthorizationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    authorizationToEdit?: Authorization | null
}

export function AddAuthorizationModal({ open, onOpenChange, authorizationToEdit }: AddAuthorizationModalProps) {
    const [isPending, setIsPending] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            amount: "",
            payment_method: "",
            bank_name: "",
            phone_number: "",
            document_type: "",
            document_number: "",
            currency: "USD",
            account_number: "",
            email: "",
            category: "other",
        },
    })

    const paymentMethod = form.watch("payment_method")
    const currency = form.watch("currency")

    // Reset form when modal opens/closes or edit item changes
    useEffect(() => {
        if (open) {
            if (authorizationToEdit) {
                form.reset({
                    description: authorizationToEdit.description,
                    amount: authorizationToEdit.amount.toString(),
                    date: new Date(authorizationToEdit.date),
                    payment_method: authorizationToEdit.payment_method,
                    bank_name: authorizationToEdit.bank_name || "",
                    phone_number: authorizationToEdit.phone_number || "",
                    document_type: authorizationToEdit.document_type || "",
                    document_number: authorizationToEdit.document_number || "",
                    currency: authorizationToEdit.currency || "USD",
                    account_number: authorizationToEdit.account_number || "",
                    email: authorizationToEdit.email || "",
                    category: authorizationToEdit.category || "other",
                })
            } else {
                form.reset({
                    description: "",
                    amount: "",
                    date: new Date(),
                    payment_method: "",
                    bank_name: "",
                    phone_number: "",
                    document_type: "",
                    document_number: "",
                    currency: "USD",
                    account_number: "",
                    email: "",
                    category: "other",
                })
            }
        }
    }, [open, authorizationToEdit, form])

    // Enforce currency based on payment method
    useEffect(() => {
        if (paymentMethod === "Transferencia moneda extranjera") {
            form.setValue("currency", "USD")
        } else if (paymentMethod) {
            form.setValue("currency", "BS")
        }
    }, [paymentMethod, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true)
        try {
            const formData = new FormData()
            formData.append("description", values.description)
            formData.append("amount", values.amount)
            formData.append("date", format(values.date, "yyyy-MM-dd"))
            formData.append("payment_method", values.payment_method)
            formData.append("currency", values.currency || "USD")
            if (values.category) formData.append("category", values.category)

            if (values.payment_method === "Pago móvil" || values.payment_method === "Transferencia Bancaria") {
                if (values.bank_name) formData.append("bank_name", values.bank_name)
                if (values.phone_number) formData.append("phone_number", values.phone_number)
                if (values.document_type) formData.append("document_type", values.document_type)
                if (values.document_number) formData.append("document_number", values.document_number)

                if (values.payment_method === "Transferencia Bancaria" && values.account_number) {
                    formData.append("account_number", values.account_number)
                }
            }

            if (values.payment_method === "Transferencia moneda extranjera") {
                if (values.bank_name) formData.append("bank_name", values.bank_name)
                if (values.email) formData.append("email", values.email)
            }

            let result
            if (authorizationToEdit) {
                result = await updateAuthorization(authorizationToEdit.id, formData)
            } else {
                result = await createAuthorization(formData)
            }

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(authorizationToEdit ? "Autorización actualizada" : "Autorización creada correctamente")
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{authorizationToEdit ? "Editar Pago" : "Agregar Nuevo Pago"}</DialogTitle>
                    <DialogDescription>
                        {authorizationToEdit ? "Edita los detalles del pago." : "Ingresa los detalles del pago a autorizar."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Primer Apartado: Descripción y Fecha */}
                        <div className="grid gap-4 py-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Pago de proveedores" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha</FormLabel>
                                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                        field.onChange(date)
                                                        // Keep open for confirmation
                                                    }}
                                                    initialFocus
                                                />
                                                <div className="p-2 border-t border-border">
                                                    <Button
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                        size="sm"
                                                        onClick={() => setIsCalendarOpen(false)}
                                                    >
                                                        Listo
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Apartado de Categoría */}
                        <div className="py-2 border-t pt-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <CategorySelect
                                                value={field.value || "other"}
                                                onChange={field.onChange}
                                                label="Categoría del Pago"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Segundo Apartado: Datos de Pago */}
                        <div className="grid gap-4 py-2 border-t pt-4">
                            <FormField
                                control={form.control}
                                name="payment_method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Método de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un método" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Pago móvil">Pago móvil</SelectItem>
                                                <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                                                <SelectItem value="Transferencia moneda extranjera">Transferencia moneda extranjera</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            {(paymentMethod === "Pago móvil" || paymentMethod === "Transferencia Bancaria") && (
                                <div className="space-y-4 bg-muted/50 p-4 rounded-md border border-border">
                                    <FormField
                                        control={form.control}
                                        name="bank_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Banco</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. Banco de Venezuela" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número de Teléfono (11 dígitos)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej. 04141234567" maxLength={11} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {paymentMethod === "Transferencia Bancaria" && (
                                            <FormField
                                                control={form.control}
                                                name="account_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Número de Cuenta (20 dígitos)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej. 0102..." maxLength={20} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="document_type"
                                            render={({ field }) => (
                                                <FormItem className="col-span-1">
                                                    <FormLabel>Tipo de Doc.</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Tipo" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="V">V</SelectItem>
                                                            <SelectItem value="E">E</SelectItem>
                                                            <SelectItem value="J">J</SelectItem>
                                                            <SelectItem value="G">G</SelectItem>
                                                            <SelectItem value="R">R</SelectItem>
                                                            <SelectItem value="P">P</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="document_number"
                                            render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>Número de Documento</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ej. 12345678"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const value = e.target.value.replace(/\D/g, "")
                                                                field.onChange(value)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "Transferencia moneda extranjera" && (
                                <div className="space-y-4 bg-muted/50 p-4 rounded-md border border-border">
                                    <FormField
                                        control={form.control}
                                        name="bank_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Banco</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. Bank of America" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Correo Electrónico</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. ejemplo@correo.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Moneda</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                                disabled={true}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Moneda" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="BS">BS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="col-span-3">
                                            <FormLabel>Monto</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-500">
                                                        {currency === 'BS' ? 'Bs.' : '$'}
                                                    </span>
                                                    <Input type="number" step="0.01" placeholder="0.00" className="pl-8" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {authorizationToEdit ? "Guardar Cambios" : "Guardar Pago"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
