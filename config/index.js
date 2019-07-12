export default {
    api: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'http://172.96.228.26:8000/',
    socket: 'https://socket.zzsun.cc'
}

console.log(process.env.NODE_ENV)
