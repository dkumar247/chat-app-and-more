const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
        // createdAt: new Date().toTimeString()
    }
}

const generateLocationMessage = (username, locationUrl) => {
    return {
        username,
        locationUrl,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}