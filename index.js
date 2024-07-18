const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));
app.use(express.static(path.resolve("./public")));

app.get('/', (req, res) => {
    res.render('index');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processMessage(socket, message, options) {
    if (options.echo) {
        for (let char of message) {
            socket.emit('output', { type: 'echo', data: char });
            await sleep(100);
        }
    }

    if (options.reverse) {
        for (let char of message.split('').reverse().join('')) {
            socket.emit('output', { type: 'reverse', data: char });
            await sleep(100);
        }
    }

    if (options.occurrence) {
        if (message.length > 1) {
            const lastChar = message[message.length - 1];
            const count = message.slice(0, -1).split(lastChar).length - 1;
            socket.emit('output', { type: 'occurrence', data: `Occurrences of '${lastChar}' (excluding last): ${count}` });
            await sleep(100);
        } else {
            socket.emit('output', { type: 'occurrence', data: 'Message too short for occurrence count' });
            await sleep(100);
        }
    }
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', async (data) => {
        const { message, options } = data;
        await processMessage(socket, message, options);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});