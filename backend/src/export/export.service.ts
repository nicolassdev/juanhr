import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private fmt(min: number) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }

  private fmtDate(d: Date) {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-PH');
  }

  private fmtDateOnly(d: Date) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async exportExcel(userId: number, month: string, year: string, res: Response) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId }, include: { role: true, department: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month - 1 : new Date().getMonth();
    const records = await this.prisma.dtr.findMany({
      where: { userId, date: { gte: new Date(y, m, 1), lte: new Date(y, m + 1, 0) } },
      orderBy: { date: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('DTR');

    // Header
    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = 'DAILY TIME RECORD (DTR)';
    ws.getCell('A1').font = { bold: true, size: 16 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = `${user.fullName} | ${user.role.label} | ${user.department?.name || '-'}`;
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = `Period: ${new Date(y, m).toLocaleString('en-PH', { month: 'long', year: 'numeric' })}`;
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]);

    const headerRow = ws.addRow(['Date', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Total Hours', 'Status']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2340' } };
    headerRow.font = { bold: true, color: { argb: 'FF00D4FF' } };

    ws.columns = [
      { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 15 }, { width: 12 },
    ];

    records.forEach(r => {
      const row = ws.addRow([
        this.fmtDateOnly(r.date),
        this.fmtDate(r.amIn),
        this.fmtDate(r.amOut),
        this.fmtDate(r.pmIn),
        this.fmtDate(r.pmOut),
        r.totalMinutes ? this.fmt(r.totalMinutes) : '-',
        r.status.toUpperCase(),
      ]);
      const statusColor = r.status === 'late' ? 'FFFBBF24' : r.status === 'present' ? 'FF22C55E' : 'FFFF5050';
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } };
    });

    const totalMin = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
    ws.addRow([]);
    const sumRow = ws.addRow(['', '', '', '', 'TOTAL HOURS:', this.fmt(totalMin), '']);
    sumRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=DTR_${user.fullName}_${y}_${m + 1}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  }

  async exportPdf(userId: number, month: string, year: string, res: Response) {
    const user = await this.prisma.user.findFirst({ where: { id: userId }, include: { role: true, department: true } });
    if (!user) throw new NotFoundException('User not found');

    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month - 1 : new Date().getMonth();
    const records = await this.prisma.dtr.findMany({
      where: { userId, date: { gte: new Date(y, m, 1), lte: new Date(y, m + 1, 0) } },
      orderBy: { date: 'asc' },
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=DTR_${user.fullName}_${y}_${m + 1}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('DAILY TIME RECORD', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(`Name: ${user.fullName}`, { align: 'center' });
    doc.text(`Role: ${user.role.label}  |  Department: ${user.department?.name || '-'}`, { align: 'center' });
    doc.text(`Period: ${new Date(y, m).toLocaleString('en-PH', { month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown();

    // Table header
    const cols = [60, 110, 110, 100, 100, 70, 60];
    const headers = ['Date', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Hours', 'Status'];
    let x = doc.page.margins.left;
    const y0 = doc.y;
    doc.rect(x, y0, cols.reduce((a, b) => a + b, 0), 20).fill('#1A2340');
    headers.forEach((h, i) => {
      doc.fillColor('#00D4FF').font('Helvetica-Bold').fontSize(9)
        .text(h, x + 2, y0 + 5, { width: cols[i], align: 'center' });
      x += cols[i];
    });
    doc.moveDown(1.5);

    records.forEach((r, idx) => {
      x = doc.page.margins.left;
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(x, rowY - 2, cols.reduce((a, b) => a + b, 0), 18).fill('#0E1220');
      const cells = [
        this.fmtDateOnly(r.date),
        r.amIn ? new Date(r.amIn).toLocaleTimeString('en-PH') : '-',
        r.amOut ? new Date(r.amOut).toLocaleTimeString('en-PH') : '-',
        r.pmIn ? new Date(r.pmIn).toLocaleTimeString('en-PH') : '-',
        r.pmOut ? new Date(r.pmOut).toLocaleTimeString('en-PH') : '-',
        r.totalMinutes ? this.fmt(r.totalMinutes) : '-',
        r.status.toUpperCase(),
      ];
      cells.forEach((c, i) => {
        doc.fillColor('#DDE3F0').font('Helvetica').fontSize(8)
          .text(c, x + 2, rowY, { width: cols[i], align: 'center' });
        x += cols[i];
      });
      doc.moveDown(0.9);
    });

    doc.moveDown();
    const totalMin = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
    doc.fillColor('#00D4FF').font('Helvetica-Bold').fontSize(11)
      .text(`Total Hours Rendered: ${this.fmt(totalMin)}`, { align: 'right' });
    doc.fillColor('#5A6A8A').fontSize(8)
      .text(`Generated: ${new Date().toLocaleString('en-PH')}`, { align: 'right' });

    doc.end();
  }
}
