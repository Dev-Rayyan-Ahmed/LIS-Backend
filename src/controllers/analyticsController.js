const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_machines,
                COUNT(*) FILTER (WHERE operational_status = 'online') as active_machines,
                COUNT(*) FILTER (WHERE operational_status = 'offline') as offline_machines,
                COUNT(*) FILTER (WHERE fault_status = TRUE) as faulty_machines
            FROM machines
        `);

        const activityTrends = await db.query(`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*)::INTEGER as logs_count
            FROM maintenance_logs
            GROUP BY DATE(timestamp)
            ORDER BY DATE(timestamp) ASC
            LIMIT 7
        `);

        const recentLogs = await db.query(`
            SELECT l.*, m.machine_name, u.name as user_name
            FROM maintenance_logs l
            JOIN machines m ON l.machine_id = m.id
            JOIN users u ON l.user_id = u.id
            ORDER BY l.timestamp DESC
            LIMIT 5
        `);

        res.json({
            summary: stats.rows[0],
            trends: activityTrends.rows,
            recentLogs: recentLogs.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSystemAuditLogs = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, u.name as user_name
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getDashboardStats,
    getSystemAuditLogs
};
