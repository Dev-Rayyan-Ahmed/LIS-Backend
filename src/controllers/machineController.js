const db = require('../config/db');

const getMachines = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM machines ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createMachine = async (req, res) => {
    const { machine_id, machine_name, laboratory_name, assigned_user_id } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO machines (machine_id, machine_name, laboratory_name, assigned_user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [machine_id, machine_name, laboratory_name, assigned_user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateMachine = async (req, res) => {
    const { id } = req.params;
    const { machine_id, machine_name, laboratory_name, assigned_user_id, operational_status, fault_status } = req.body;
    try {
        // Fetch current machine state for logging
        const currentMachine = await db.query('SELECT * FROM machines WHERE id = $1', [id]);
        if (currentMachine.rows.length === 0) return res.status(404).json({ error: 'Machine not found' });
        
        const oldData = currentMachine.rows[0];

        const result = await db.query(
            `UPDATE machines SET 
                machine_id = COALESCE($1, machine_id),
                machine_name = COALESCE($2, machine_name),
                laboratory_name = COALESCE($3, laboratory_name),
                assigned_user_id = COALESCE($4, assigned_user_id),
                operational_status = COALESCE($5, operational_status),
                fault_status = COALESCE($6, fault_status)
             WHERE id = $7 RETURNING *`,
            [machine_id, machine_name, laboratory_name, assigned_user_id, operational_status, fault_status, id]
        );

        const updatedMachine = result.rows[0];

        // LOGGING LOGIC
        let actionType = 'maintenance';
        let remarks = '';

        if (oldData.fault_status === true && updatedMachine.fault_status === false) {
            actionType = 'startup';
            remarks = 'Admin cleared critical system integrity error';
        } else if (oldData.fault_status === false && updatedMachine.fault_status === true) {
            actionType = 'fault';
            remarks = 'Admin manually flagged system integrity error (Critical)';
        } else {
            remarks = 'Admin reconfigured asset parameters';
        }

        await db.query(
            'INSERT INTO maintenance_logs (machine_id, user_id, action_type, status, remarks) VALUES ($1, $2, $3, $4, $5)',
            [id, req.user.id, actionType, updatedMachine.operational_status, remarks]
        );

        res.json(updatedMachine);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteMachine = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM machines WHERE id = $1', [id]);
        res.json({ message: 'Machine deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getMachines,
    createMachine,
    updateMachine,
    deleteMachine
};
