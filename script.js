const output = document.getElementById('output');
const userInput = document.getElementById('user-input');

let ver = "v1.0";
let mode = "Classic";
let intervalId = null;
let gameState = 'initializing';
let username = '';
let userId = '';
let highscore = 0;

let sleepStartTime = null;
let socket = null;
let roomId = '';
let isRoomCreator = false;

let multiplayerUsers = {}; 
let availablePublicRooms = []; 

function initializeUser() {
    userId = localStorage.getItem('userId');
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('userId', userId);
    }
    fetchUserData();
}

function fetchUserData() {
    fetch(`/user/${userId}`)
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('User not found');
            }
        })
        .then(data => {
            username = data.name;
            highscore = data.score || 0;
            mainMenu();
        })
        .catch(err => {
            askUsername();
        });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getMenuText() {
    return `New Ultimate Sleeping Simulator Web Version ${ver} 

Highscore: ${highscore} seconds

1. Start
2. Change mode
3. Multiplayer
4. About
5. Changelog
6. Tutorial
7. View Highscores
`;
}

const aboutText = `New Ultimate Sleeping Simulator Web Version ${ver}

The goal of the game:

The goal of the game is to sleep the longest you can. You can sleep for as long as you want and wake up whenever you want. The game will keep track of how long you've slept and submit your score to the highscores.
`;

const changelogText = `Changelog:

v1.0

Added Multiplayer Mode (Public and Private Rooms)
Display user highscore in the menu
Added Tutorial
Added a new 10000 seconds mode as well as the ability to change between gamemodes
Added about menu
Added changelog
`;

const tutorialText = `Sleep.
`;

function clearOutput() {
    output.textContent = '';
}

function print(text) {
    output.textContent += text + '\n';
    output.scrollTop = output.scrollHeight;
}

function setPrompt(text) {
    document.getElementById('prompt').textContent = text;
}

function mainMenu() {
    gameState = 'menu';
    clearOutput();
    print(`Welcome ${username}!\n`);
    print(getMenuText());
    setPrompt('[1-7]>> ');
}

function about() {
    clearOutput();
    print(aboutText);
    print('\nPress ENTER to continue');
    gameState = 'about';
    setPrompt('>> ');
}

function changelog() {
    clearOutput();
    print(changelogText);
    print('\nPress ENTER to continue');
    gameState = 'changelog';
    setPrompt('>> ');
}

function tutorial() {
    clearOutput();
    print(tutorialText);
    print('\nPress ENTER to continue');
    gameState = 'tutorial';
    setPrompt('>> ');
}

function changeMode() {
    clearOutput();
    print(`Selected mode:
${mode}

Available modes:
1. Classic
2. 10000 seconds
3. Speed Sleep (Sleep as much as you can in 30 seconds)

Type 'exit' to exit.
`);
    gameState = 'changeMode';
    setPrompt('[1-3,exit]>> ');
}

function startSleeping() {
    clearOutput();
    gameState = 'sleeping';
    sleepStartTime = Date.now();
    fetch('/startSleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            startSleepInterval();
            setPrompt('Type "wake up" to stop >> ');
        } else {
            print('Failed to start sleep session.');
            mainMenu();
        }
    })
    .catch(err => {
        print('Error starting sleep session.');
        mainMenu();
    });
}

function startSleepInterval() {
    intervalId = setInterval(() => {
        let elapsed = Math.floor((Date.now() - sleepStartTime) / 1000);
        clearOutput();
        print('Sleeping...');
        print(`You have slept for ${elapsed} seconds.`);
        if (mode === 'Speed Sleep' && elapsed >= 30) {
            stopSleeping();
        }
    }, 1000);
}

function startTenK() {
    clearOutput();
    gameState = 'tenkIntro';
    print('In 10000 seconds mode you have to sleep for 10000 seconds straight without waking up. Good luck!');
    print('\nPress ENTER to continue');
    setPrompt('>> ');
}

function tenKSleeping() {
    clearOutput();
    gameState = 'tenkSleeping';
    sleepStartTime = Date.now();
    fetch('/startSleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            startTenKSleepInterval();
            setPrompt('Type "wake up" to stop >> ');
        } else {
            print('Failed to start sleep session.');
            mainMenu();
        }
    })
    .catch(err => {
        print('Error starting sleep session.');
        mainMenu();
    });
}

function startTenKSleepInterval() {
    intervalId = setInterval(() => {
        let elapsed = Math.floor((Date.now() - sleepStartTime) / 1000);
        clearOutput();
        print('Sleeping...');
        print(`You have slept for ${elapsed} seconds.`);
        print(`${10000 - elapsed} seconds left.`);
        if (elapsed >= 10000) {
            clearInterval(intervalId);
            stopSleeping(true);
        }
    }, 1000);
}

function stopSleeping(completed = false) {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    fetch('/stopSleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let duration = data.duration;
            clearOutput();
            if (completed && mode === '10000 seconds') {
                print("You've beaten 10000 seconds mode! Good job!");
            } else {
                print(`You slept for ${duration} seconds.`);
            }
            print('Score submitted successfully!');

            if (duration > highscore) {
                highscore = duration;
            }
            showHighscores();
        } else {
            print('Failed to stop sleep session.');
            mainMenu();
        }
    })
    .catch(err => {
        print('Error stopping sleep session.');
        mainMenu();
    });
}

function showHighscores() {
    fetch('/highscores')
    .then(res => res.json())
    .then(highscores => {
        clearOutput();
        print('Highscores:\n');
        highscores.forEach((entry, index) => {
            print(`${index + 1}. ${entry.name} - ${entry.score}`);
        });
        print('\nPress ENTER to continue');
        gameState = 'afterSleeping';
        setPrompt('>> ');
    })
    .catch(err => {
        print('Error fetching highscores.');
        gameState = 'afterSleeping';
        setPrompt('>> ');
    });
}

function multiplayerMenu() {
    clearOutput();
    print('Multiplayer Mode:\n');
    print('1. Join a Public Room');
    print('2. Join a Private Room');
    print('3. Create a Public Room');
    print('4. Create a Private Room');
    print('Type "exit" to go back.');
    gameState = 'multiplayerMenu';
    setPrompt('[1-4,exit]>> ');
}

function listPublicRooms() {
    fetch('/publicRooms')
        .then(res => res.json())
        .then(rooms => {
            if (rooms.length === 0) {
                clearOutput();
                print('No public rooms available.');
                print('1. Create a Public Room');
                print('Type "exit" to go back.');
                gameState = 'noPublicRooms';
                setPrompt('[1,exit]>> ');
            } else {
                clearOutput();
                print('Available Public Rooms:\n');
                rooms.forEach((room, index) => {
                    print(`${index + 1}. Room ID: ${room.roomId} - Players: ${room.playersCount}`);
                });
                print('\nEnter the number of the room to join or type "exit" to go back.');
                gameState = 'selectPublicRoom';
                setPrompt('>> ');
                availablePublicRooms = rooms;
            }
        })
        .catch(err => {
            print('Error fetching public rooms.');
            multiplayerMenu();
        });
}

function joinPrivateRoom() {
    clearOutput();
    print('Enter the 6-digit Room ID to join:');
    gameState = 'joinPrivateRoom';
    setPrompt('Room ID>> ');
}

function createRoom(roomType) {
    if (roomType === 'public') {
        roomId = generateRoomId();
        isRoomCreator = true;
        startMultiplayer('public');
    } else if (roomType === 'private') {
        clearOutput();
        print('Enter a 6-digit Room ID to create:');
        gameState = 'createPrivateRoom';
        setPrompt('Room ID>> ');
    }
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, 6);
}

function startMultiplayer(roomType) {
    clearOutput();
    print(`Starting Multiplayer in Room: ${roomId}`);
    gameState = 'multiplayerWait';
    initializeSocket(roomType);
}

function initializeSocket(roomType) {
    socket = io();
    socket.emit('joinRoom', { roomId, userId, username, roomType, isRoomCreator });

    socket.on('roomNotFound', () => {
        print('Room does not exist.');
        print('Type "exit" to go back.');
        gameState = 'roomNotFound';
        setPrompt('>> ');
    });

    socket.on('currentUsers', (data) => {
        multiplayerUsers = {};
        clearOutput();
        print('Current players in room:');
        data.users.forEach(user => {
            multiplayerUsers[user.userId] = user;
            print(`- ${user.username}`);
        });
        if (data.roomCreator === userId) {
            isRoomCreator = true;
            print('\nYou are the room creator. Type "start" to begin the game.');
        } else {
            isRoomCreator = false;
            print('\nWaiting for creator to start the game.');
        }
        setPrompt('>> ');
    });

    socket.on('gameStarted', () => {
        print('Game has started!');
        startMultiplayerSleep();
    });

    socket.on('userSleepUpdated', (data) => {
        if (!multiplayerUsers[data.userId]) {
            multiplayerUsers[data.userId] = { username: data.username };
        }
        multiplayerUsers[data.userId].sleepTime = data.sleepTime;
        if (data.hasStopped) {
            multiplayerUsers[data.userId].hasStopped = true;
            if (data.userId !== userId) {
                print(`${multiplayerUsers[data.userId].username} has woken up after sleeping for ${data.sleepTime} seconds.`);
            }
        }
        displayMultiplayerStatus();
    });

    socket.on('userLeft', (data) => {
        if (multiplayerUsers[data.userId]) {
            print(`${multiplayerUsers[data.userId].username} has left the room.`);
            multiplayerUsers[data.userId].hasLeft = true;
            displayMultiplayerStatus();
        }
    });

    socket.on('userDisconnected', (data) => {
        if (multiplayerUsers[data.userId]) {
            print(`${multiplayerUsers[data.userId].username} has disconnected.`);
            multiplayerUsers[data.userId].hasLeft = true;
            displayMultiplayerStatus();
        }
    });
}

function startMultiplayerSleep() {
    sleepStartTime = Date.now();
    multiplayerUsers[userId].hasStopped = false;
    socket.emit('startSleep');
    intervalId = setInterval(() => {
        let elapsed = Math.floor((Date.now() - sleepStartTime) / 1000);
        multiplayerUsers[userId].sleepTime = elapsed;
        socket.emit('updateSleepTime', { sleepTime: elapsed });
        displayMultiplayerStatus();
    }, 1000);
    gameState = 'multiplayer';
    setPrompt('Type "wake up" to stop >> ');
}

function displayMultiplayerStatus() {
    clearOutput();
    print('Multiplayer Sleep Status:\n');
    const sortedUsers = Object.values(multiplayerUsers).sort((a, b) => (b.sleepTime || 0) - (a.sleepTime || 0));
    sortedUsers.forEach((user, index) => {
        let status = '';
        if (user.hasLeft) {
            status = '(Left)';
        } else if (user.hasStopped) {
            status = '(Stopped)';
        }
        print(`${index + 1}. ${user.username}: ${user.sleepTime || 0} seconds ${status}`);
    });

    const activePlayers = sortedUsers.filter(user => !user.hasStopped && !user.hasLeft);
    if (activePlayers.length === 0) {
        const maxSleepTime = Math.max(...sortedUsers.map(u => u.sleepTime || 0));
        const winners = sortedUsers.filter(u => (u.sleepTime || 0) === maxSleepTime);
        if (winners.length === 1) {
            const winner = winners[0];
            if (winner.userId === userId) {
                print(`\nCongratulations ${username}, you won with ${winner.sleepTime} seconds!`);
            } else {
                print(`\n${winner.username} won with ${winner.sleepTime} seconds.`);
            }
        } else {
            const winnerNames = winners.map(u => u.username).join(', ');
            print(`\nIt's a tie between ${winnerNames} with ${maxSleepTime} seconds.`);
        }
        print('Type "exit" to return to the main menu.');
        gameState = 'multiplayerEnd';
        setPrompt('>> ');
    }
}

function stopMultiplayerSleep() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    socket.emit('stopSleep');
    multiplayerUsers[userId].hasStopped = true;
    displayMultiplayerStatus();
    gameState = 'multiplayerStopped';
    setPrompt('Type "exit" to return to the main menu.');
}

function handleInput(input) {
    input = input.trim();
    if (gameState === 'enterName') {
        if (input) {
            username = input;
            fetch('/highscores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name: username })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    mainMenu();
                } else {
                    print('Failed to save username. Try again.');
                }
            })
            .catch(err => {
                print('Error saving username. Try again.');
            });
        } else {
            print('Please enter a valid username.');
        }
    } else if (gameState === 'menu') {
        if (input === '1') {
            if (mode === 'Classic') {
                startSleeping();
            } else if (mode === '10000 seconds') {
                startTenK();
            } else if (mode === 'Speed Sleep') {
                startSleeping();
            }
        } else if (input === '2') {
            changeMode();
        } else if (input === '3') {
            multiplayerMenu();
        } else if (input === '4') {
            about();
        } else if (input === '5') {
            changelog();
        } else if (input === '6') {
            tutorial();
        } else if (input === '7') {
            showHighscores();
            gameState = 'viewHighscores';
            setPrompt('>> ');
        } else {
            print('Invalid input. Please enter a number between 1 and 7.');
        }
    } else if (['about', 'changelog', 'tutorial', 'afterSleeping', 'viewHighscores'].includes(gameState)) {
        mainMenu();
    } else if (gameState === 'changeMode') {
        if (input === '1') {
            mode = 'Classic';
            print(`Game mode changed to ${mode}.`);
            changeMode();
        } else if (input === '2') {
            mode = '10000 seconds';
            print(`Game mode changed to ${mode}.`);
            changeMode();
        } else if (input === '3') {
            mode = 'Speed Sleep';
            print(`Game mode changed to ${mode}.`);
            changeMode();
        } else if (input.toLowerCase() === 'exit') {
            mainMenu();
        } else {
            print('Invalid input. Please enter 1, 2, 3, or exit.');
        }
    } else if (gameState === 'sleeping' || gameState === 'tenkSleeping') {
        if (input.toLowerCase() === 'wake up') {
            stopSleeping();
        }
    } else if (gameState === 'tenkIntro') {
        tenKSleeping();
    } else if (gameState === 'multiplayerMenu') {
        if (input === '1') {
            listPublicRooms();
        } else if (input === '2') {
            joinPrivateRoom();
        } else if (input === '3') {
            createRoom('public');
        } else if (input === '4') {
            createRoom('private');
        } else if (input.toLowerCase() === 'exit') {
            mainMenu();
        } else {
            print('Invalid input. Please enter 1-4, or exit.');
        }
    } else if (gameState === 'noPublicRooms') {
        if (input === '1') {
            createRoom('public');
        } else if (input.toLowerCase() === 'exit') {
            multiplayerMenu();
        } else {
            print('Invalid input. Please enter 1 or "exit".');
        }
    } else if (gameState === 'selectPublicRoom') {
        if (input.toLowerCase() === 'exit') {
            multiplayerMenu();
        } else {
            const roomNumber = parseInt(input);
            if (!isNaN(roomNumber) && roomNumber >= 1 && roomNumber <= availablePublicRooms.length) {
                const selectedRoom = availablePublicRooms[roomNumber - 1];
                roomId = selectedRoom.roomId;
                isRoomCreator = false;
                startMultiplayer('public');
            } else {
                print('Invalid selection. Please enter a valid room number or "exit" to go back.');
            }
        }
    } else if (gameState === 'joinPrivateRoom') {
        if (input.length === 6 && /^[0-9]+$/.test(input)) {
            roomId = input;
            isRoomCreator = false;
            startMultiplayer('private');
        } else {
            print('Invalid Room ID. Please enter a 6-digit number.');
        }
    } else if (gameState === 'createPrivateRoom') {
        if (input.length === 6 && /^[0-9]+$/.test(input)) {
            roomId = input;
            isRoomCreator = true;
            startMultiplayer('private');
        } else {
            print('Invalid Room ID. Please enter a 6-digit number.');
        }
    } else if (gameState === 'multiplayerWait') {
        if (isRoomCreator && input.toLowerCase() === 'start') {
            socket.emit('startGame');
        } else if (!isRoomCreator) {
            print('Waiting for creator to start the game.');
        } else {
            print('Invalid input. Type "start" to begin the game.');
        }
    } else if (gameState === 'roomNotFound') {
        if (input.toLowerCase() === 'exit') {
            multiplayerMenu();
        } else {
            print('Invalid input. Type "exit" to go back.');
        }
    } else if (gameState === 'multiplayer') {
        if (input.toLowerCase() === 'wake up') {
            stopMultiplayerSleep();
        }
    } else if (gameState === 'multiplayerStopped') {
        if (input.toLowerCase() === 'exit') {
            if (socket) {
                socket.disconnect();
            }
            mainMenu();
        } else {
            print('Invalid input. Type "exit" to return to the main menu.');
        }
    } else if (gameState === 'multiplayerEnd') {
        if (input.toLowerCase() === 'exit') {
            if (socket) {
                socket.disconnect();
            }
            mainMenu();
        } else {
            print('Invalid input. Type "exit" to return to the main menu.');
        }
    }
}

userInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const input = userInput.value;
        userInput.value = '';
        handleInput(input);
    }
});

initializeUser();

function askUsername() {
    clearOutput();
    print('Welcome to New Ultimate Sleeping Simulator Web Version!');
    print('Please enter your username:');
    setPrompt('Username: ');
    gameState = 'enterName';
}

window.addEventListener('beforeunload', () => {
    if (gameState === 'sleeping' || gameState === 'tenkSleeping') {
        stopSleeping();
    } else if (gameState === 'multiplayer' || gameState === 'multiplayerWait' || gameState === 'multiplayerStopped') {
        if (socket) {
            socket.emit('stopSleep');
            socket.disconnect();
        }
    }
});