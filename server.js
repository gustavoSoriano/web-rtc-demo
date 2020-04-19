const app  = require('express')()
const http = require('http').createServer(app)
app.io     = require('socket.io')(http)
app.io.set('origins', '*:*')

app.io.use(async (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.sala && socket.handshake.query.name) 
    {
        let { sala, name } = socket.handshake.query
        socket.join(sala)
        socket.room = sala
        socket.name = name
        return next()   
    }
    else {
        socket.disconnect()
        return new Error('Erro na conexão socket')
    }
})


app.io.on('connect', socket => {
    console.log('User logged', socket.name)
    socket.on('offer', _ => socket.broadcast.to(socket.room).emit('offer', _) )
    socket.on('answer', _ => socket.broadcast.to(socket.room).emit('answer', _) )
    socket.on('candidate', _ => socket.broadcast.to(socket.room).emit('candidate', _) )
    socket.on('close', () => socket.broadcast.to(socket.room).emit('close', socket.name))
    socket.on('disconnect', _ => socket.broadcast.to(socket.room).emit('close', socket.name) )
})

http.listen(8080, () => console.log(`Server: ${8080}`))
