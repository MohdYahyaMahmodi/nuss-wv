const express = require('express');
const fs = require('fs');
const path = require('path');
const xss = require('xss');
const app = express();
const port = 3005;

const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.static('.'));  // Serve static files from the current directory

let highscores = {};
let sleepSessions = {};
try {
    const data = fs.readFileSync('highscores.json', 'utf8');
    highscores = JSON.parse(data);
} catch (err) {}

// Serve the index.html file on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/highscores', (req, res) => {
    const highscoresArray = Object.values(highscores).sort((a, b) => b.score - a.score);
    res.json(highscoresArray);
});

app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    if (highscores[userId]) {
        res.json(highscores[userId]);
    } else {
        res.status(404).send('User not found');
    }
});

app.post('/startSleep', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        res.status(400).send('Invalid data');
        return;
    }
    if (sleepSessions[userId]) {
        res.status(400).send('Sleep session already in progress');
        return;
    }
    sleepSessions[userId] = { startTime: Date.now() };
    res.json({ success: true });
});

app.post('/stopSleep', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        res.status(400).send('Invalid data');
        return;
    }
    const session = sleepSessions[userId];
    if (!session) {
        res.status(400).send('No sleep session in progress');
        return;
    }
    const endTime = Date.now();
    const duration = Math.floor((endTime - session.startTime) / 1000);
    delete sleepSessions[userId];
    if (highscores[userId]) {
        if (duration > highscores[userId].score) {
            highscores[userId].score = duration;
            saveHighscores();
        }
    } else {
        res.status(400).send('User not found');
        return;
    }
    res.json({ success: true, duration });
});

app.post('/highscores', (req, res) => {
    let { userId, name } = req.body;
    if (!userId || !name) {
        res.status(400).send('Invalid data');
        return;
    }
    name = xss(name);
    if (!highscores[userId]) {
        highscores[userId] = { userId, name, score: 0 };
        saveHighscores();
    }
    res.json({ success: true });
});

function saveHighscores() {
    fs.writeFile('highscores.json', JSON.stringify(highscores), err => {});
}

app.get('/publicRooms', (req, res) => {
    const publicRooms = Object.values(rooms)
        .filter(room => room.roomType === 'public' && !room.started)
        .map(room => ({
            roomId: room.roomId,
            playersCount: Object.keys(room.users).length
        }));
    res.json(publicRooms);
});

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (data) => {
        const { roomId, userId, username, roomType, isRoomCreator } = data;
        socket.userId = userId;
        socket.username = xss(username);
        socket.roomId = roomId;
        const roomExists = rooms[roomId];
        if (!isRoomCreator && !roomExists) {
            socket.emit('roomNotFound');
            return;
        }
        if (isRoomCreator && roomExists) {
            socket.emit('roomAlreadyExists');
            return;
        }
        if (!roomExists) {
            rooms[roomId] = {
                users: {},
                started: false,
                roomType: roomType,
                roomCreator: isRoomCreator ? userId : null,
                roomId: roomId
            };
        }
        const room = rooms[roomId];
        if (!room.roomCreator && isRoomCreator) {
            room.roomCreator = userId;
        }
        socket.join(roomId);
        room.users[userId] = {
            userId: userId,
            username: socket.username,
            sleepTime: 0
        };
        io.to(roomId).emit('currentUsers', {
            users: Object.values(room.users),
            roomCreator: room.roomCreator
        });
        if (room.started) {
            socket.emit('gameStarted');
        }
    });

    socket.on('startGame', () => {
        if (!socket.roomId) return;
        const room = rooms[socket.roomId];
        if (room && !room.started && room.roomCreator === socket.userId) {
            room.started = true;
            io.to(socket.roomId).emit('gameStarted');
        }
    });

    socket.on('startSleep', () => {
        if (!socket.roomId || !socket.userId) return;
        const room = rooms[socket.roomId];
        if (room && room.started) {
            if (!room.users[socket.userId].startTime) {
                room.users[socket.userId].startTime = Date.now();
                socket.emit('sleepStarted');
            }
        }
    });

    socket.on('updateSleepTime', (data) => {
        const { sleepTime } = data;
        if (socket.roomId && socket.userId) {
            const room = rooms[socket.roomId];
            if (room && room.users[socket.userId]) {
                room.users[socket.userId].sleepTime = sleepTime;
                io.to(socket.roomId).emit('userSleepUpdated', {
                    userId: socket.userId,
                    sleepTime: sleepTime,
                    username: socket.username
                });
            }
        }
    });

    socket.on('stopSleep', () => {
        if (!socket.roomId || !socket.userId) return;
        const room = rooms[socket.roomId];
        if (room && room.users[socket.userId].startTime) {
            const endTime = Date.now();
            const duration = Math.floor((endTime - room.users[socket.userId].startTime) / 1000);
            room.users[socket.userId].sleepTime = duration;
            delete room.users[socket.userId].startTime;
            if (highscores[socket.userId]) {
                if (duration > highscores[socket.userId].score) {
                    highscores[socket.userId].score = duration;
                    saveHighscores();
                }
            }
            socket.emit('sleepStopped', { duration });
            io.to(socket.roomId).emit('userSleepUpdated', {
                userId: socket.userId,
                sleepTime: duration,
                username: socket.username,
                hasStopped: true
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.roomId && socket.userId) {
            const room = rooms[socket.roomId];
            if (room) {
                if (room.users[socket.userId]) {
                    delete room.users[socket.userId].startTime;
                    io.to(socket.roomId).emit('userLeft', {
                        userId: socket.userId,
                        username: socket.username
                    });
                }
                if (Object.keys(room.users).length === 0) {
                    delete rooms[socket.roomId];
                } else {
                    if (room.roomCreator === socket.userId) {
                        room.roomCreator = Object.keys(room.users)[0];
                        io.to(socket.roomId).emit('currentUsers', {
                            users: Object.values(room.users),
                            roomCreator: room.roomCreator
                        });
                    }
                }
            }
        }
    });
});

http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});