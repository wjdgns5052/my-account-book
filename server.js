const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json());
// 현재 폴더의 index.html을 보여주기 위한 설정
app.use(express.static(path.join(__dirname)));

// 데이터베이스 연결 및 테이블 생성
const db = new sqlite3.Database('./accountbook.db', (err) => {
    if (err) return console.error("DB 연결 실패:", err.message);
    console.log('데이터베이스 파일(accountbook.db)이 생성되었습니다.');
});

db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    date TEXT,
    main_category TEXT,
    sub_category TEXT,
    amount INTEGER
)`);

// [API 1] 모든 내역 가져오기
app.get('/api/data', (req, res) => {
    db.all("SELECT * FROM transactions ORDER BY date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// [API 2] 내역 저장하기
app.post('/api/data', (req, res) => {
    const { type, date, main, sub, amount } = req.body;
    const sql = `INSERT INTO transactions (type, date, main_category, sub_category, amount) VALUES (?,?,?,?,?)`;
    db.run(sql, [type, date, main, sub, amount], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// [API 3] 내역 수정하기
app.put('/api/data/:id', (req, res) => {
    const { type, date, main, sub, amount } = req.body;
    const { id } = req.params;
    const sql = `UPDATE transactions SET type=?, date=?, main_category=?, sub_category=?, amount=? WHERE id=?`;
    db.run(sql, [type, date, main, sub, amount, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// [API 4] 내역 삭제하기
app.delete('/api/data/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM transactions WHERE id = ?", id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`🚀 서버 실행 중! 브라우저 주소창에 http://localhost:${port} 를 입력하세요.`);
});