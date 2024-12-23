// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // cors 모듈 import 추가

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); // CORS 미들웨어 추가

const server = http.createServer(app);

// Socket.IO 서버 초기화
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // 허용할 클라이언트 도메인
        methods: ["GET", "POST"],       // 허용할 HTTP 메서드
    },
});

// WebSocket 서버 포트 설정
const PORT = 8000;

// WebSocket 연결 이벤트
io.on('connection', (socket) => {
    console.log('클라이언트 연결 성공');

    // HTTP POST 요청을 처리하는 엔드포인트 추가
    app.post("/notice", (req, res) => {
        const { postId, title, message } = req.body;

        console.log("알림 수신 POST 요청:", { postId, title, message });

        // WebSocket을 통해 클라이언트로 알림 브로드캐스트
        io.emit("new-notice", { postId, title, message });

        res.status(200).send("알림 전송 성공");
    });

    // 클라이언트 연결 해제 이벤트
    socket.on('disconnect', () => {
        console.log('클라이언트 연결 종료');
    });
});

// 서버 실행
server.listen(PORT, () => {
    console.log(`WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
