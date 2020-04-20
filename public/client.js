let connection  = null
let name        = null
const username  = "user-"+ new Date().getTime().toString().substr(9, 3) + new Date().getTime().toString().substr(11, 3)
const socket    = io('/', { query: { sala: "sala1", name: username } })
let localStream
let active = false

socket.on('offer', offer => active ? handleOffer(offer) : null )
socket.on('answer', answer => active ? handleAnswer(answer): null  )
socket.on('candidate', candidate => active ? handleCandidate(candidate) : null )
socket.on('close', _ => active ? handleClose(): null  )

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

document.querySelector('#btn-call').addEventListener('click', () => {
    document.querySelector('#btn-call').style.display = 'none'
    document.querySelector('#close-call').style.display = 'block'
    createConn()
    connection.createOffer(
        offer => {
            socket.emit('offer', offer)
            connection.setLocalDescription(offer)
            active = true
        }, error => {
            alert('Error when creating an offer')
            console.error(error)
        }
    )
})

document.querySelector('button#close-call').addEventListener('click', () => {
    document.querySelector('#btn-call').style.display = 'block'
    document.querySelector('#close-call').style.display = 'none'

    socket.emit('close', null)
    handleClose()
})

const handleClose = () => {
    document.querySelector('video#remote').src = null
    connection.close()
    connection.onicecandidate = null
    connection.onaddstream    = null
    createConn()
    console.log("acabou a chamada")
    document.querySelector('#btn-call').style.display = 'block'
    document.querySelector('#close-call').style.display = 'none'
}

const stopStream = () => localStream.getTracks().forEach(_ => _.stop())
