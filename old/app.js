const express = require('express')
const nunjucks = require('nunjucks')
const trimmer = require('express-trimmer')
const utils = require('./utils')
const uuidv4 = require('uuid/v4')
var helmet = require('helmet')
var path = require('path');
var enforce = require('express-sslify')
const fonts = require('express-fonts')
var cors = require('cors')

const app = express()

app.set('view engine', 'html')

if(process.env.NODE_ENV != 'development') {
    app.use(enforce.HTTPS({ trustProtoHeader: true }))
}

app.use(cors())
app.use(helmet())
app.use(express.urlencoded())
app.use(express.json())
app.use(trimmer)
app.use('/static', express.static(path.join(__dirname, 'static/')))
app.use('/fontawesome', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free')))

nunjucks.configure('views', {
    autoescape: true,
    express: app
}).addGlobal('WEBSITE_NAME', process.env.WEBSITE_NAME || 'eminymous').addGlobal(
    'VERSION', process.env.VERSION
).addGlobal('BOT_NAME', process.env.BOT_NAME || 'bot.emin')

app.get('*', (req, res, next) => {
    if (req.body.username == (process.env.BOT_NAME || 'bot.emin')) {
        res.redirect('/?notAllowed=1')
        res.end()
    }
    else {
        next()
    }
})

app.post('*', (req, res, next) => {
    if (req.body.username == (process.env.BOT_NAME || 'bot.emin')) {
        res.redirect('/?notAllowed=1')
        res.end()
    }
    else {
        next()
    }
})

app.get('/', (req, res) => {
    utils.getAllPublicChannels(function(keys){
        var channels = []
        if(keys){
            channels = channels.concat(keys)
        }
        res.render('index', {channels: channels})
    })
})

app.get('/public/:channel', (req, res) => {
    const escapedChannel = req.params.channel
    if (!escapedChannel) {
        res.redirect('/?noChannel=1')
        res.end()
        return
    }
    res.render('chat', {channel: decodeURI(escapedChannel)})
})

app.post('/public/:channel', (req, res) => {
    const escapedChannel = req.params.channel
    const username = req.body.username || uuidv4()

    if (!escapedChannel) {
        res.redirect('/?noChannel=1')
        res.end()
        return
    }
    const channel = decodeURI(escapedChannel)
    res.render('chat', {username: username, channel: channel, isPrivate: false, password: ''})
})

app.get('/private/:channel', (req, res) => {
    const escapedChannel = req.params.channel
    const password = req.query.password || ''
    const channel = decodeURI(escapedChannel)
    if (!escapedChannel) {
        res.redirect('/?noChannel=1')
        res.end()
        return
    }
    
    if(!password) {
        res.render('password', {channel: channel})
        return
    }

    utils.validateChannel({
        channel: channel,
        isPrivate: true,
        password: decodeURI(password),
        callback: function(data) {
            if(data.exists){
                if(data.passwordMatched){
                    utils.setRoom({channel: data.channel, isPrivate: data.isPrivate, password: data.password})
                    res.render('chat', {username: '', channel: data.channel, isPrivate: data.isPrivate, password: data.password, actionUrl:`/private/${data.escapedChannel}`})
                } else {
                    res.redirect(`/private/${data.escapedChannel}?notAllowed=1`)
                    res.end()
                }
            } else {
                utils.setRoom({channel: data.channel, isPrivate: data.isPrivate, password: data.password})
                res.render('chat', {username: '', channel: data.channel, isPrivate: data.isPrivate, password: data.password, actionUrl:`/private/${data.escapedChannel}`})
            }
        }
    })
})

app.post('/private/:channel', (req, res) => {
    const escapedChannel = req.params.channel
    const password = req.body.password || ''

    if (!escapedChannel) {
        res.redirect('/?noChannel=1')
        res.end()
        return
    }
    if (!password) {
        res.redirect('/?notAllowed=1')
        res.end()
        return
    }

    const channel = decodeURI(escapedChannel)
    const username = req.body.username || uuidv4()

    utils.validateChannel({
        channel: channel,
        isPrivate: true,
        password: password,
        callback: function(data) {
            if(data.exists){
                if(data.passwordMatched){
                    utils.setRoom({channel: channel, isPrivate: true, password: data.password})
                    res.render('chat', {username: username, channel: data.channel, isPrivate: true, password: data.password})
                } else {
                    res.redirect(`/private/${data.escapedChannel}?notAllowed=1`)
                    res.end()
                }
            } else {
                utils.setRoom({channel: channel, isPrivate: true, password: data.password})
                    res.render('chat', {username: username, channel: data.channel, isPrivate: true, password: data.password})
            }
        }
    })
})

app.post('/join', (req, res) => {
    const channel = req.body.channel
    if(channel){
        utils.validateChannel({
            channel: channel,
            isPrivate: false,
            callback: function(data) {
                utils.setRoom({channel: channel, isPrivate: false})
                res.redirect(`/public/${data.escapedChannel}`)
                res.end()
            }
        })
    } else {
        res.redirect('/?noChannel=1')
        res.end()
    }
})

app.post('/channel', (req, res) => {
    const channel = req.body.newChannel || uuidv4()
    const isPrivate = ((req.body.password)? true : false)

    utils.validateChannel({
        channel: channel, 
        isPrivate: isPrivate,
        password: req.body.password,
        callback: function(data) {
            if(data.isPrivate) {
                if(data.exists){
                    res.redirect(`/private/${data.escapedChannel}?notAllowed=1`)
                    res.end()
                }
                else {
                    utils.setRoom({channel: data.channel, isPrivate: true, password: data.password})
                    res.redirect(`/private/${data.escapedChannel}?password=${data.escapedPassword}`)
                }
            } else {
                utils.setRoom({channel: data.channel, isPrivate: false})
                res.redirect(`/public/${data.escapedChannel}`)
                res.end()
            }
            
        }
    })
})

server = app.listen(process.env.PORT || 3000)

const io = require("socket.io")(server)

function getOnlineUsers(channel) {
    var users = []
    var sockets = io.in(channel)
    Object.keys(sockets.sockets).forEach((item) => {
        var socketItem = sockets.sockets[item]
        if(socketItem.channel == channel) {
            users.push(socketItem.user)
        }
    })
    return users
}

function triggerHeartbeat(socket) {
    if (socket.channel && socket.user) {   
        const messageData = {
            user: socket.user,
            onlineUsers: getOnlineUsers(socket.channel),
            disconnect: false,
        }    
        socket.emit('heartbeat', messageData);
    } else {
        socket.emit('heartbeat', {user: socket.user, disconnect: true, onlineUsers: getOnlineUsers(socket.channel)})
    }
}

function goOnline(socket) {
    setStatus(socket, 'online')
}

function goOffline(socket) {
    setStatus(socket, 'offline', 'red')
}

function setStatus({socket, status, color, typingTimestamp, data, callback}) {
    if(socket && socket.user) {
        if(!status) {
            socket.user.status = 'online'
        }
        else {
            socket.user.status = status
        }
        
        if(color){
            setColor({socket: socket, color: color})
        }

        const timestamp = utils.getTimestamp()        

        if(typingTimestamp){
            socket.user.typingTimestamp = typingTimestamp
            const dif = timestamp - typingTimestamp
            if(dif < utils.getTypingDelay()) {
                socket.user.status = 'typing'
            }            
        }

        if(data && callback) { 
            utils.initializeSocketData(socket, data.username)
            utils.validateChannel({
                channel: data.channel,
                isPrivate: (data.isPrivate == "true"),
                password: data.password,
                callback: function(validationData) {
                    callback({socket: socket, status: socket.status, color: socket.color, validationData: validationData})
                }
            }) 
        }
    }
}

function setColor({socket, color}) {
    if(socket) {
        if(socket.user) {
            if(!socket.user.previousColor && !socket.user.color) {
                socket.user.previousColor
            }
            if(!socket.user.previousColor){
                socket.user.previousColor = color
            }
            if (socket.previousColor && socket.previousColor == data.color){
                return
            }
            socket.user.color = color
        }
    }
}

io.on('connection', (socket) => {
    socket.on('trigger', function(data){
        setStatus({socket: socket, color: data.color, typingTimestamp: data.typingTimestamp, data: data, callback: function(
            {socket, status, color, validationData}
        ){
            if(socket) {
                socket.isPrivate = data.isPrivate
                    if(validationData.canAccess) {
                        socket.channel = validationData.channel
                        socket.join(validationData.channel)
                        utils.setRoom({channel: validationData.channel, isPrivate: validationData.isPrivate, password: validationData.password})
                        
                    }
                    else {
                        socket.channel = null
                        socket.leave(validationData.channel)
                    }
                triggerHeartbeat(socket)
            }
        }})
    })

    socket.on('message', function(data) {
        const timestamp = utils.getTimestamp()
        utils.initializeSocketData(socket, data.username)

        utils.validateChannel({
            channel: data.channel,
            isPrivate: (data.isPrivate == "true"),
            password: data.password,
            callback: function(validationData) {
                socket.password = validationData.password
                socket.isPrivate = validationData.isPrivate
                if(validationData.canAccess) {
                    const messageData = {
                        user: socket.user,
                        message: data.message,
                        timestamp: timestamp,
                    }
                    socket.channel = validationData.channel
                    utils.setRoom({channel: validationData.channel, isPrivate: validationData.isPrivate, password: validationData.password})
                    socket.join(validationData.channel)
                    socket.broadcast.to(socket.channel).emit('message', messageData)
                    socket.emit("message", messageData)
                }
                else {
                    const messageData = {
                        user: socket.botUser,
                        message: "you don't have permission to send a message to this channel",
                        timestamp: timestamp,
                        onlineUser: [],
                    }
                    socket.leave(validationData.channel)
                    socket.emit("message", messageData)
                }
            }
        }) 
    })

    socket.on('join', function (data) {
        utils.initializeSocketData(socket, data.username)
        const timestamp = utils.getTimestamp()

        utils.validateChannel({
            channel: data.channel,
            isPrivate: (data.isPrivate == "true"),
            password: data.password,
            callback: function(validationData) {
                socket.isPrivate = validationData.isPrivate
                if(validationData.canAccess) {
                    socket.isJoined = true
                    var messageData = {
                        user: socket.botUser,
                        message: `${socket.user.name} joined`,
                        timestamp: timestamp,
                        action: 'add',
                        target: socket.user,
                    }
                    socket.channel = validationData.channel
                    utils.setRoom({channel: validationData.channel, isPrivate: validationData.isPrivate, password: validationData.password})                   
                    socket.join(validationData.channel)
                    socket.broadcast.to(validationData.channel).emit('message', messageData)
                    messageData.message = "you joined this channel"
                    socket.emit("message", messageData)
                }
                else {
                    var messageData = {
                        user: socket.botUser,
                        message: "you don't have permission to view this channel",
                        timestamp: timestamp,
                        onlineUser: [],
                    }
                    socket.leave(validationData.channel)
                    socket.emit("message", messageData)
                }
            }
        })
    })

    socket.on('usernameColor', function(data) {
        const timestamp = utils.getTimestamp()
        utils.initializeSocketData(socket, data.username)
        utils.validateChannel({
            channel: data.channel,
            isPrivate: (data.isPrivate == "true"),
            password: data.password,
            callback: function(validationData) {
                socket.isPrivate = validationData.isPrivate
                if(validationData.canAccess) {
                    socket.channel = validationData.channel
                    socket.join(validationData.channel)
                    utils.setRoom({channel: validationData.channel, isPrivate: validationData.isPrivate, password: validationData.password})
                    setStatus({socket: socket, color: 'fff', data: data})
                }
                else {
                    setStatus({socket: socket, color: 'fff', data: data})
                    socket.channel = null
                    socket.leave(validationData.channel)
                }
            }
        })
    })

    socket.on('disconnect', function(){
        if (socket.channel) {
            socket.leave(socket.channel)
        }
        if (socket.user) {
            goOffline(socket)
            const timestamp = utils.getTimestamp()
            const messageData = {
                user: socket.botUser,
                timestamp: timestamp,
                message: `${socket.user.name} left`,
                target: socket.user
            }
            socket.broadcast.to(socket.channel).emit('message', messageData)
        }
    })
})
