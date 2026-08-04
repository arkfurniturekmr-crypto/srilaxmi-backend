/**
 * Renders a professional quotation PDF using PDFKit.
 * Pure rendering module — takes validated data + an output path, writes
 * the file, and resolves. No HTTP, no validation, no storage logic here.
 */
"use strict";

const fs = require("fs");
const PDFDocument = require("pdfkit");
const config = require("../config/env");

// Brand palette — kept in sync with assets/css/style.css on the website
const COLORS = {
  espresso: "#2b1c13",
  teak: "#a85c2a",
  teakDark: "#8b4a21",
  gold: "#c89b4c",
  ivorySoft: "#fbf8f2",
  charcoal: "#241a10",
  charcoalSoft: "#574434",
  line: "#e4dcd0",
  white: "#ffffff",
};

const PAGE_MARGIN = 40;
const TABLE_COLUMNS = [
  { key: "sNo", label: "S.No", width: 40, align: "center" },
  { key: "pieces", label: "Pieces", width: 70, align: "center" },
  { key: "lengthFt", label: "Length (ft)", width: 90, align: "center" },
  { key: "widthIn", label: "Width (in)", width: 90, align: "center" },
  { key: "girthIn", label: "Girth (in)", width: 90, align: "center" },
  { key: "cft", label: "C.F.T.", width: 0, align: "center" }, // width filled in below
];
// Last column takes whatever width is left on the usable page width
const USABLE_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width in points
TABLE_COLUMNS[TABLE_COLUMNS.length - 1].width =
  USABLE_WIDTH - TABLE_COLUMNS.slice(0, -1).reduce((sum, c) => sum + c.width, 0);

function formatCft(value) {
  return Number(value).toFixed(3);
}

function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/** Draws the company header band, logo (with graceful fallback), and quotation meta */
function drawHeader(doc, { quotationId, generatedAt }) {
  const headerHeight = 96;

  doc.save();
  doc.rect(0, 0, doc.page.width, headerHeight).fill(COLORS.espresso);

  // Logo — falls back to a simple monogram circle if the logo file is missing,
  // so PDF generation never breaks just because an asset wasn't provided.
  const logoSize = 56;
  const logoX = PAGE_MARGIN;
  const logoY = (headerHeight - logoSize) / 2;

  if (fs.existsSync(config.companyLogoPath)) {
    try {
      doc.image(config.companyLogoPath, logoX, logoY, { fit: [logoSize, logoSize] });
    } catch (_err) {
      drawLogoFallback(doc, logoX, logoY, logoSize);
    }
  } else {
    drawLogoFallback(doc, logoX, logoY, logoSize);
  }

  const textX = logoX + logoSize + 16;
  const textColWidth = 270; // keep clear of the meta box on the right
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("SRI LAXMI SAW MILL AND TIMBER DEPOT", textX, 18, { width: textColWidth, lineBreak: false });
  doc
    .fillColor(COLORS.gold)
    .font("Helvetica")
    .fontSize(8.5)
    .text("Best Indian Teak Wood, Kamareddy, Telangana", textX, 35, { width: textColWidth, lineBreak: false });
  doc
    .fillColor("#d8cdbe")
    .fontSize(7.5)
    .text("790, Industrial Area, Kamareddy, Telangana - 503111", textX, 53, { width: textColWidth, lineBreak: false })
    .text("+91 96765 86890  |  lsri48555@gmail.com", textX, 64, { width: textColWidth, lineBreak: false });

  // Quotation meta, right-aligned
  const metaWidth = 155;
  const metaX = doc.page.width - PAGE_MARGIN - metaWidth;
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("QUOTATION", metaX, 22, { width: metaWidth, align: "right" });
  doc
    .fillColor("#d8cdbe")
    .font("Helvetica")
    .fontSize(8)
    .text(`ID: ${quotationId}`, metaX, 38, { width: metaWidth, align: "right" })
    .text(`Date: ${formatDateTime(generatedAt)}`, metaX, 52, { width: metaWidth, align: "right" });

  doc.restore();
  doc.y = headerHeight + 24;
}

function drawLogoFallback(doc, x, y, size) {
  doc.save();
  doc.circle(x + size / 2, y + size / 2, size / 2).fill(COLORS.teak);
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(size * 0.36)
    .text("SL", x, y + size / 2 - size * 0.18, { width: size, align: "center" });
  doc.restore();
}

/** Customer details card */
function drawCustomerDetails(doc, customer) {
  const boxY = doc.y;
  const boxHeight = 74;
  const boxWidth = USABLE_WIDTH;

  doc.save();
  doc
    .roundedRect(PAGE_MARGIN, boxY, boxWidth, boxHeight, 4)
    .fillAndStroke(COLORS.ivorySoft, COLORS.line);

  doc
    .fillColor(COLORS.teakDark)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("CUSTOMER DETAILS", PAGE_MARGIN + 16, boxY + 12, { characterSpacing: 0.5 });

  const colWidth = boxWidth / 2 - 16;
  const rowY1 = boxY + 30;
  const rowY2 = boxY + 52;

  drawLabelValue(doc, "Name", customer.name, PAGE_MARGIN + 16, rowY1, colWidth);
  drawLabelValue(doc, "Mobile", customer.mobile, PAGE_MARGIN + 16 + colWidth + 16, rowY1, colWidth);
  drawLabelValue(doc, "Village / City", customer.village, PAGE_MARGIN + 16, rowY2, colWidth);
  drawLabelValue(doc, "State", customer.state, PAGE_MARGIN + 16 + colWidth + 16, rowY2, colWidth);

  doc.restore();
  doc.y = boxY + boxHeight + 24;
}

function drawLabelValue(doc, label, value, x, y, width) {
  doc.fillColor(COLORS.charcoalSoft).font("Helvetica").fontSize(7.5).text(label.toUpperCase(), x, y, {
    width,
    characterSpacing: 0.4,
  });
  doc
    .fillColor(COLORS.charcoal)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(String(value || "-"), x, y + 10, { width });
}

/** Ensures there's enough vertical space left on the page, adding a new page if not */
function ensureSpace(doc, neededHeight) {
  const bottomLimit = doc.page.height - PAGE_MARGIN;
  if (doc.y + neededHeight > bottomLimit) {
    doc.addPage();
    doc.y = PAGE_MARGIN;
  }
}

/** Draws the table header row */
function drawTableHeaderRow(doc) {
  const rowHeight = 22;
  let x = PAGE_MARGIN;
  const y = doc.y;

  doc.save();
  doc.rect(PAGE_MARGIN, y, USABLE_WIDTH, rowHeight).fill(COLORS.espresso);
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(8.5);

  TABLE_COLUMNS.forEach((col) => {
    doc.text(col.label, x + 6, y + 7, { width: col.width - 12, align: col.align });
    x += col.width;
  });
  doc.restore();
  doc.y = y + rowHeight;
}

/** Draws a single data row, returns the row height used */
function drawTableRow(doc, rowValues, isAlt) {
  const rowHeight = 20;
  let x = PAGE_MARGIN;
  const y = doc.y;

  doc.save();
  if (isAlt) {
    doc.rect(PAGE_MARGIN, y, USABLE_WIDTH, rowHeight).fill(COLORS.ivorySoft);
  }
  doc.fillColor(COLORS.charcoal).font("Helvetica").fontSize(8.5);

  TABLE_COLUMNS.forEach((col) => {
    const raw = rowValues[col.key];
    const text = col.key === "cft" ? formatCft(raw) : String(raw);
    doc.text(text, x + 6, y + 6, { width: col.width - 12, align: col.align });
    x += col.width;
  });
  doc.restore();

  // Bottom border line
  doc
    .moveTo(PAGE_MARGIN, y + rowHeight)
    .lineTo(PAGE_MARGIN + USABLE_WIDTH, y + rowHeight)
    .strokeColor(COLORS.line)
    .lineWidth(0.5)
    .stroke();

  doc.y = y + rowHeight;
}

/** Draws the totals row beneath a category's table */
function drawTotalsRow(doc, totalPieces, totalCft) {
  const rowHeight = 24;
  const y = doc.y;

  doc.save();
  doc.rect(PAGE_MARGIN, y, USABLE_WIDTH, rowHeight).fill(COLORS.gold);

  const sNoW = TABLE_COLUMNS[0].width;
  const piecesW = TABLE_COLUMNS[1].width;
  const midWidth = TABLE_COLUMNS[2].width + TABLE_COLUMNS[3].width + TABLE_COLUMNS[4].width;
  const cftW = TABLE_COLUMNS[5].width;

  doc
    .fillColor(COLORS.espresso)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("TOTAL", PAGE_MARGIN + 4, y + 8, { width: sNoW - 6, lineBreak: false });

  doc
    .fontSize(9)
    .text(String(totalPieces), PAGE_MARGIN + sNoW + 6, y + 7, { width: piecesW - 12, align: "center" });

  doc.text(
    "Category Grand C.F.T.",
    PAGE_MARGIN + sNoW + piecesW + 6,
    y + 7,
    { width: midWidth - 12, align: "right", lineBreak: false }
  );

  doc.text(formatCft(totalCft), PAGE_MARGIN + sNoW + piecesW + midWidth + 6, y + 7, {
    width: cftW - 12,
    align: "center",
  });

  doc.restore();
  doc.y = y + rowHeight + 26;
}

/** Draws one full category block: heading + table + totals, with page-break handling */
function drawCategory(doc, category, index) {
  ensureSpace(doc, 60);

  doc
    .fillColor(COLORS.teakDark)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(`${index + 1}. ${category.name}`, PAGE_MARGIN, doc.y);
  doc.moveDown(0.4);

  drawTableHeaderRow(doc);

  category.rows.forEach((row, i) => {
    // If a row would overflow the page, start a fresh page and repeat the header
    ensureSpace(doc, 20);
    if (doc.y === PAGE_MARGIN) {
      drawTableHeaderRow(doc);
    }
    drawTableRow(
      doc,
      {
        sNo: row.sNo,
        pieces: row.pieces,
        lengthFt: row.lengthFt,
        widthIn: row.widthIn,
        girthIn: row.girthIn,
        cft: row.cft,
      },
      i % 2 === 1
    );
  });

  ensureSpace(doc, 30);
  drawTotalsRow(doc, category.totals.pieces, category.totals.cft);
}

/** Grand total banner at the very end */
function drawGrandTotal(doc, grandTotals) {
  ensureSpace(doc, 80);

  const boxHeight = 64;
  const y = doc.y;

  doc.save();
  doc.roundedRect(PAGE_MARGIN, y, USABLE_WIDTH, boxHeight, 4).fill(COLORS.espresso);

  const half = USABLE_WIDTH / 2;

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(String(grandTotals.pieces), PAGE_MARGIN, y + 14, { width: half, align: "center" });
  doc
    .fillColor("#d8cdbe")
    .font("Helvetica")
    .fontSize(8.5)
    .text("GRAND TOTAL PIECES", PAGE_MARGIN, y + 42, { width: half, align: "center", characterSpacing: 0.5 });

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(formatCft(grandTotals.cft), PAGE_MARGIN + half, y + 14, { width: half, align: "center" });
  doc
    .fillColor("#d8cdbe")
    .font("Helvetica")
    .fontSize(8.5)
    .text("GRAND TOTAL C.F.T.", PAGE_MARGIN + half, y + 42, { width: half, align: "center", characterSpacing: 0.5 });

  doc.restore();
  doc.y = y + boxHeight + 20;
}

function drawFooter(doc) {
  ensureSpace(doc, 40);
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + USABLE_WIDTH, doc.y)
    .strokeColor(COLORS.line)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.6);
  doc
    .fillColor(COLORS.charcoalSoft)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      "This is a computer-generated quotation from Sri Laxmi Saw Mill & Timber Depot, Kamareddy. " +
        "Prices are subject to confirmation over phone/WhatsApp. GSTIN: 36DCWPK1176A1ZI.",
      PAGE_MARGIN,
      doc.y,
      { width: USABLE_WIDTH, align: "center" }
    );
}

/**
 * @param {object} quotationData - { quotationId, generatedAt, customer, categories, grandTotals }
 * @param {string} outputPath - absolute file path to write the PDF to
 * @returns {Promise<void>}
 */
function generateQuotationPdf(quotationData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, bufferPages: true });
    const stream = fs.createWriteStream(outputPath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);

    drawHeader(doc, quotationData);
    drawCustomerDetails(doc, quotationData.customer);

    quotationData.categories.forEach((category, index) => {
      drawCategory(doc, category, index);
    });

    drawGrandTotal(doc, quotationData.grandTotals);
    drawFooter(doc);

    doc.end();
  });
}

module.exports = { generateQuotationPdf };
