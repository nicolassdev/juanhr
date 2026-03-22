import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as ExcelJS from "exceljs";
import * as PDFDocument from "pdfkit";
import { Response } from "express";

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private fmt(min: number) {
    if (!min) return "0h 0m";
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }

  private fmtTime(d: Date | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  private fmtDate(d: Date | null): string {
    if (!d) return "—";
    const dt = new Date(d);
    // Use UTC values so the date matches what was stored
    return new Date(
      dt.getUTCFullYear(),
      dt.getUTCMonth(),
      dt.getUTCDate(),
    ).toLocaleDateString("en-PH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private async getRecords(userId: number, month: string, year: string) {
    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month - 1 : new Date().getMonth();
    const from = new Date(Date.UTC(y, m, 1));
    const to = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { role: true, department: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const records = await this.prisma.dtr.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
    const schedule = await this.prisma.ojtSchedule.findUnique({
      where: { ojtId: userId },
      include: { schedule: true },
    });
    const periodType = schedule?.schedule?.periodType || "two_period";
    const totalMin = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
    const period = new Date(y, m).toLocaleString("en-PH", {
      month: "long",
      year: "numeric",
    });
    return { user, records, periodType, totalMin, period, y, m };
  }

  async exportExcel(
    userId: number,
    month: string,
    year: string,
    res: Response,
  ) {
    const { user, records, periodType, totalMin, period } =
      await this.getRecords(userId, month, year);
    const isOne = periodType === "one_period";

    const wb = new ExcelJS.Workbook();
    wb.creator = "JuanHR v3";
    const ws = wb.addWorksheet("DTR");

    // ── Title block ──────────────────────────────────────────
    const cols = isOne ? 5 : 7;
    const colLetter = ["A", "B", "C", "D", "E", "F", "G"][cols - 1];

    ws.mergeCells(`A1:${colLetter}1`);
    const t1 = ws.getCell("A1");
    t1.value = "DAILY TIME RECORD";
    t1.font = { bold: true, size: 16, color: { argb: "FF1A2340" } };
    t1.alignment = { horizontal: "center" };
    t1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F4F8" },
    };

    ws.mergeCells(`A2:${colLetter}2`);
    const t2 = ws.getCell("A2");
    t2.value = `Employee: ${user.fullName}`;
    t2.font = { bold: true, size: 12 };
    t2.alignment = { horizontal: "center" };

    ws.mergeCells(`A3:${colLetter}3`);
    const t3 = ws.getCell("A3");
    t3.value = `${user.role.label}  |  ${user.department?.name || "—"}  |  ${user.school ? `${user.school} · ${user.course || ""}` : ""}`;
    t3.alignment = { horizontal: "center" };
    t3.font = { size: 10, color: { argb: "FF5A6A8A" } };

    ws.mergeCells(`A4:${colLetter}4`);
    ws.getCell("A4").value = `Period: ${period}`;
    ws.getCell("A4").alignment = { horizontal: "center" };
    ws.getCell("A4").font = { size: 10, color: { argb: "FF5A6A8A" } };

    ws.addRow([]);

    // ── Header row ──────────────────────────────────────────
    const headers = isOne
      ? ["Date", "Clock In", "Clock Out", "Total Hours", "Status"]
      : ["Date", "AM In", "AM Out", "PM In", "PM Out", "Total Hours", "Status"];

    const hRow = ws.addRow(headers);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1A2340" },
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF00D4FF" } },
      };
    });

    ws.columns = isOne
      ? [
          { width: 28 },
          { width: 16 },
          { width: 16 },
          { width: 14 },
          { width: 12 },
        ]
      : [
          { width: 28 },
          { width: 16 },
          { width: 16 },
          { width: 16 },
          { width: 16 },
          { width: 14 },
          { width: 12 },
        ];

    // ── Data rows ──────────────────────────────────────────
    records.forEach((r, i) => {
      const rowData = isOne
        ? [
            this.fmtDate(r.date),
            this.fmtTime(r.amIn),
            this.fmtTime(r.amOut),
            r.totalMinutes ? this.fmt(r.totalMinutes) : "—",
            r.status.toUpperCase(),
          ]
        : [
            this.fmtDate(r.date),
            this.fmtTime(r.amIn),
            this.fmtTime(r.amOut),
            this.fmtTime(r.pmIn),
            this.fmtTime(r.pmOut),
            r.totalMinutes ? this.fmt(r.totalMinutes) : "—",
            r.status.toUpperCase(),
          ];

      const row = ws.addRow(rowData);
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F9FC" },
          };
        });
      }
      // Status color
      const statusCell = row.getCell(isOne ? 5 : 7);
      const sColor =
        r.status === "late"
          ? "FFFBBF24"
          : r.status === "present"
            ? "FF22C55E"
            : "FFFF5050";
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: sColor },
      };
      statusCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      statusCell.alignment = { horizontal: "center" };
    });

    // ── Totals row ──────────────────────────────────────────
    ws.addRow([]);
    const sumData = isOne
      ? [
          "",
          "",
          "TOTAL HOURS RENDERED:",
          this.fmt(totalMin),
          `${records.length} day(s)`,
        ]
      : [
          "",
          "",
          "",
          "",
          "TOTAL HOURS RENDERED:",
          this.fmt(totalMin),
          `${records.length} day(s)`,
        ];
    const sumRow = ws.addRow(sumData);
    const totalCell = sumRow.getCell(isOne ? 4 : 6);
    totalCell.font = { bold: true, size: 12, color: { argb: "FF00D4FF" } };
    sumRow.getCell(isOne ? 3 : 5).font = { bold: true };

    // ── Signature block ──────────────────────────────────────────
    ws.addRow([]);
    ws.addRow([""]);
    ws.addRow(["Certified Correct:"]);
    ws.addRow([user.fullName]);
    ws.addRow([`${user.role.label} — ${period}`]);
    ws.addRow([""]);
    ws
      .addRow([
        `Generated by JuanHR v3 on ${new Date().toLocaleString("en-PH")}`,
      ])
      .getCell(1).font = { size: 8, color: { argb: "FF9CA3AF" } };

    const safeName = user.fullName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=DTR_${safeName}_${period.replace(/\s/g, "_")}.xlsx`,
    );
    await wb.xlsx.write(res);
    res.end();
  }

  async exportPdf(userId: number, month: string, year: string, res: Response) {
    const { user, records, periodType, totalMin, period } =
      await this.getRecords(userId, month, year);
    const isOne = periodType === "one_period";

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });
    const safeName = user.fullName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=DTR_${safeName}_${period.replace(/\s/g, "_")}.pdf`,
    );
    doc.pipe(res);

    const W = doc.page.width - 80; // usable width

    // ── Header ──────────────────────────────────────────────
    doc.rect(40, 40, W, 24).fill("#1A2340");
    doc
      .fillColor("#00D4FF")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("JUANHR v3 · DAILY TIME RECORD", 44, 48, { width: W - 8 });

    doc
      .fillColor("#1A2340")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("DAILY TIME RECORD", 40, 78, { align: "center", width: W });

    doc
      .fillColor("#1A2340")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(user.fullName, 40, 102, { align: "center", width: W });

    doc
      .fillColor("#5A6A8A")
      .font("Helvetica")
      .fontSize(9)
      .text(
        `${user.role.label}  ·  ${user.department?.name || "—"}  ·  ${user.school ? `${user.school} · ${user.course || ""}` : "No school info"}`,
        40,
        118,
        { align: "center", width: W },
      );

    doc
      .fillColor("#5A6A8A")
      .fontSize(9)
      .text(`Period: ${period}`, 40, 130, { align: "center", width: W });

    // divider
    doc
      .moveTo(40, 146)
      .lineTo(40 + W, 146)
      .strokeColor("#1A2340")
      .lineWidth(1)
      .stroke();

    // ── Table header ────────────────────────────────────────
    const cols = isOne
      ? [
          { w: W * 0.3, label: "Date" },
          { w: W * 0.18, label: "Clock In" },
          { w: W * 0.18, label: "Clock Out" },
          { w: W * 0.18, label: "Total Hours" },
          { w: W * 0.16, label: "Status" },
        ]
      : [
          { w: W * 0.22, label: "Date" },
          { w: W * 0.13, label: "AM In" },
          { w: W * 0.13, label: "AM Out" },
          { w: W * 0.13, label: "PM In" },
          { w: W * 0.13, label: "PM Out" },
          { w: W * 0.14, label: "Total Hours" },
          { w: W * 0.12, label: "Status" },
        ];

    const rowH = 18;
    let y = 152;

    doc.rect(40, y, W, rowH).fill("#1A2340");
    let x = 40;
    cols.forEach((c) => {
      doc
        .fillColor("#00D4FF")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(c.label, x + 2, y + 5, { width: c.w - 4, align: "center" });
      x += c.w;
    });
    y += rowH;

    // ── Data rows ────────────────────────────────────────────
    records.forEach((r, i) => {
      if (y > doc.page.height - 80) {
        doc.addPage({ layout: "landscape", margin: 40 });
        y = 40;
      }

      const bg = i % 2 === 0 ? "#F5F9FC" : "#FFFFFF";
      doc.rect(40, y, W, rowH).fill(bg);

      const cells = isOne
        ? [
            this.fmtDate(r.date),
            this.fmtTime(r.amIn),
            this.fmtTime(r.amOut),
            r.totalMinutes ? this.fmt(r.totalMinutes) : "—",
            r.status.toUpperCase(),
          ]
        : [
            this.fmtDate(r.date),
            this.fmtTime(r.amIn),
            this.fmtTime(r.amOut),
            this.fmtTime(r.pmIn),
            this.fmtTime(r.pmOut),
            r.totalMinutes ? this.fmt(r.totalMinutes) : "—",
            r.status.toUpperCase(),
          ];

      x = 40;
      cells.forEach((cell, ci) => {
        const col = cols[ci];
        const isStatus = ci === cols.length - 1;
        const isHours = ci === cols.length - 2;
        let color = "#1A2340";
        if (isStatus) {
          color =
            r.status === "late"
              ? "#B45309"
              : r.status === "present"
                ? "#065F46"
                : "#991B1B";
        }
        if (isHours) color = "#0E7490";
        doc
          .fillColor(color)
          .font(isStatus || isHours ? "Helvetica-Bold" : "Helvetica")
          .fontSize(8)
          .text(cell, x + 2, y + 5, { width: col.w - 4, align: "center" });
        x += col.w;
      });

      // row border
      doc.rect(40, y, W, rowH).strokeColor("#DDE3EF").lineWidth(0.3).stroke();
      y += rowH;
    });

    // ── Totals ───────────────────────────────────────────────
    y += 8;
    doc.rect(40, y, W, 24).fill("#E8F4F8");
    doc
      .fillColor("#1A2340")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`TOTAL HOURS RENDERED: ${this.fmt(totalMin)}`, 40, y + 6, {
        align: "center",
        width: W,
      });
    y += 24;

    // summary line
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    y += 6;
    doc
      .fillColor("#5A6A8A")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Days Present: ${present}   Days Late: ${late}   Total Days: ${records.length}`,
        40,
        y,
        { align: "center", width: W },
      );
    y += 20;

    // Signature line
    doc
      .moveTo(40, y)
      .lineTo(40 + W, y)
      .strokeColor("#DDE3EF")
      .lineWidth(0.5)
      .stroke();
    y += 12;
    doc
      .fillColor("#5A6A8A")
      .fontSize(8)
      .text(
        `Generated by JuanHR v3 · ${new Date().toLocaleString("en-PH")}`,
        40,
        y,
        { align: "left", width: W / 2 },
      );
    doc.text(`${user.fullName} — ${user.role.label}`, 40, y, {
      align: "right",
      width: W,
    });

    doc.end();
  }
}
