const ws          = new WebSocket('wss://ea1ba41c.ngrok.io')
let connection    = null
let name          = null
let otherUsername = null
let localStream

ws.onopen    = () => console.log('Connected to the signaling server')
ws.onerror   = _ => console.error(_)

ws.onmessage = msg => {
    console.log('Chegou do socket => ', msg.data)
    const data = JSON.parse(msg.data)

    switch (data.type) 
    {
        case 'login':
            handleLogin(data.success)
        break

        case 'offer':
            handleOffer(data.offer, data.username)
        break

        case 'answer':
            handleAnswer(data.answer)
        break

        case 'candidate':
            handleCandidate(data.candidate)
        break

        case 'close':
            handleClose()
        break

        default:
            console.log("Evento desconhecido")
        break
    }
}



const sendMessage = message => {
    if (otherUsername) 
        message.otherUsername = otherUsername

    ws.send( JSON.stringify(message) )
}




document.querySelector('button#login').addEventListener('click', event => {
    username = document.querySelector('input#username').value

    if (username.length < 0) 
        return alert('Please enter a username 🙂')

    sendMessage({type: 'login', username})
})




const handleLogin = async success => {
    if (success === false) return alert('😞 Username already taken')

    document.querySelector('div#login').style.display = 'none'
    document.querySelector('div#call').style.display  = 'block'

    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    } 
    catch (error) 
    {
        console.error(error)
    }

    //mostrando a capitura local
    document.querySelector('video#local').srcObject = localStream
    
    createConn()
}



const createConn = () => {
    //cria instÂncia do Peer
    connection = new RTCPeerConnection({
        iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
    })

    //envia para outro peer
    connection.addStream(localStream)

    //recebe streaming remoto
    connection.onaddstream = event => {
        document.querySelector('video#remote').srcObject = event.stream
    }

    //envia comunicação de que acabou de conectar no peer
    connection.onicecandidate = event => {
        if (event.candidate) 
            sendMessage({type: 'candidate', candidate: event.candidate})
    }
}







document.querySelector('button#call').addEventListener('click', () => {
    otherUsername = document.querySelector('input#username-to-call').value

    if (otherUsername.length === 0)
        return alert('Enter a username 😉')

    //cria uma oferta ao outro candidato (ligando)
    connection.createOffer(
        offer => {
            sendMessage({type: 'offer', offer})
            connection.setLocalDescription(offer)
        }, error => {
            alert('Error when creating an offer')
            console.error(error)
        }
    )
})





//manipulando ofertas que chegam
const handleOffer = (offer, username) => {
    otherUsername = username
    connection.setRemoteDescription(new RTCSessionDescription(offer))

    //respondendo a uma oferta
    connection.createAnswer(
        answer => {
            connection.setLocalDescription(answer)
            sendMessage({type: 'answer', answer: answer})
        }, error => {
            alert('Error when creating an answer')
            console.error(error)
        }
    )
}


//recebe uma resposta e conecta o peer
const handleAnswer = answer => {
    connection.setRemoteDescription(new RTCSessionDescription(answer))
}


//adiciona novo candidato à conversa
const handleCandidate = candidate => {
    connection.addIceCandidate(new RTCIceCandidate(candidate))
}


//finaliza conversa
document.querySelector('button#close-call').addEventListener('click', () => {
    sendMessage({type: 'close'})
    handleClose()
})


//finaliza conexão
const handleClose = () => {
    otherUsername = null
    document.querySelector('video#remote').src = null
    connection.close()
    connection.onicecandidate = null
    connection.onaddstream    = null
    createConn()
}

const stopStream = () => localStream.getTracks().forEach(_ => _.stop())
