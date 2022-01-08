const redis = require("redis")
const client = redis.createClient(process.env.REDIS_URL || process.env.REDISTOGO_URL || "redis://localhost:6379/")
const bcrypt = require('bcryptjs')
const uuidv4 = require('uuid/v4')

const websiteName = process.env.WEBSITE_NAME || "eminymous"

function getPasswordHash(password) {
    if(password){
        return bcrypt.hashSync(password, process.env.SALT)
    }
    else {
        return 'dummy'
    }
}

function getChannelRedisName(channel, isPrivate){
    const prefix = ((isPrivate) ? 'private' : 'public')
    const name = `${prefix}-${channel}`
    return name
}

function setAndExpire(name, password) {
    client.set(name, password)
    client.expire(name, process.env.CHANNEL_EXPIRE_IN_SECONDS || 60*60)
}

function setRoom({channel, isPrivate, password=''}) {
    const name = getChannelRedisName(channel, isPrivate)
    setAndExpire(name, getPasswordHash(password))
}

function validateChannel({channel, isPrivate, password='', callback}) {
    const name = getChannelRedisName(channel, isPrivate)
    canCreateOrJoinChannel({
        name: name, 
        channel: channel,
        isPrivate: isPrivate, 
        password: password, 
        callback: function(data){
            callback(data)
        }
    })
}

function canCreateOrJoinChannel({name, channel, isPrivate, password='', callback}) {
    if(!isPrivate) {
        password = ''
    }

    if(password) {
        isPrivate = true
    }

    client.get(name, function(err, reply) {
        var exists = false
        var passwordMatched = true
        if(reply) {
            exists = true
            if(password && isPrivate) {
                passwordMatched = bcrypt.compareSync(password, reply)
            }
            if(!password && isPrivate) {
                passwordMatched = false
            }
        }

        const data = {
            isPrivate: isPrivate,
            exists: exists,
            passwordMatched: passwordMatched, 
            value: reply,
            error: err,
            channel: channel,
            name: name,
            password: password,
            escapedChannel: encodeURI(channel),
            escapedPassword: encodeURI(password),
            canCreate: !exists || !isPrivate,
            canAccess: (exists && isPrivate && passwordMatched) || !isPrivate,
        }
        callback(data)
    })     
}

function getAllPublicChannels(callback) {
    client.keys('public-*', function(err, keys){
        keys = keys.map(function(item) { 
            return item.replace('public-', '')
        })
        callback(keys)
    })
}

function initializeSocketData(socket, username) {
    if(!socket.botID) {
        socket.botID = uuidv4()
    }
    socket.isPrivate = true
    if(!socket.user){
        socket.user = {id: uuidv4(), name: username, color: "black"}
    }
    if(!socket.botUser) {
        socket.botUser = {id: socket.botID, name: 'bot.emin', color: "red"}
    }
    if(!socket.password) {
        socket.password = ''
    }
}

function getTypingDelay(){
    return process.env.TYPING_DELAY || 1000
}

function getTimestamp(){
    return Math.floor(new Date())
}

module.exports={
    setRoom:setRoom,
    getAllPublicChannels:getAllPublicChannels,
    validateChannel:validateChannel,
    getPasswordHash:getPasswordHash,
    initializeSocketData:initializeSocketData,
    getTypingDelay: getTypingDelay,
    getTimestamp: getTimestamp,
}