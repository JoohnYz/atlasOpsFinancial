"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import type { Expense, Income, PayrollPayment } from "@/lib/types"

interface ExportPDFButtonProps {
  incomes: Income[]
  expenses: Expense[]
  payroll: PayrollPayment[]
  companyName?: string
}

export function ExportPDFButton({ incomes, expenses, payroll, companyName = "AtlasOps Financial" }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Header
      // Add Logo
      const logoUrl = '/logo.png'
      const img = new Image()
      img.src = logoUrl

      try {
        doc.addImage(img, 'PNG', 15, 10, 25, 25)
      } catch (e) {
        console.error("Could not add logo", e)
      }

      // Title (Centered)
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text("Reporte Financiero", 105, 20, { align: "center" })

      // Company Name
      doc.setFontSize(12)
      doc.text(companyName, 105, 28, { align: "center" })

      // Date
      // Date removed per request

      let yPosition = 60

      // Summary
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Resumen Ejecutivo", 14, yPosition)
      yPosition += 10

      const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      const totalPayroll = payroll
        .filter((p) => p.status === "paid" || p.status === "Pagado")
        .reduce((sum, p) => sum + Number(p.net_salary || p.amount || 0), 0)
      const balance = totalIncome - totalExpenses - totalPayroll

      const summaryData = [
        ["Total Ingresos", `$${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
        ["Total Gastos", `$${totalExpenses.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
        ["Total Nómina", `$${totalPayroll.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
        ["Balance", `$${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [["Concepto", "Monto"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          1: { halign: "right", fontStyle: "bold" },
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Check if new page needed
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      // Income details
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(16, 185, 129) // green
      doc.text("Detalle de Ingresos", 14, yPosition)
      yPosition += 5

      const incomeData = incomes.map((inc) => [
        inc.client || inc.description || "N/A",
        new Date(inc.date).toLocaleDateString("es-MX"),
        `$${Number(inc.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [["Fuente", "Fecha", "Monto"]],
        body: incomeData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          2: { halign: "right", fontStyle: "bold" },
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Check if new page needed
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      // Expense details
      doc.setTextColor(239, 68, 68) // red
      doc.text("Detalle de Gastos", 14, yPosition)
      yPosition += 5

      const expenseData = expenses.map((exp) => [
        exp.description || "N/A",
        exp.category || "N/A",
        new Date(exp.date).toLocaleDateString("es-MX"),
        `$${Number(exp.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [["Descripción", "Categoría", "Fecha", "Monto"]],
        body: expenseData,
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          3: { halign: "right", fontStyle: "bold" },
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Check if new page needed
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      // Payroll details
      doc.setTextColor(59, 130, 246) // blue
      doc.text("Detalle de Nómina", 14, yPosition)
      yPosition += 5

      const payrollData = payroll.map((p) => [
        p.employee_name || p.staff_name || "N/A",
        p.period || "N/A",
        new Date(p.payment_date || p.date).toLocaleDateString("es-MX"),
        p.status === "Pagado" || p.status === "paid" ? "Pagado" : "Pendiente",
        `$${Number(p.net_salary || p.amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [["Empleado", "Período", "Fecha de Pago", "Estado", "Monto"]],
        body: payrollData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          4: { halign: "right", fontStyle: "bold" },
        },
      })

      // Helper to add watermark and footer
      const addPageDecorations = () => {
        const pageCount = (doc as any).internal.getNumberOfPages()
        const imgLogo = new Image()
        imgLogo.src = '/logo.png'

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)

          // 1. Watermark (Background)
          try {
            const wmWidth = pageWidth * 0.6
            const wmHeight = wmWidth // Assuming square for simplicity, or we could calculate ratio
            const x = (pageWidth - wmWidth) / 2
            const y = (pageHeight - wmHeight) / 2

            doc.saveGraphicsState()
            doc.setGState(new (doc as any).GState({ opacity: 0.25 }))
            doc.addImage(imgLogo, 'PNG', x, y, wmWidth, wmHeight)
            doc.restoreGraphicsState()
          } catch (e) {
            console.error("Error adding watermark to page " + i, e)
          }

          // 2. Footer
          doc.setFontSize(10)
          doc.setTextColor(100)
          doc.setFont("helvetica", "normal")
          const footerText = `Página ${i} de ${pageCount} - AtlasOps Financial`
          doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" })
        }
      }

      // Add decorations to all pages
      addPageDecorations()

      // Save PDF
      doc.save(`Reporte-Financiero-${companyName}-${new Date().getTime()}.pdf`)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isGenerating} variant="outline" className="border-border bg-transparent">
      <Download className="w-4 h-4 mr-2" />
      {isGenerating ? "Generando PDF..." : "Exportar PDF"}
    </Button>
  )
}
