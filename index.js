// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // cors 모듈 import 추가
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const firebaseConfig = require('./firebaseConfig'); // firebaseConfig 가져오기

const app = express();
app.use(cors());
app.use(express.json()); // JSON 요청 처리

const server = http.createServer(app);

// Firebase 초기화
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Socket.IO 서버 초기화
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // 허용할 클라이언트 도메인
        methods: ["GET", "POST"],       // 허용할 HTTP 메서드
    },
});

// WebSocket 서버 포트 설정
const PORT = process.env.PORT;

// 기본 HTTP GET 요청 처리
app.get("/", (req, res) => {
    res.status(200).send("WebSocket 서버가 실행 중입니다.");
});

// HTTP POST 요청을 처리하는 엔드포인트 추가
app.post("/notice", (req, res) => {
    const { postId, title, message } = req.body;

    console.log("알림 수신 POST 요청:", { postId, title, message });

    // WebSocket을 통해 클라이언트로 알림 브로드캐스트
    io.emit("new-notice", { postId, title, message });

    res.status(200).send("알림 전송 성공");
});

// WebSocket 연결 이벤트
io.on('connection', (socket) => {
    console.log("웹소켓 연결 완료");

    // 클라이언트에서 UID를 수신하는 이벤트
    socket.on("register", async (data) => {
        const { uid } = data;
        console.log(`사용자 등록됨, UID: ${uid}`);
        socket.uid = uid; // 소켓에 UID 저장

        // 알림 데이터 초기 전송
        if (uid) {
            try {
                console.log('접근 유저 아이디', uid)
                const noticesSnap = await db.collection(`users/${uid}/noticeList`).get();
                console.log('접근 유저 알림 리스트', noticesSnap)
                const notices = noticesSnap.docs.map(doc => ({
                    noticeId: doc.id,
                    noticeType: doc.data().noticeType,
                    noticeText: doc.data().noticeTitle,
                    noticeAt: doc.data().noticeAt,
                    ...doc.data(),
                }));
                socket.emit("initial-notices", notices);
            } catch (error) {
                console.error("초기 알림 조회 실패:", error);
            }
        } else {
            console.log("초기 알림 조회 실패: uid 없음.");
        }
    });


    socket.on('disconnect', () => {
        console.log('클라이언트 연결 종료');
    });
});


// 서버 실행
server.listen(PORT, () => {
    console.log(`WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
