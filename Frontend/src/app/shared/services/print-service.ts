import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FacturaPdfData } from '../models/pdfInterfaz';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  print(encabezado: string[], cuerpo: Array<any>, titulo: string, guardar?: boolean) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'letter'
    });
    doc.text(titulo, doc.internal.pageSize.width / 2, 25, { align: 'center' });

    autoTable(doc, {
      head: [encabezado],
      body: cuerpo
    });
    if (guardar) {
      const hoy = new Date();
      doc.save(hoy.getDate() + hoy.getMonth() + hoy.getFullYear() + hoy.getTime() + '.pdf');
    }
  }


  printFactura(data: FacturaPdfData, guardar = true) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 32;
    const marginRight = 32;

    // ===== ENCABEZADO (Nombre negocio + título factura) =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Equipos Rummi', marginLeft, 40); // cambia nombre

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('300mts Norte de la iglesia católica de barva a 450 oeste, Heredia, Costa Rica', marginLeft, 56);
    doc.text('Tel: 8591-0225  •  Rumi@erc.com', marginLeft, 70);

    // Datos de factura, lado derecho
    doc.setFont('helvetica', 'bold');
    doc.text(`Factura N°: ${data.numero}`, pageWidth - marginRight, 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    const fechaStr = data.fecha.toLocaleDateString();
    doc.text(`Fecha: ${fechaStr}`, pageWidth - marginRight, 56, { align: 'right' });

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 80, pageWidth - marginRight, 80);

    // ===== DATOS DEL CLIENTE =====
    let currentY = 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Datos del cliente', marginLeft, currentY);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    currentY += 18;
    doc.text(`Nombre: ${data.clienteNombre}`, marginLeft, currentY);

    if (data.clienteCorreo) {
      currentY += 14;
      doc.text(`Correo: ${data.clienteCorreo}`, marginLeft, currentY);
    }

    if (data.clienteDireccion) {
      currentY += 14;
      doc.text(`Dirección: ${data.clienteDireccion}`, marginLeft, currentY);
    }

    // ===== TABLA DE PRODUCTOS =====
    const startTableY = currentY + 24;

    const body = data.items.map(it => ([
      it.descripcion,
      it.cantidad.toString(),
      `₡ ${it.precioUnitario.toFixed(2)}`,
      `₡ ${(it.cantidad * it.precioUnitario).toFixed(2)}`
    ]));

    autoTable(doc, {
      startY: startTableY,
      head: [['Producto', 'Cant.', 'Precio Unitario', 'Subtotal']],
      body,
      theme: 'grid',
      styles: {
        fontSize: 9,          // un poquito más pequeño
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 160 }, // baja un poco este
        1: { cellWidth: 40 },
        2: { cellWidth: 70 },
        3: { cellWidth: 70 }
      }
    });

    // Última posición de la tabla
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY || startTableY + 20;

    // ===== TOTALES =====
    const boxX = pageWidth - marginRight - 160;
    let boxY = finalY + 16;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    doc.text('Subtotal:', boxX, boxY);
    doc.text(`₡ ${data.subtotal.toFixed(2)}`, pageWidth - marginRight, boxY, { align: 'right' });

    boxY += 14;
    doc.text('Impuestos:', boxX, boxY);
    doc.text(`₡ ${data.impuestos.toFixed(2)}`, pageWidth - marginRight, boxY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    boxY += 18;
    doc.text('Total a pagar:', boxX, boxY);
    doc.text(`₡ ${data.total.toFixed(2)}`, pageWidth - marginRight, boxY, { align: 'right' });

    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Gracias por su compra.', marginLeft, boxY + 30);

    if (guardar) {
      const hoy = new Date();
      const nombre = `Factura_${data.numero}_${hoy.getTime()}.pdf`;
      doc.save(nombre);
    } else {
      
    }
  }
}
