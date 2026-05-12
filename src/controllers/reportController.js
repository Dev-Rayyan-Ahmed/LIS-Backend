const db = require('../config/db');
const reportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');

const getReports = async (req, res) => {
    try {
        // In a real app, you'd track generated reports in a DB table
        // For now, we'll just list files in the reports directory
        const reportsDir = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const files = fs.readdirSync(reportsDir);
        res.json(files.map(f => ({ name: f, url: `/reports/${f}` })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const generateReport = async (req, res) => {
    try {
        const machinesResult = await db.query('SELECT * FROM machines');
        const logsResult = await db.query(`
            SELECT 
                l.id,
                l.action_type,
                l.status,
                l.remarks,
                l.timestamp,
                u.name as user_name,
                m.machine_name,
                m.machine_id as machine_tag
            FROM maintenance_logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            LEFT JOIN machines m ON l.machine_id = m.id
            ORDER BY l.timestamp DESC 
            LIMIT 50
        `);

        const reportId = Date.now();
        const fileName = `daily_report_${reportId}.pdf`;
        const reportsDir = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);

        await reportService.generateDailyReport(
            { machines: machinesResult.rows, logs: logsResult.rows, reportId },
            filePath
        );

        res.json({ message: 'Report generated successfully', fileName, url: `/reports/${fileName}` });
    } catch (err) {
        console.error('REPORT GENERATION ERROR:', err);
        res.status(500).json({ error: err.message });
    }
};

const deleteReport = async (req, res) => {
    const { fileName } = req.params;
    try {
        const filePath = path.join(__dirname, '../../reports', fileName);
        
        // 1. Delete the physical file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 2. Parse human readable info for Audit Log
        const timestamp = parseInt(fileName.split('_')[2]);
        const formattedTime = !isNaN(timestamp) 
            ? new Date(timestamp).toLocaleString() 
            : 'Unknown Time';

        // 3. Log the action in Audit Logs for accountability
        await db.query(
            'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
            [req.user.id, `DELETED REPORT: Intelligence Audit (Generated: ${formattedTime})`, req.ip]
        );

        res.json({ message: 'Report purged and action logged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getReports,
    generateReport,
    deleteReport
};
