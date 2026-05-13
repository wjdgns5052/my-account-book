const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB 주소 확인 로그 (비밀번호는 가리고 출력)
console.log('연결 시도 중인 DB 주소 존재 여부:', !!process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Supabase DB 연결 성공!');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                type TEXT,
                date TEXT,
                main_category TEXT,
                sub_category TEXT,
                amount INTEGER
            )
        `);
        client.release();
        console.log('🚀 테이블 확인 완료');
    } catch (err) {
        console.error('❌ DB 연결 에러 상세:', err.message);
    }
};
initDB();

app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM transactions ORDER BY date DESC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/data', async (req, res) => {
    const { type, date, main, sub, amount } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO transactions (type, date, main_category, sub_category, amount) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [type, date, main, sub, amount]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/data/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM transactions WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
    console.log(`서버 오픈! 포트: ${port}`);
});