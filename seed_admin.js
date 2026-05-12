const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Create Admin & Assistants
        const pass = await bcrypt.hash('admin123', 10);
        
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role) VALUES 
            ('System Admin', 'admin@lis.com', $1, 'admin'),
            ('Sarah Connor', 'sarah@lis.com', $1, 'assistant'),
            ('James Bond', 'james@lis.com', $1, 'assistant'),
            ('Bruce Wayne', 'bruce@lis.com', $1, 'assistant')
            ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
            RETURNING id, name, email, role
        `, [pass]);

        const assistants = userResult.rows.filter(u => u.role === 'assistant');
        const admin = userResult.rows.find(u => u.role === 'admin');

        // 2. Create Machines
        const machines = [
            ['M-101', 'Hematology Analyzer', 'Pathology Lab', assistants[0].id],
            ['M-102', 'Biochemistry System', 'Bio Lab', assistants[0].id],
            ['M-103', 'Centrifuge X-200', 'Pathology Lab', assistants[1].id],
            ['M-104', 'Microscope LX', 'Microbiology Lab', assistants[2].id],
            ['M-105', 'Incubator Pro', 'Microbiology Lab', assistants[1].id]
        ];

        for (const [id, name, lab, userId] of machines) {
            await pool.query(`
                INSERT INTO machines (machine_id, machine_name, laboratory_name, assigned_user_id, operational_status)
                VALUES ($1, $2, $3, $4, 'online')
                ON CONFLICT (machine_id) DO NOTHING
            `, [id, name, lab, userId]);
        }

        // 3. Add some Maintenance Logs for the last 3 days
        const machineIdsResult = await pool.query('SELECT id FROM machines');
        const machineIds = machineIdsResult.rows.map(r => r.id);

        for (let i = 0; i < 3; i++) {
            for (const mId of machineIds) {
                await pool.query(`
                    INSERT INTO maintenance_logs (machine_id, user_id, action_type, status, remarks, timestamp)
                    VALUES ($1, $2, 'startup', 'Operational', 'Daily check', CURRENT_TIMESTAMP - INTERVAL '${i} days')
                `, [mId, assistants[0].id]);
            }
        }

        console.log('✅ Database seeded successfully with dummy data!');
    } catch (err) {
        console.error('❌ Error seeding database:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
