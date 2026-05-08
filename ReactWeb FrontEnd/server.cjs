const express = require('express');
const path = require('path'); // Yêu cầu thêm module 'path' có sẵn của Node.js
const app = express();
const port = 25490;

// 1. Chỉ định Express phục vụ các file tĩnh từ thư mục 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Bắt tất cả các đường dẫn (routes) và trả về file 'index.html' trong 'dist'
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});