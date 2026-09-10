const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Keep track of 6 stations. 
// state: 0 (Empty), 1 (Standby), 2 (Ongoing)
// queue: Array of team numbers en route (e.g., [4, 7])
let stations = Array.from({ length: 6 }, () => ({ state: 0, queue: [] }));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.emit('init_states', stations);

    // Committee action: Change the lighting state
    socket.on('cycle_state', (index) => {
        if (index >= 0 && index < 6) {
            stations[index].state = (stations[index].state + 1) % 3;
            io.emit('update_states', stations);
        }
    });

    // Player action: join or leave this station's queue.
    socket.on('toggle_queue', ({ index, teamId }) => {
        if (index >= 0 && index < 6 && teamId) {
            const isQueuedHere = stations[index].queue.includes(teamId);

            // A team may only be queued at one station at a time.
            stations.forEach(station => {
                station.queue = station.queue.filter(id => id !== teamId);
            });

            if (!isQueuedHere) {
                stations[index].queue.push(teamId);
            }

            io.emit('update_states', stations);
        }
    });

    // Committee action: remove one team from one station's queue.
    socket.on('remove_from_queue', ({ index, teamId }) => {
        if (index >= 0 && index < 6 && teamId) {
            stations[index].queue = stations[index].queue.filter(id => id !== teamId);
            io.emit('update_states', stations);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
