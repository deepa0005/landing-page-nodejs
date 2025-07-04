// File: controllers/exportController.js
const db = require('../Configs/db.config');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// 📦 Export leads to Excel
exports.exportLeadsToExcel = async (req, res) => {
  try {
    const [leads] = await db.execute('SELECT * FROM leads ORDER BY submitted_at DESC');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    worksheet.columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'City', key: 'city' },
      { header: 'Message', key: 'message' },
      { header: 'Submitted At', key: 'submitted_at' },
    ];

    leads.forEach(lead => {
      worksheet.addRow(lead);
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="leads.xlsx"'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🧾 Export leads to PDF
exports.exportLeadsToPDF = async (req, res) => {
  try {
    const [leads] = await db.execute('SELECT * FROM leads ORDER BY submitted_at DESC');

    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename="leads.pdf"');
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);
    doc.fontSize(18).text('Leads Report', { align: 'center' });
    doc.moveDown();

    leads.forEach((lead, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${lead.name} - ${lead.email} - ${lead.phone} - ${lead.city || ''}\nMessage: ${lead.message}\nDate: ${lead.submitted_at}\n`,
        { paragraphGap: 8 }
      );
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
