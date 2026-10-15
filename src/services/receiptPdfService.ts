import jsPDF from "jspdf";
import { ConsolidatedBill, PaymentTransaction, PropertyRecord, CitizenUser, WaterConnection } from "./msevaService";

export function generatePaymentReceiptPdf(
  transaction: PaymentTransaction,
  bill?: ConsolidatedBill,
  property?: PropertyRecord,
  citizen?: CitizenUser | null
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  // Punjab Context & PSPCL Branding
  const rawId = property?.propertyId || bill?.consumerCode || transaction.consumerCode || "PJB-123-456-78";
  const displayId = rawId.replace(/^KNP/i, "PJB");
  const cityName = property?.address?.city || "Amritsar";
  const stateName = "Punjab";
  const corpTitle = "PUNJAB STATE POWER CORPORATION LIMITED (PSPCL)";

  // 1. Top Decorative Brand Bar
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 0, pageWidth, 5, "F");

  let y = 14;

  // 2. Municipal Seal / Header Emblem Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`GOVERNMENT OF ${stateName.toUpperCase()} / UPYOG`, pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(corpTitle, pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("CITIZEN SERVICES PORTAL • OFFICIAL PAYMENT RECEIPT", pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // 3. Receipt Summary Bar (Light Grey Background Box)
  const metaBoxHeight = 24;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 2, 2, "FD");

  // Left Column: Receipt No & Txn ID
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Receipt Number:", margin + 5, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.receiptNumber || "PB_RCPT_2026_98234", margin + 35, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Transaction ID:", margin + 5, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.txnId || "PB_PG_2026_09_00123", margin + 35, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payment Date:", margin + 5, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const paymentTimeStr = transaction.paymentDate || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  doc.text(paymentTimeStr, margin + 35, y + 18);

  // Right Column: Status & Gateway
  const rightColX = margin + 105;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payment Status:", rightColX, y + 6);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text("SUCCESS / CONFIRMED", rightColX + 30, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payment Gateway:", rightColX, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${transaction.gateway} Gateway`, rightColX + 30, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Service Mode:", rightColX, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("Online Portal Redirection", rightColX + 30, y + 18);

  y += metaBoxHeight + 8;

  // 4. Property & Citizen Information Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("1. PROPERTY & TAXPAYER DETAILS", margin, y);

  y += 3;
  const propBoxHeight = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, propBoxHeight, 1.5, 1.5, "FD");

  // Owners list
  const ownerNames = property?.owners && property.owners.length > 0
    ? property.owners.map((o, idx) => `${idx + 1}. ${o.name}`).join(", ")
    : citizen?.name
    ? citizen.name
    : "Mr. Gurpreet Singh, Mrs. Harpreet Kaur";

  const mobile = property?.owners?.[0]?.mobileNumber || citizen?.mobileNumber || "9876543210";

  const address = property?.address?.doorNo
    ? `${property.address.doorNo}, ${property.address.locality || property.address.street || "Mall Road"}, ${cityName} - ${property.address.pincode || "143001"}`
    : "42, Mall Road, Model Town, Amritsar, Punjab - 143001";

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Property ID (PTID):", margin + 4, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(displayId, margin + 38, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Registered Mobile:", margin + 105, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(mobile, margin + 140, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Owner Name(s):", margin + 4, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(ownerNames, margin + 38, y + 15, { maxWidth: contentWidth - 42 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Property Address:", margin + 4, y + 23);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(address, margin + 38, y + 23, { maxWidth: contentWidth - 42 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Financial Year:", margin + 4, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("2025-2026", margin + 38, y + 31);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Ward Number:", margin + 105, y + 31);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(property?.wardNo || "30", margin + 140, y + 31);

  y += propBoxHeight + 8;

  // 5. Demand & Assessment Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("2. DEMAND & PAYMENT ASSESSMENT BREAKDOWN", margin, y);

  y += 3;

  // Table Header
  const tableHeaderY = y;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, tableHeaderY, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("Sr.", margin + 3, tableHeaderY + 5);
  doc.text("Fee / Assessment Component Description", margin + 15, tableHeaderY + 5);
  doc.text("Amount (INR)", margin + contentWidth - 5, tableHeaderY + 5, { align: "right" });

  y += 7;

  // Breakdown items
  const items = [
    { title: "Current Property Tax Assessment Demand (FY 2025-26)", amt: bill?.currentTaxDemand || 4500 },
    { title: "Previous Year Arrears & Unpaid Demand", amt: bill?.arrears || 800 },
    { title: "Municipal Service Penalty / Late Filing Charges", amt: bill?.penalty || 200 },
    { title: "Punjab Municipal Fire Cess & Solid Waste Charges", amt: bill?.fireCess || 100 },
  ];

  doc.setFontSize(8.5);
  items.forEach((item, idx) => {
    const rowY = y;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 7, "F");
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, rowY + 7, margin + contentWidth, rowY + 7);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`${idx + 1}`, margin + 3, rowY + 5);

    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 15, rowY + 5);

    doc.setFont("helvetica", "normal");
    doc.text(`Rs. ${item.amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, margin + contentWidth - 5, rowY + 5, { align: "right" });

    y += 7;
  });

  // Total Row
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.rect(margin, y, contentWidth, 9, "F");
  doc.setDrawColor(199, 210, 254);
  doc.rect(margin, y, contentWidth, 9, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("TOTAL AMOUNT PAID IN FULL:", margin + 15, y + 6);

  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(`Rs. ${transaction.txnAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, margin + contentWidth - 5, y + 6.2, { align: "right" });

  y += 15;

  // 6. Post-Payment Notice Callout Box
  const noticeBoxHeight = 16;
  doc.setFillColor(254, 243, 199); // amber-100/60
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(margin, y, contentWidth, noticeBoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text("IMPORTANT POST-PAYMENT NOTIFICATION:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15);
  const noticeText = "You have pending property assessments from previous year(s). Please visit the portal to complete the assessment and pay the outstanding dues.";
  doc.text(noticeText, margin + 4, y + 10, { maxWidth: contentWidth - 8 });

  y += noticeBoxHeight + 10;

  // 7. Security & Official Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This is a computer-generated official receipt issued by the Municipal Corporation. No signature is required.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Citizen Portal: https://mseva.lgpunjab.gov.in • Verification Ref: ${transaction.txnId} • Powered by AIRAWAT Research Foundation`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Bottom blue accent bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 297 - 3, pageWidth, 3, "F");

  // Save the PDF
  const filename = `Payment-Receipt-${transaction.receiptNumber || transaction.txnId}.pdf`;
  doc.save(filename);
}

export function generateDueBillPdf(
  bill?: ConsolidatedBill,
  property?: PropertyRecord,
  water?: WaterConnection,
  citizen?: CitizenUser | null
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  const isWater = bill?.businessService === "WS" || !!water;
  const rawId = isWater
    ? water?.connectionNumber || bill?.consumerCode || "WC-123-456-78"
    : property?.propertyId || bill?.consumerCode || "PJB-123-456-78";
  const displayId = rawId.replace(/^KNP/i, "PJB");

  const cityName = property?.address?.city || "Amritsar";
  const stateName = "Punjab";
  const corpTitle = "PUNJAB STATE POWER CORPORATION LIMITED (PSPCL)";
  const billNoticeNo = bill?.billId
    ? `PB-DEMAND-${bill.billId}`
    : `PB-DEMAND-2026-${displayId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const noticeDate = "Wed, May 27, 2026 • 9:27:53 AM";
  const financialYear = property?.financialYear || "2025-2026";
  const wardNo = property?.wardNo || "12";
  const status = property?.status || "Active";
  const dueAmountNum = bill?.totalAmount !== undefined ? bill.totalAmount : 5600;
  const dueAmountStr = Math.round(dueAmountNum).toLocaleString("en-IN");

  // 1. Top Decorative Brand Bar (PSPCL Crimson #C53030)
  doc.setFillColor(197, 48, 48);
  doc.rect(0, 0, pageWidth, 5, "F");

  let y = 14;

  // 2. Municipal / Corporation Header Emblem Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`GOVERNMENT OF ${stateName.toUpperCase()} • DEPARTMENT OF LOCAL GOVERNMENT`, pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(197, 48, 48);
  doc.text(corpTitle, pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    isWater
      ? "CITIZEN SERVICES PORTAL • WATER & SEWERAGE ASSESSMENT DEMAND NOTICE"
      : "CITIZEN SERVICES PORTAL • PROPERTY TAX OFFICIAL ASSESSMENT & DUE BILL",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 4;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // 3. Bill / Demand Summary Bar (Rounded Box)
  const metaBoxHeight = 22;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 2, 2, "FD");

  // Left Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Assessment / Bill No:", margin + 5, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(billNoticeNo, margin + 42, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Notice Generated On:", margin + 5, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(noticeDate, margin + 42, y + 14);

  // Right Column
  const rightColX = margin + 105;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payment Status:", rightColX, y + 6);
  doc.setTextColor(220, 38, 38); // red-600
  doc.setFont("helvetica", "bold");
  doc.text("OUTSTANDING / DUE", rightColX + 30, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Financial Year:", rightColX, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(financialYear, rightColX + 30, y + 14);

  y += metaBoxHeight + 7;

  // 4. Prominent Identifier Box
  const idBoxHeight = 16;
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(248, 113, 113); // red-400
  doc.roundedRect(margin, y, contentWidth, idBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(153, 27, 27); // red-800
  doc.text(
    isWater ? "WATER CONSUMER NUMBER:" : "PROPERTY ID (PTID):",
    pageWidth / 2,
    y + 5.5,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(displayId, pageWidth / 2, y + 12, { align: "center" });

  y += idBoxHeight + 7;

  // 5. Property & Citizen Information Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(isWater ? "1. WATER CONNECTION & CITIZEN DETAILS" : "1. PROPERTY & CITIZEN DETAILS", margin, y);

  y += 3;
  const propBoxHeight = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, propBoxHeight, 1.5, 1.5, "FD");

  // Owners list
  const ownerNames = property?.owners && property.owners.length > 0
    ? property.owners.map((o: { name: string }, idx: number) => `${idx + 1}. ${o.name}`).join(", ")
    : citizen?.name
    ? citizen.name
    : "1. Mr. Gurpreet Singh, 2. Mrs. Harpreet Kaur";

  const mobile = property?.owners?.[0]?.mobileNumber || citizen?.mobileNumber || "9876543210";

  const address = property?.address?.doorNo
    ? `${property.address.doorNo}, ${property.address.locality || property.address.street || "Model Town"}, ${cityName}, Punjab`
    : "42, Model Town, Amritsar, Punjab";

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Owner Name(s):", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(ownerNames, margin + 35, y + 6, { maxWidth: contentWidth - 40 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Registered Mobile:", margin + 4, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(mobile, margin + 35, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Ward Number:", rightColX, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(wardNo, rightColX + 30, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Property Address:", margin + 4, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(address, margin + 35, y + 22, { maxWidth: contentWidth - 40 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Account Status:", margin + 4, y + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(status, margin + 35, y + 30);

  y += propBoxHeight + 7;

  // 6. Demand & Assessment Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("2. DUE AMOUNT ASSESSMENT BREAKDOWN", margin, y);

  y += 3;

  // Table Header
  const tableHeaderY = y;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, tableHeaderY, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("Sr.", margin + 3, tableHeaderY + 5);
  doc.text("Fee / Assessment Component Description", margin + 15, tableHeaderY + 5);
  doc.text("Amount (INR)", margin + contentWidth - 5, tableHeaderY + 5, { align: "right" });

  y += 7;

  const items = isWater
    ? [
        { title: "Current Water Supply Consumption Charges (FY 2025-26)", amt: bill?.currentTaxDemand || 850 },
        { title: "Previous Cycle Unpaid Water Arrears", amt: bill?.arrears || 150 },
        { title: "Meter Maintenance & Municipal Service Cess", amt: bill?.penalty || 50 },
      ]
    : [
        { title: "Current Property Tax Assessment Demand (FY 2025-26)", amt: bill?.currentTaxDemand || 4500 },
        { title: "Previous Year Arrears & Unpaid Demand", amt: bill?.arrears || 800 },
        { title: "Municipal Service Penalty / Late Filing Charges", amt: bill?.penalty || 200 },
        { title: "Punjab Municipal Fire Cess & Solid Waste Charges", amt: bill?.fireCess || 100 },
      ];

  doc.setFontSize(8.5);
  items.forEach((item, idx) => {
    const rowY = y;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 7, "F");
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, rowY + 7, margin + contentWidth, rowY + 7);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`${idx + 1}`, margin + 3, rowY + 5);

    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 15, rowY + 5);

    doc.setFont("helvetica", "normal");
    doc.text(`Rs. ${item.amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, margin + contentWidth - 5, rowY + 5, { align: "right" });

    y += 7;
  });

  // Total Due Row
  doc.setFillColor(254, 242, 242); // red-50
  doc.rect(margin, y, contentWidth, 9, "F");
  doc.setDrawColor(252, 165, 165); // red-300
  doc.rect(margin, y, contentWidth, 9, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(153, 27, 27); // red-800
  doc.text("TOTAL CURRENT DUE AMOUNT:", margin + 15, y + 6);

  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text(`Rs. ${dueAmountStr}`, margin + contentWidth - 5, y + 6.2, { align: "right" });

  y += 15;

  // 7. Payment Instructions Box
  const noticeBoxHeight = 20;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(margin, y, contentWidth, noticeBoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // indigo-900
  doc.text("HOW TO PAY YOUR DUES:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  const inst1 = "1. Pay directly inside this Bharat Chatbot interface using UPI, Debit Card, Credit Card, or Net Banking.";
  const inst2 = "2. Or visit the official citizen portal at https://mseva.lgpunjab.gov.in and search by your Property ID / Consumer Number.";
  const inst3 = "3. Please retain the official payment receipt after transaction completion for municipal audit records.";
  doc.text(inst1, margin + 4, y + 9.5);
  doc.text(inst2, margin + 4, y + 13.5);
  doc.text(inst3, margin + 4, y + 17.5);

  y += noticeBoxHeight + 8;

  // 8. Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This is a computer-generated official bill demand notice issued by the Municipal Corporation / PSPCL. No signature required.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Citizen Portal: https://mseva.lgpunjab.gov.in • Property ID: ${displayId} • Powered by AIRAWAT Research Foundation`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Bottom crimson accent bar
  doc.setFillColor(197, 48, 48);
  doc.rect(0, 297 - 3, pageWidth, 3, "F");

  // Save the PDF
  const filename = `Due-Bill-${displayId}.pdf`;
  doc.save(filename);
}

