const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Keep track of the 6 stations (Initial state: 0 = empty)
// State 0: Off, State 1: Dim, State 2: Bright
let stations = [0, 0, 0, 0, 0, 0];

io.on('connection', (socket) => {
    console.log('A committee member connected:', socket.id);

    // Send the current station states to the newly connected user
    socket.emit('init_states', stations);

    // Listen for state changes from any user
    socket.on('toggle_station', (index) => {
        if (index >= 0 && index < 6) {
            // Cycle the state: 0 -> 1 -> 2 -> 0
            stations[index] = (stations[index] + 1) % 3;
            
            // Broadcast the updated states to EVERYONE (including the sender)
            io.emit('update_states', stations);
        }
    });

    socket.on('disconnect', () => {
        console.log('A committee member disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});