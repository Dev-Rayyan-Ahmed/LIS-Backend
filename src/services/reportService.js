const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateDailyReport = (data, filePath) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        const stream = fs.createWriteStream(filePath);

        doc.on('error', (err) => {
            console.error('PDFKIT ERROR:', err);
            reject(err);
        });

        doc.pipe(stream);

        // --- THEME COLORS ---
        const primaryColor = '#1e1b4b'; // Deep Navy
        const accentColor = '#6366f1';  // Indigo
        const secondaryText = '#64748b'; // Slate
        const borderColor = '#e2e8f0';

        // --- HEADER ---
        // Blue Header Background
        doc.rect(0, 0, 612, 120).fill(primaryColor);
        
        doc.fillColor('white')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('LIS PRO', 50, 40)
           .fontSize(10)
           .font('Helvetica')
           .text('ADVANCED LABORATORY INFORMATION SYSTEM', 50, 70);

        doc.fillColor('white')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('MAINTENANCE AUDIT REPORT', 300, 45, { align: 'right' })
           .fontSize(8)
           .font('Helvetica')
           .text(`REFERENCE ID: ${data.reportId}`, 300, 65, { align: 'right' })
           .text(`GENERATED: ${new Date(data.reportId).toLocaleString().toUpperCase()}`, 300, 75, { align: 'right' });

        doc.moveDown(5);

        // --- MACHINE SUMMARY ---
        doc.fillColor(primaryColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('LABORATORY ASSET INVENTORY', 50, 140);
        
        doc.rect(50, 158, 512, 2).fill(accentColor);
        doc.moveDown(2);

        // Table Header
        const startY = 175;
        doc.fillColor(secondaryText).fontSize(8).font('Helvetica-Bold');
        doc.text('MACHINE NAME', 50, startY);
        doc.text('TAG ID', 220, startY);
        doc.text('LABORATORY', 320, startY);
        doc.text('OPERATIONAL STATUS', 450, startY);

        doc.rect(50, 188, 512, 1).fill(borderColor);

        let rowY = 200;
        data.machines.forEach((m) => {
            if (rowY > 700) { doc.addPage(); rowY = 50; }

            doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text(m.machine_name.toUpperCase(), 50, rowY);
            doc.fillColor(secondaryText).fontSize(8).font('Helvetica').text(`#${m.machine_id}`, 220, rowY);
            doc.text(m.laboratory_name, 320, rowY);
            
            const statusColor = m.operational_status === 'online' ? '#059669' : '#dc2626';
            doc.fillColor(statusColor).fontSize(8).font('Helvetica-Bold').text(m.operational_status.toUpperCase(), 450, rowY);

            rowY += 25;
        });

        // --- TELEMETRY LOGS ---
        doc.addPage();
        doc.fillColor(primaryColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('RECENT MAINTENANCE TELEMETRY', 50, 50);
        
        doc.rect(50, 68, 512, 2).fill(accentColor);
        
        rowY = 85;
        data.logs.forEach((log) => {
            if (rowY > 720) { doc.addPage(); rowY = 50; }

            // Log entry container
            doc.rect(50, rowY, 512, 45).fill('#f8fafc'); // Light background for each log
            
            doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text(new Date(log.timestamp).toLocaleTimeString(), 65, rowY + 10);
            doc.fillColor(accentColor).fontSize(8).font('Helvetica-Bold').text(log.action_type.toUpperCase(), 130, rowY + 10);
            
            const actorName = log.user_name || 'System';
            const mName = (log.machine_name || 'Unknown Asset').toUpperCase();
            const mTag = log.machine_tag || 'N/A';

            doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text(`${mName} (#${mTag})`, 220, rowY + 10);
            doc.fillColor(secondaryText).fontSize(8).font('Helvetica').text(`by ${actorName}`, 220, rowY + 22);
            
            doc.fillColor(secondaryText).fontSize(8).font('Helvetica-Oblique').text(`REMARKS: ${log.remarks || 'No detailed remarks provided.'}`, 65, rowY + 34, { width: 480 });
            
            rowY += 60;
        });

        // --- FOOTER (SIMPLIFIED) ---
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fillColor(secondaryText)
               .fontSize(7)
               .font('Helvetica')
               .text(`CONFIDENTIAL DOCUMENT - LIS PRO INTERNAL AUDIT | PAGE ${i + 1} OF ${pageCount}`, 50, 750, { align: 'center' });
        }

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', (err) => reject(err));
    });
};

module.exports = {
    generateDailyReport
};
