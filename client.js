let connection  = null
let name        = null
const username  = "user-"+ new Date().getTime().toString().substr(9, 3)
const socket    = io('https://71d26c2e.ngrok.io', { query: { sala: "sala-1", name: username } })
let localStream

socket.on('offer', offer => handleOffer(offer) )
socket.on('answer', answer => handleAnswer(answer) )
socket.on('candidate', candidate => handleCandidate(candidate) )
socket.on('close', data => handleClose() )

const handleAnswer    = answer => connection.setRemoteDescription(new RTCSessionDescription(answer))
const handleCandidate = candidate => connection.addIceCandidate(new RTCIceCandidate(candidate))
const handleOffer     = offer => {
    connection.setRemoteDescription(new RTCSessionDescription(offer))

    connection.createAnswer(
        answer => {
            connection.setLocalDescription(answer)
            socket.emit('answer', answer)
        }, error => {
            alert('Error when creating an answer')
            console.error(error)
        }
    )
}


const init = async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        document.querySelector('video#local').srcObject = localStream
        createConn()
        document.querySelector('div#call').style.display = 'block'
    } 
    catch (error) 
    {
        console.error(error)
    }
}
init()


const createConn = () => {
    connection = new RTCPeerConnection({
        iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
    })

    connection.addStream(localStream)

    connection.onaddstream = event => {
        document.querySelector('video#remote').srcObject = event.stream
    }

    connection.onicecandidate = event => {
        if (event.candidate) 
            socket.emit('candidate', event.candidate)
    }
}

document.querySelector('button#call').addEventListener('click', () => {
    connection.createOffer(
        offer => {
            socket.emit('offer', offer)
            connection.setLocalDescription(offer)
        }, error => {
            alert('Error when creating an offer')
            console.error(error)
        }
    )
})

document.querySelector('button#close-call').addEventListener('click', () => {
    socket.emit('close', null)
    handleClose()
})

const handleClose = () => {
    otherUsername = null
    document.querySelector('video#remote').src = null
    connection.close()
    connection.onicecandidate = null
    connection.onaddstream    = null
    createConn()
    console.log("acabou a chamada")
}

const stopStream = () => localStream.getTracks().forEach(_ => _.stop())
