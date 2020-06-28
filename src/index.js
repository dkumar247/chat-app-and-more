const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// server (emit) => cient(receive) - countUpdated
// client (emit) => server(receive) - increment

// io.on('connection', (socket) => {
//     console.log('New websocket connection!')

//     socket.emit('countUpdated', count)

//     socket.on('increment', () => {
//         count++;
//         // socket.emit('countUpdated', count)
//         io.emit('countUpdated', count)
//     })
// })

io.on('connection', (socket) => {

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        
        socket.emit('message', generateMessage('ADMIN','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('ADMIN',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
        // socket.emit, io.emit, io.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage', (messageData, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(messageData)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, messageData))
        callback()
    })

    socket.on('sendLocation', (locationData, callback) => {
        const user = getUser(socket.id)
        // io.emit('message', `Location: Latitude is ${locationData.latitude} and Longitude is ${locationData.longitude}`)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        // Below condition is important to check if user already joined, then only removed
        if(user) {
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log('Server is up on port', port)
    
})