"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, RotateCcw, Eye, FileText, Download, Calendar, User, Info, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { UploadedFile, getFileHistory, getDeletedFiles, moveToTrash, restoreFromTrash, permanentlyDeleteFile, getTransactionDetails } from "@/lib/file-actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FileHistoryProps {
    userEmail: string | null
}

const moduleLabels: Record<string, string> = {
    payroll: "Nómina",
    expense: "Gastos",
    income: "Ingresos",
    orders: "Órdenes de Pago",
    other: "Otros"
}

export function FileHistorySection({ userEmail }: FileHistoryProps) {
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [deletedFiles, setDeletedFiles] = useState<UploadedFile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [moduleFilter, setModuleFilter] = useState("all")
    const [viewState, setViewState] = useState<"history" | "trash">("history")

    // Transaction Modal State
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
    const [transactionData, setTransactionData] = useState<any>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    const isAdmin = userEmail === "admin@atlasops.com"

    const loadFiles = async () => {
        setLoading(true)
        const res = await getFileHistory({ searchTerm, module: moduleFilter })
        if (res.success) {
            setFiles(res.data)
        }
        setLoading(false)
    }

    const loadDeletedFiles = async () => {
        if (!isAdmin) return
        setLoading(true)
        const res = await getDeletedFiles()
        if (res.success) {
            setDeletedFiles(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (viewState === "history") {
            loadFiles()
        } else {
            loadDeletedFiles()
        }
    }, [searchTerm, moduleFilter, viewState])

    const handleMoveToTrash = async (id: string, fileName: string) => {
        const res = await moveToTrash(id)
        if (res.success) {
            toast.success(`"${fileName}" movido a la papelera`)
            loadFiles()
        } else {
            toast.error(res.error || "Error al mover a la papelera")
        }
    }

    const handleRestore = async (id: string, fileName: string) => {
        const res = await restoreFromTrash(id)
        if (res.success) {
            toast.success(`"${fileName}" restaurado correctamente`)
            loadDeletedFiles()
            loadFiles() // Background update so it's ready if they switch back
        } else {
            toast.error(res.error || "Error al restaurar")
        }
    }

    const handlePermanentDelete = async (id: string, fileUrl: string, bucket: string, fileName: string) => {
        const res = await permanentlyDeleteFile(id, fileUrl, bucket)
        if (res.success) {
            toast.success(`"${fileName}" eliminado permanentemente`)
            loadDeletedFiles()
        } else {
            toast.error(res.error || "Error al eliminar")
        }
    }

    const openTransactionDetails = async (file: UploadedFile) => {
        setSelectedFile(file)
        setTransactionData(null)
        setLoadingDetails(true)

        if (file.transaction_id) {
            const res = await getTransactionDetails(file.module, file.transaction_id)
            if (res.success) {
                setTransactionData(res.data)
            } else {
                toast.error("Error al cargar los detalles de la transacción")
            }
        }
        setLoadingDetails(false)
    }

    const renderTransactionDetails = () => {
        if (loadingDetails) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando detalles...</div>
        if (!transactionData) return <div className="p-8 text-center text-muted-foreground">No hay detalles de transacción disponibles para este archivo.</div>
        if (transactionData.info) return <div className="p-8 text-center text-muted-foreground">{transactionData.info}</div>

        switch (selectedFile?.module) {
            case "payroll":
                return (
                    <div className="space-y-4 text-sm mt-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Información del Pago de Nómina</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-muted-foreground">Empleado:</span> <p className="font-medium text-base">{transactionData.employee_name}</p></div>
                            <div><span className="text-muted-foreground">Departamento:</span> <p className="font-medium">{transactionData.department || 'N/A'}</p></div>
                            <div><span className="text-muted-foreground">Monto:</span> <p className="font-medium text-green-500">${Number(transactionData.amount).toFixed(2)}</p></div>
                            <div><span className="text-muted-foreground">Sueldo Neto:</span> <p className="font-medium">${Number(transactionData.net_salary || transactionData.amount).toFixed(2)}</p></div>
                            <div><span className="text-muted-foreground">Período:</span> <p className="font-medium">{transactionData.period}</p></div>
                            <div><span className="text-muted-foreground">Fecha de Pago:</span> <p className="font-medium">{new Date(transactionData.date).toLocaleDateString()}</p></div>
                            <div><span className="text-muted-foreground">Estado:</span> <Badge variant="outline">{transactionData.status}</Badge></div>
                        </div>
                    </div>
                )
            case "expense":
                return (
                    <div className="space-y-4 text-sm mt-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Detalles del Gasto</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><span className="text-muted-foreground">Descripción:</span> <p className="font-medium text-base">{transactionData.description}</p></div>
                            <div><span className="text-muted-foreground">Monto:</span> <p className="font-medium text-red-500">${Number(transactionData.amount).toFixed(2)}</p></div>
                            <div><span className="text-muted-foreground">Categoría:</span> <Badge variant="secondary">{transactionData.category}</Badge></div>
                            <div><span className="text-muted-foreground">Beneficiario/Proveedor:</span> <p className="font-medium">{transactionData.vendor || 'N/A'}</p></div>
                            <div><span className="text-muted-foreground">Fecha:</span> <p className="font-medium">{new Date(transactionData.date).toLocaleDateString()}</p></div>
                            <div className="col-span-2"><span className="text-muted-foreground">Notas:</span> <p className="font-medium">{transactionData.notes || 'Ninguna'}</p></div>
                        </div>
                    </div>
                )
            case "income":
                return (
                    <div className="space-y-4 text-sm mt-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Detalles del Ingreso</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><span className="text-muted-foreground">Descripción:</span> <p className="font-medium text-base">{transactionData.description}</p></div>
                            <div><span className="text-muted-foreground">Monto:</span> <p className="font-medium text-green-500">${Number(transactionData.amount).toFixed(2)}</p></div>
                            <div><span className="text-muted-foreground">Categoría:</span> <Badge variant="secondary">{transactionData.category}</Badge></div>
                            <div><span className="text-muted-foreground">Cliente/Fuente:</span> <p className="font-medium">{transactionData.client || transactionData.source || 'N/A'}</p></div>
                            <div><span className="text-muted-foreground">Fecha:</span> <p className="font-medium">{new Date(transactionData.date).toLocaleDateString()}</p></div>
                        </div>
                    </div>
                )
            case "orders":
                return (
                    <div className="space-y-4 text-sm mt-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Orden de Pago</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><span className="text-muted-foreground">Descripción:</span> <p className="font-medium text-base">{transactionData.description}</p></div>
                            <div><span className="text-muted-foreground">Monto:</span> <p className="font-medium text-orange-500">{transactionData.currency === 'USD' ? '$' : 'Bs.'} {Number(transactionData.amount).toFixed(2)}</p></div>
                            <div><span className="text-muted-foreground">Método:</span> <p className="font-medium">{transactionData.payment_method}</p></div>
                            <div><span className="text-muted-foreground">Aprobado Por:</span> <p className="font-medium">{transactionData.approved_by || 'N/A'}</p></div>
                            <div><span className="text-muted-foreground">Fecha:</span> <p className="font-medium">{new Date(transactionData.date).toLocaleDateString()}</p></div>
                            <div className="col-span-2"><span className="text-muted-foreground">Beneficiario (Banco):</span> <p className="font-medium">{transactionData.bank_name || 'N/A'} - {transactionData.account_number || transactionData.phone_number}</p></div>
                        </div>
                    </div>
                )
            default:
                return <div className="p-4 bg-secondary rounded-md"><pre className="text-xs overflow-auto">{JSON.stringify(transactionData, null, 2)}</pre></div>
        }
    }

    const renderFileGrid = (fileList: UploadedFile[]) => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-secondary/30 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            )
        }

        if (fileList.length === 0) {
            return (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-secondary/20">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No se encontraron archivos</p>
                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileList.map(file => (
                    <Card key={file.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1 overflow-hidden pr-2">
                                <CardTitle className="text-base truncate cursor-pointer hover:text-primary transition-colors" title={file.file_name} onClick={() => openTransactionDetails(file)}>
                                    {file.file_name}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {moduleLabels[file.module] || file.module}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground truncate">{file.bucket}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end shrink-0">
                                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary p-1">
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(new Date(file.upload_date), "dd/MMM/yyyy HH:mm", { locale: es })}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate" title={file.uploaded_by}>
                                    <User className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{file.uploaded_by}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openTransactionDetails(file)}>
                                    <Eye className="w-3.5 h-3.5" /> Detalles
                                </Button>

                                {viewState === "history" ? (
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleMoveToTrash(file.id, file.file_name); }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                ) : (
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); handleRestore(file.id, file.file_name); }}>
                                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto borrará "{file.file_name}" físicamente del servidor y de la base de datos.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handlePermanentDelete(file.id, file.file_url, file.bucket, file.file_name)}>
                                                        Sí, Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex flex-1 w-full gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o usuario..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Todos los módulos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los módulos</SelectItem>
                            <SelectItem value="payroll">Nómina</SelectItem>
                            <SelectItem value="expense">Gastos</SelectItem>
                            <SelectItem value="income">Ingresos</SelectItem>
                            <SelectItem value="orders">Órdenes de Pago</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant={viewState === "history" ? "default" : "outline"}
                        className="flex-1 sm:flex-none"
                        onClick={() => { setViewState("history"); setSearchTerm(""); setModuleFilter("all"); }}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Archivos Activos
                    </Button>

                    {isAdmin && (
                        <Button
                            variant={viewState === "trash" ? "destructive" : "outline"}
                            className={`flex-1 sm:flex-none ${viewState !== 'trash' ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' : ''}`}
                            onClick={() => { setViewState("trash"); setSearchTerm(""); setModuleFilter("all"); }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Papelera
                        </Button>
                    )}
                </div>
            </div>

            <div className="min-h-[400px]">
                {viewState === "trash" && (
                    <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-md flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 shrink-0" />
                        <p><strong>Área de Papelera:</strong> Los archivos aquí pueden ser restaurados o eliminados permanentemente del almacenamiento.</p>
                    </div>
                )}
                {renderFileGrid(viewState === "history" ? files : deletedFiles)}
            </div>

            <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-secondary/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl">{selectedFile?.file_name}</DialogTitle>
                                <DialogDescription asChild>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {selectedFile && format(new Date(selectedFile.upload_date), "dd/MMM/yyyy HH:mm:ss", { locale: es })}</span>
                                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {selectedFile?.uploaded_by}</span>
                                        <Badge variant="outline" className="ml-2 font-normal bg-background">{selectedFile ? moduleLabels[selectedFile.module] || selectedFile.module : ''}</Badge>
                                    </div>
                                </DialogDescription>
                            </div>
                            <Button asChild className="gap-2">
                                <a href={selectedFile?.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                    Descargar Original
                                </a>
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Split View: Left side details, Right side preview (if image/pdf) */}
                        <div className="w-full lg:w-1/3 border-r bg-card p-6 overflow-y-auto shrink-0 flex flex-col">
                            {renderTransactionDetails()}
                        </div>

                        <div className="flex-1 bg-muted/30 p-4 lg:p-6 overflow-hidden flex flex-col relative">
                            <div className="absolute inset-0 p-4 lg:p-6 flex flex-col">
                                <div className="flex-1 bg-white border shadow-sm rounded-lg overflow-hidden flex items-center justify-center relative group">
                                    {selectedFile?.file_url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                                        <img src={selectedFile.file_url} alt={selectedFile.file_name} className="max-w-full max-h-full object-contain p-2" />
                                    ) : selectedFile?.file_url.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={`${selectedFile.file_url}#toolbar=0`} className="w-full h-full border-0" title="PDF Preview" />
                                    ) : (
                                        <div className="text-center text-muted-foreground flex flex-col items-center p-8">
                                            <FileText className="w-24 h-24 mb-4 opacity-20" />
                                            <p className="text-lg font-medium text-foreground">Vista previa no disponible</p>
                                            <p className="max-w-sm mt-2">Este tipo de archivo no se puede previsualizar en el navegador. Por favor, descárgalo para verlo.</p>
                                            <Button asChild className="mt-6 shadow-sm gap-2" variant="outline">
                                                <a href={selectedFile?.file_url} target="_blank" rel="noopener noreferrer">
                                                    Descargar Archivo <Download className="w-4 h-4 ml-1" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
