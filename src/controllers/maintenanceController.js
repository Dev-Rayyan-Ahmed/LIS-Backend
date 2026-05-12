const db = require('../config/db');

const startup = async (req, res) => {
    const { machine_id, status, remarks } = req.body;
    const user_id = req.user.id;
    try {
        // Create maintenance log
        await db.query(
            'INSERT INTO maintenance_logs (machine_id, user_id, action_type, status, remarks) VALUES ($1, $2, $3, $4, $5)',
            [machine_id, user_id, 'startup', status, remarks]
        );

        // Update machine status
        await db.query(
            'UPDATE machines SET operational_status = $1, last_startup_time = CURRENT_TIMESTAMP WHERE id = $2',
            [status === 'Operational' ? 'online' : 'maintenance', machine_id]
        );

        res.json({ message: 'Startup logged successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const shutdown = async (req, res) => {
    const { machine_id, status, remarks } = req.body;
    const user_id = req.user.id;
    try {
        // Calculate shift duration (simplified for now)
        const machineResult = await db.query('SELECT last_startup_time FROM machines WHERE id = $1', [machine_id]);
        const lastStartup = machineResult.rows[0].last_startup_time;
        
        // Create maintenance log
        await db.query(
            'INSERT INTO maintenance_logs (machine_id, user_id, action_type, status, remarks, shift_duration) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP - $6)',
            [machine_id, user_id, 'shutdown', status, remarks, lastStartup]
        );

        // Update machine status
        await db.query(
            'UPDATE machines SET operational_status = $1, last_shutdown_time = CURRENT_TIMESTAMP WHERE id = $2',
            ['offline', machine_id]
        );

        res.json({ message: 'Shutdown logged successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const reportIssue = async (req, res) => {
    const { machine_id, remarks } = req.body;
    const user_id = req.user.id;
    try {
        await db.query(
            'INSERT INTO maintenance_logs (machine_id, user_id, action_type, status, remarks) VALUES ($1, $2, $3, $4, $5)',
            [machine_id, user_id, 'fault_report', 'Faulty', remarks]
        );

        await db.query(
            'UPDATE machines SET fault_status = TRUE WHERE id = $1',
            [machine_id]
        );

        res.json({ message: 'Issue reported successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLogs = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                ml.*,
                u.name as user_name,
                m.machine_name,
                m.machine_id as machine_tag
            FROM maintenance_logs ml
            JOIN users u ON ml.user_id = u.id
            JOIN machines m ON ml.machine_id = m.id
            ORDER BY ml.timestamp DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    startup,
    shutdown,
    reportIssue,
    getLogs
};
