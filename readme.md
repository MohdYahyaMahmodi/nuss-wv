# New Ultimate Sleeping Simulator Web Version v1.0

New Ultimate Sleeping Simulator Web Version is an interactive web-based game that challenges players to sleep for as long as possible. This project demonstrates the use of Node.js, Express.js, and Socket.IO to create a real-time multiplayer experience.

**[Try the Demo](https://nuss.mohdmahmodi.com)**

## Features

- Single-player and multiplayer modes
- Multiple game modes: Classic, 10000 seconds, and Speed Sleep
- Real-time multiplayer functionality
- Persistent high scores
- User authentication

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Real-time Communication: Socket.IO
- Data Storage: File system (JSON)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/MohdYahyaMahmodi/nuss-wv.git
   ```

2. Navigate to the project directory:
   ```
   cd nuss-wv
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the server:
   ```
   node server.js
   ```

5. Open a web browser and visit `http://localhost:3000` (or the port specified in your environment).

## Usage

1. Enter a username when prompted.
2. Choose from the available options in the main menu:
   - Start a new game
   - Change game mode
   - Join or create a multiplayer room
   - View game information and high scores

3. In single-player mode, type "wake up" to end your sleep session.
4. In multiplayer mode, wait for the room creator to start the game, then compete with other players.

## API Endpoints

- `GET /highscores`: Retrieve all high scores
- `GET /user/:id`: Get user information
- `POST /startSleep`: Start a sleep session
- `POST /stopSleep`: Stop a sleep session and record the score
- `POST /highscores`: Create or update a user's information
- `GET /publicRooms`: List available public multiplayer rooms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [xss](https://github.com/leizongmin/js-xss)

## Author

Mohd Mahmodi
- Website: [Mohdmahmodi.com](https://mohdmahmodi.com)
- Twitter: [@MohdMahmodi](https://twitter.com/MohdMahmodi)