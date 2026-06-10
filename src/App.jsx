"use client";

import React, { useState, useRef } from "react";
import { Input, Button, Form, DatePicker } from "antd";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { useReactToPrint } from "react-to-print";
import "./invoice.css"; // import the CSS below
import logo from "./assets/logo.png"; // Placeholder for logo image

import { ADToBS } from "bikram-sambat-js";

const isAppleMobileBrowser = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

const COMPANY_DETAILS = {
  name: "Autism Sansar",
  address: "Bhaisepati, Lalitpur",
  email: "autismsansar@gmail.com",
  phone: "+977-9860488845 / +977-9849006231",
  pan: "623291067",
};

const loadImageAsDataUrl = async (src) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const InvoicePage = () => {
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    studentName: "",
    reference: "Monthly Fee",
  });
  const [items, setItems] = useState([{ description: "", amount: "" }]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [bsDate, setBsDate] = useState(ADToBS(new Date()));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef(null);
  const shouldPreservePrintFrame = isAppleMobileBrowser();

  const reactToPrintFn = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceNumber || "preview"}`,
    preserveAfterPrint: shouldPreservePrintFrame,
    onPrintError: (errorLocation, error) => {
      console.error(`Printing failed during ${errorLocation}:`, error);
    },
  });

  const handlePrint = () => {
    if (!invoiceRef.current) {
      console.error("There is no invoice content available to print.");
      return;
    }

    reactToPrintFn();
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) {
      return;
    }

    try {
      setIsGeneratingPdf(true);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const rightColumnX = pageWidth - margin;
      let cursorY = 18;

      pdf.setProperties({
        title: `Invoice-${invoiceNumber || "preview"}`,
        subject: "Invoice",
        author: COMPANY_DETAILS.name,
      });

      try {
        const logoDataUrl = await loadImageAsDataUrl(logo);
        pdf.addImage(logoDataUrl, "PNG", margin, cursorY - 4, 18, 18);
      } catch (error) {
        console.error("Failed to load logo for PDF:", error);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(COMPANY_DETAILS.name, margin + 24, cursorY + 2);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(COMPANY_DETAILS.address, margin + 24, cursorY + 8);
      pdf.text(COMPANY_DETAILS.email, margin + 24, cursorY + 13);
      pdf.text(COMPANY_DETAILS.phone, margin + 24, cursorY + 18);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`PAN: ${COMPANY_DETAILS.pan}`, rightColumnX, cursorY + 2, {
        align: "right",
      });
      pdf.text(`INVOICE NO.: INV${invoiceNumber || ""}`, rightColumnX, cursorY + 8, {
        align: "right",
      });
      pdf.text(`Date: ${bsDate}`, rightColumnX, cursorY + 14, {
        align: "right",
      });
      pdf.text(`Reference: ${formData.reference}`, rightColumnX, cursorY + 20, {
        align: "right",
      });

      cursorY += 28;
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, cursorY, pageWidth - margin, cursorY);

      cursorY += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Client Name:", margin, cursorY);
      pdf.setFont("helvetica", "normal");
      pdf.text(formData.studentName || "-", margin + 24, cursorY);

      const totalAmount = calculateTotal();
      const tableBody = items.map((item, index) => {
        const amount = parseFloat(item.amount) || 0;

        return [
          String(index + 1),
          item.description?.trim() || "-",
          `NPR ${formatAmount(amount)}`,
          `NPR ${formatAmount(amount)}`,
        ];
      });

      autoTable(pdf, {
        startY: cursorY + 8,
        margin: { left: margin, right: margin },
        head: [["S.N", "Description", "Amount (NPR)", "Due"]],
        body: tableBody,
        foot: [["", "Total", `NPR ${formatAmount(totalAmount)}`, `NPR ${formatAmount(totalAmount)}`]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 3,
          lineColor: [204, 204, 204],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [242, 242, 242],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 18, halign: "center" },
          1: { cellWidth: 86 },
          2: { cellWidth: 36, halign: "right" },
          3: { cellWidth: 36, halign: "right" },
        },
      });

      let finalY = pdf.lastAutoTable?.finalY || cursorY + 50;
      if (finalY + 28 > pageHeight - margin) {
        pdf.addPage();
        finalY = margin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Amount in Figure:", margin, finalY + 12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Rupees ${convertToWords(totalAmount)} Only`, margin, finalY + 19);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("THANK YOU", pageWidth / 2, finalY + 32, {
        align: "center",
      });

      pdf.save(`invoice-${invoiceNumber || "preview"}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", amount: "" }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleSubmit = (values) => {
    setFormData({
      ...values,
      reference: values.reference?.trim() || "Monthly Fee",
    });
    setInvoiceNumber(values.invoiceNumber);
    const selectedDate = values.invoiceDate?.toDate?.() ?? new Date();
    setBsDate(ADToBS(selectedDate));
    setShowInvoice(true);
  };

  return (
    <div className="invoice-container">
      {!showInvoice && (
        <div className="invoice-form">
          <h2>Create Invoice</h2>
          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Client Name"
              name="studentName"
              rules={[{ required: true, message: "Please enter client name" }]}
            >
              <Input placeholder="Enter client name" />
            </Form.Item>
            <Form.Item
              label="Invoice Number"
              name="invoiceNumber"
              rules={[{ required: true, message: "Please enter invoice number" }]}
            >
              <Input placeholder="Enter invoice number" />
            </Form.Item>
            <Form.Item
              label="Date (Optional)"
              name="invoiceDate"
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select invoice date"
              />
            </Form.Item>
            <Form.Item
              label="Reference (Optional)"
              name="reference"
            >
              <Input placeholder="Monthly Fee" />
            </Form.Item>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "500", marginBottom: "8px", display: "block" }}>Line Items</label>
              {items.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {items.length > 1 && (
                    <Button danger onClick={() => handleRemoveItem(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={handleAddItem} style={{ marginTop: "10px" }}>
                + Add Item
              </Button>
            </div>

            <Button type="primary" htmlType="submit" block>
              Generate Invoice
            </Button>
          </Form>
        </div>
      )}

      {showInvoice && (
        <div className="invoice-preview">
          <div ref={invoiceRef} className="invoice-a4">
            <div className="invoice-header">
              <div className="invoice-left" style={{display:'flex'}}>
                <img src={logo} alt="Autism Sansar Logo" className="invoice-logo" />
                <div>
                <h1>Autism Sansar</h1>
                <p>Bhaisepati, Lalitpur</p>
                <p>autismsansar@gmail.com</p>
                <p>+977-9860488845 / +977-9849006231</p>
                </div>
              </div>
              <div className="invoice-right">
                <p>PAN: 623291067</p>
                <p>INVOICE NO.: INV{invoiceNumber}</p>
                <p>Date: {bsDate}</p>
                <p>Reference: {formData.reference}</p>
              </div>
            </div>

            <p className="student-name">
              <strong>Client Name:</strong> {formData.studentName}
            </p>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>S.N</th>
                  <th>Description</th>
                  <th>Amount (NPR)</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.description}</td>
                    <td>NPR {item.amount}</td>
                    <td>NPR {item.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td><strong>Total</strong></td>
                  <td><strong>NPR {calculateTotal()}</strong></td>
                  <td><strong>NPR {calculateTotal()}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div className="amount-text">
              <p><strong>Amount in Figure:</strong></p>
              <p>Rupees {convertToWords(calculateTotal())} Only</p>
            </div>

            <p className="thank-you">THANK YOU</p>
          </div>

          <div className="invoice-actions no-print">
            <Button onClick={() => setShowInvoice(false)}>Back</Button>
            <Button onClick={handleDownloadPdf} loading={isGeneratingPdf}>
              Download PDF
            </Button>
            <Button type="primary" onClick={handlePrint}>
              Print Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility: Convert number to words
function convertToWords(num) {
  num = parseInt(num);
  if (isNaN(num)) return "";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert_hundreds = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    return a[Math.floor(n / 100)] + " Hundred " + convert_hundreds(n % 100);
  };
  if (num === 0) return "Zero";
  if (num > 999999) return "Amount too large";
  const thousand = Math.floor(num / 1000);
  const remainder = num % 1000;
  return (
    (thousand ? convert_hundreds(thousand) + " Thousand " : "") +
    convert_hundreds(remainder)
  ).trim();
}

function formatAmount(amount) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default InvoicePage;
