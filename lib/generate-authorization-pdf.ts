import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Authorization } from "@/lib/types"
import { format } from "date-fns"

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
    })
}

export const generateAuthorizationPDF = async (authorization: Authorization) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Pre-load images
    let logoImg: HTMLImageElement | null = null
    let signatureImg: HTMLImageElement | null = null

    try {
        logoImg = await loadImage('/logo.png')
    } catch (e) {
        console.error("Could not load logo", e)
    }

    try {
        signatureImg = await loadImage('/signature.png')
    } catch (e) {
        console.error("Could not load signature", e)
    }

    // Add Logo
    if (logoImg) {
        try {
            doc.addImage(logoImg, 'PNG', 15, 10, 25, 25) // x, y, width, height (Square aspect ratio)
        } catch (e) {
            console.error("Could not add logo to PDF", e)
        }
    }

    // Title (Centered)
    doc.setFontSize(18)
    doc.text("Comprobante de Autorización", 105, 20, { align: "center" })

    // Company/System Name (Centered)
    doc.setFontSize(12)
    doc.text("AtlasOps Financial", 105, 28, { align: "center" })

    // 1. General Information Table
    const generalData = [
        ["Descripción", authorization.description],
        ["Categoría", authorization.category || "General"],
        ["Fecha de Solicitud", format(new Date(authorization.created_at), "dd/MM/yyyy HH:mm")],
        ["Fecha de Aprobación", authorization.updated_at ? format(new Date(authorization.updated_at), "dd/MM/yyyy HH:mm") : format(new Date(), "dd/MM/yyyy HH:mm")],
        ["Estado", authorization.status === 'approved' ? 'Aprobado' : 'Pendiente'],
    ]

    autoTable(doc, {
        startY: 40,
        head: [[{ content: 'Información de la Solicitud', colSpan: 2, styles: { halign: 'center', fillColor: [51, 65, 85] } }]],
        body: generalData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] } }
    })

    // 2. Payment Details Table
    const paymentData: any[][] = [
        ["Método de Pago", authorization.payment_method],
    ]

    if (authorization.bank_name) paymentData.push(["Banco", authorization.bank_name])
    if (authorization.phone_number) paymentData.push(["Teléfono", authorization.phone_number])
    if (authorization.account_number) paymentData.push(["Número de Cuenta", authorization.account_number])
    if (authorization.document_type && authorization.document_number) {
        paymentData.push(["Documento", `${authorization.document_type}-${authorization.document_number}`])
    }
    if (authorization.email) paymentData.push(["Email", authorization.email])

    // Final total row styling
    paymentData.push([
        { content: "MONTO TOTAL", styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
        { content: `${authorization.currency === 'BS' ? 'Bs.' : '$'} ${authorization.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: [30, 58, 138] } }
    ])

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [[{ content: 'Detalles del Pago y Beneficiario', colSpan: 2, styles: { halign: 'center', fillColor: [51, 65, 85] } }]],
        body: paymentData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] } }
    })

    // Footer Signature
    const finalY = (doc as any).lastAutoTable.finalY + 35
    if (finalY < 250) {
        // Add Signature Image
        if (signatureImg) {
            try {
                // Adjust size as needed, e.g., 40x20
                const sigWidth = 40
                const sigHeight = 20
                doc.addImage(signatureImg, 'PNG', (210 - sigWidth) / 2, finalY - 25, sigWidth, sigHeight)
            } catch (e) {
                console.error("Could not add signature image to PDF", e)
            }
        }

        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text("Firma Autorizada", 105, finalY, { align: "center" })
        doc.line(70, finalY - 5, 140, finalY - 5)
    }

    // Footer and Watermark logic (Decorations)
    const addPageDecorations = () => {
        const pageCount = (doc as any).internal.getNumberOfPages()

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)

            // 1. Watermark (Background)
            if (logoImg) {
                try {
                    const wmWidth = pageWidth * 0.6
                    const wmHeight = wmWidth // Square aspect ratio
                    const x = (pageWidth - wmWidth) / 2
                    const y = (pageHeight - wmHeight) / 2

                    doc.saveGraphicsState()
                    doc.setGState(new (doc as any).GState({ opacity: 0.25 }))
                    doc.addImage(logoImg, 'PNG', x, y, wmWidth, wmHeight)
                    doc.restoreGraphicsState()
                } catch (e) {
                    console.error("Error adding watermark to page " + i, e)
                }
            }

            // 2. Footer
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.setFont("helvetica", "normal")
            const footerText = `Página ${i} de ${pageCount} - AtlasOps Financial`
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" })
        }
    }

    addPageDecorations()

    // Save
    doc.save(`autorizacion-${authorization.id.slice(0, 8)}.pdf`)
}
