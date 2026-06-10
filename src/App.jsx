"use client";

import React, { useState, useRef } from "react";
import { Input, Button, Form, DatePicker } from "antd";
import { useReactToPrint } from "react-to-print";
import "./invoice.css"; // import the CSS below
import logo from "./assets/logo.png"; // Placeholder for logo image

import { ADToBS } from "bikram-sambat-js";

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
  const invoiceRef = useRef(null);

  const reactToPrintFn = useReactToPrint({
    contentRef: invoiceRef,
  });

  const handlePrint = () => {
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // For iOS, use native window.print() which requires user interaction
      window.print();
    } else {
      // For other devices, use react-to-print
      reactToPrintFn();
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

export default InvoicePage;
