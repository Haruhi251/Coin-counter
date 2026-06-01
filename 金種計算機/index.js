'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const historyFilePath = path.join(__dirname, 'history.json');

let historyLog = [];
try {
  if (fs.existsSync(historyFilePath)) {
    const fileData = fs.readFileSync(historyFilePath, 'utf8');
    historyLog = JSON.parse(fileData);
    console.log('Previous history loaded successfully! ');
  }
} catch (e) {
  console.error('Failed to load history file, starting with empty log.', e);
}

function saveHistoryToFile() {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(historyLog, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save data to history.json ', e);
  }
}

const server = http.createServer((req, res) => {
  console.info(`[${new Date().toISOString()}] Requested: ${req.url} [${req.method}]`);


  if (req.url === '/api/history' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.id = Date.now();
        data.date = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        
        historyLog.unshift(data);

        if (historyLog.length > 10) {
          historyLog.pop(); 
        }

        saveHistoryToFile();

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error にゃ…😿');
      }
    });
    return;
  }

  if (req.url === '/api/history/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        const index = historyLog.findIndex(item => item.id === id);
        if (index !== -1) {
          historyLog.splice(index, 1);
          saveHistoryToFile();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Delete Error にゃ…😿');
      }
    });
    return;
  }

  if (req.url === '/api/history/clear' && req.method === 'POST') {

    historyLog = [];

    saveHistoryToFile();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (req.url === '/api/history' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(historyLog));
    return;
  }
  let filePath = req.url === '/' ? '/public/index.html' : req.url;
  if (req.url === '/calc') {
    filePath = '/public/calc.html';
  }

  const fullPath = path.join(__dirname, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found にゃん…😿');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}).on('error', e => {
  console.error(`[${new Date().toISOString()}] Server Error`, e);
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server running on port ${port} `);
});