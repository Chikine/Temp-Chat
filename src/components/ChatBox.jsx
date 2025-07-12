import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../contexts/ChatContext";

const IMAGE_DIRECTORY = '../../assets/image/'

export function ChatBox() {
    const { messages, newChat, getChat, chatId, commitMessage, chatIdList, rmFromChatIdList, getChatInfo, setChatInfo, handleInvitation } = useChat()

    const [inputValue, setInputvalue] = useState('')

    const [backgroundSrc, setBackgroundSrc] = useState(IMAGE_DIRECTORY + 'chatBackground.webp')

    const [chatAvatarSrcs, setChatAvatarSrcs] = useState({})

    /**@type {['chat' | 'info', React.Dispatch<React.SetStateAction<'chat' | 'info'>>]} */
    const [chatScreen, setChatScreen] = useState('chat')

    const [displayChatBox, setDisplayChatBox] = useState(false)

    const [displayNewChat, setDisplayNewChat] = useState(false)

    const [inviteInfo, setInviteInfo] = useState({
        id: '',
        password: ''
    })

    const [invitePasswordVisible, setInvitePasswordVisible] = useState(false)

    const [chatName, setChatName] = useState('')

    const [inputChatName, setInputChatName] = useState('')

    /**
     * chat box ref
     * @type {React.Ref<HTMLDivElement>}
     */
    const chatDisplayRef = useRef()

    useEffect(() => {
        //get chat id on url param
        {
            const url = new URL(window.location.href)

            //get chat id from url form /?chatID={chat_id}
            const _chat_id = url.search?.slice(1).split('=')[1]

            if(_chat_id) {
                getChat(_chat_id)
                setDisplayChatBox(true)
            }
        }
    }, [])

    useEffect(() => {
        /**
         * @param {KeyboardEvent} e 
         */
        function onKeyDown(e) {
            if(e.key === 'Enter') {
                e.preventDefault()
                if(e.shiftKey) {
                    setInputvalue(t => t + '\n')
                }
                else {
                    if(inputValue.trim()) {
                        commitMessage(inputValue)
                        setInputvalue('')  
                    }
                } 
            }
        }

        document.addEventListener('keydown', onKeyDown)

        return () => document.removeEventListener('keydown', onKeyDown)
    }, [inputValue])

    useEffect(() => {
        if(chatId) {
            //reset input
            setInputvalue('')
            setDisplayChatBox(true)

            //get chat name
            ;(async() => {
                const { chatName } = await getChatInfo(chatId)
                if(chatName) {
                    setChatName(chatName)
                }
            })();
        }
    }, [chatId]) 

    useEffect(() => {
        //handle empty list
        if(!chatIdList.length) {
            setDisplayChatBox(false)
        }

        //try get chat avatars
        chatIdList?.map(id => {
            (async () => {
                const { chatAvatarSrc } = await getChatInfo(id) 
                setChatAvatarSrcs(obj => {
                    obj[chatId] = chatAvatarSrc || ''
                    return obj
                })
            })()
        })
    }, [chatIdList])

    useEffect(() => {
        if(chatDisplayRef.current) {
            chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight
        }
    }, [messages])

    async function createNewChat() {
        await newChat()
    }

    function switchScreen() {
        setChatScreen(scr => scr === 'chat' ? 'info' : 'chat')
    }

    /**
     * resize and crop an image in File type to width and height
     * @param {File} file 
     * @param {Number} width 
     * @param {Number} height 
     * @returns {Promise<string>}
     */
    function resizeAndCropImage(file, width = 50, height = 50) {

        return new Promise((resolve, reject) => {
            //file reader
            const reader = new FileReader()

            //load event listener
            reader.onload = (e) => {
                const img = new Image()
                
                img.onload = () => {
                    const imgWidth = img.width
                    const imgHeight = img.height

                    //try get target ratio
                    const ratio = Math.min(imgWidth / width, imgHeight / height)

                    //get start point
                    const sx = (imgWidth - width * ratio) / 2
                    const sy = (imgHeight - height * ratio) / 2

                    //try resize using canvas => return base64 img
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    canvas.width = width
                    canvas.height = height
                    ctx.drawImage(img, sx, sy, width, height)

                    const base64img = canvas.toDataURL('image/png', 0.8)
                    resolve(base64img)
                }

                img.onerror = reject
                img.src = e.target.result
            }

            reader.onerror = reject

            reader.readAsDataURL(file)
        })
    }

    /**
     * try get and set chat avatar on change chat avatar input 
     * @param {React.ChangeEvent<HTMLInputElement>} e 
     */
    async function tryGetSetChatAvatar(e) {
        const img = e.target.files[0]
        resizeAndCropImage(img, 50, 50).then(async (base64img) => {
            await setChatInfo({
                chatAvatarSrc: base64img
            }, chatId)
            
            setChatAvatarSrcs(base64img)
        }).catch(e => {
            alert('unexpected error')
            console.error(e)
        })
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 50,
                right: 50,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'end'
            }}
        >
            {/*chat box*/}
            {!displayNewChat && displayChatBox && <div 
                style={{
                    display: 'flex',
                    position: 'relative',
                    flexDirection: 'column',
                    width: 350,
                    height: 450,
                    backgroundColor: 'rgb(255, 0, 0)',
                    overflow: 'hidden',
                    fontFamily: 'monospace',
                    fontSize: 15,
                    color: 'wheat',
                    borderRadius: 10,
                    border: '1px solid black'
                }}
            >
                {/*chat background*/}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <img 
                        src={backgroundSrc} 
                        style={{
                            width: '100%',
                            height: 'auto'
                        }}
                    />
                </div>
                {/**chat header */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '10%',
                        display: 'flex',
                        backgroundColor: 'peachpuff',
                        color: 'black',
                        flexDirection: 'row'
                    }}
                >
                    {/* chat avatar */}
                    <div
                        style={{
                            position: 'relative',
                            height: '100%',
                            aspectRatio: 1
                        }}
                    >
                        <img
                            src={chatAvatarSrcs?.[chatId] || IMAGE_DIRECTORY + 'question-mark.png'} 
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '80%',
                                height: 'auto',
                                padding: '10%'
                            }}
                        ></img>
                    </div>
                    {/* chat name && id */}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            width: 400,
                            height: '100%',
                            overflow: 'hidden',
                            marginLeft: 5
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >{chatName || 'Chat Name Here'}</div>
                        <div
                            style={{
                                position: 'relative',
                                whiteSpace: 'pre-wrap',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.7,
                                fontSize: 10
                            }}
                        > id: {chatId} </div>
                    </div>
                    {/*other contents */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row-reverse'
                        }}
                    >
                        {/* "close" button */}
                        <button
                            onClick={() => setDisplayChatBox(false)}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: 20,
                                whiteSpace: 'preserve-spaces',
                                color: 'red'
                            }}
                        >X</button>
                        {/* "more" button */}
                        <button
                            onClick={switchScreen}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: 25,
                                whiteSpace: 'preserve-spaces',
                                color: chatScreen === 'chat' ? 'black' : 'red'
                            }}
                        >⋮</button>
                    </div>
                </div>
                {/*chat display*/}
                <div ref={chatDisplayRef}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                    className="chat-displayer"
                >
                    {chatScreen === 'chat' && messages && messages.map(m => (
                            <span 
                                key={m.id} 
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 10
                                }}
                            >
                                <div
                                    style={{
                                        whiteSpace: 'nowrap',
                                        // backgroundColor: 'rgba(83, 83, 83, 0.83)',
                                        width: 'auto',
                                        borderRadius: 5,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                        alignSelf: 'flex-start',
                                        display: 'inline-block',
                                        marginBottom: 5
                                    }}
                                > <b><em>{m.sender || 'anonymous participant'}</em></b> </div>
                                <div
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        backgroundColor: 'rgba(83, 83, 83, 0.83)',
                                        width: 'auto',
                                        borderRadius: 5,
                                        alignSelf: 'flex-start',
                                        display: 'inline-block',
                                        padding: 2,
                                        wordBreak: 'break-word'
                                    }}
                                >{m.text.trim()}</div>
                            </span>
                        )
                    )}

                    {chatScreen === 'info' && (
                        <div>
                            {/*change avatar */}
                            <div
                                style={{
                                    height: 50,
                                    width: '100%',
                                    padding: 5
                                }}
                            >change avatar</div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={tryGetSetChatAvatar}
                            ></input>
                            {chatAvatarSrcs?.[chatId] && (
                                <div
                                    style={{
                                        width: 100,
                                        height: 100,
                                        margin: 10,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <div>Preview:</div>
                                    <img 
                                        src={chatAvatarSrcs?.[chatId]} alt="Preview" 
                                        style={{ 
                                            width: 80,
                                            height: 'auto'
                                        }} 
                                    />
                                </div>
                            )}
                            {/*change chat name */}
                            <div
                                style={{
                                    height: 50,
                                    width: '100%',
                                    padding: 5
                                }}
                            >change chat name</div>
                            <div
                                style={{
                                    height: 21.5,
                                    width: '80%',
                                    margin: 5,
                                    display: 'flex',
                                    flexDirection: 'row'
                                }}
                            >
                                <input
                                    type='text'
                                    placeholder="enter chat name"
                                    style={{
                                        width: '100%'
                                    }}
                                    value={inputChatName}
                                    onChange={(e) => setInputChatName(e.target.value)}
                                ></input>
                                <button
                                    onClick={() => {
                                        setChatInfo({
                                            chatName: inputChatName
                                        }, chatId)
                                        setChatName(inputChatName)
                                    }}
                                    style={{
                                        height: '100%',
                                        aspectRatio: 1
                                    }}
                                >ok</button>
                            </div>
                        </div>
                    )}
                </div>
                {/*chat text area*/}
                {chatScreen === 'chat' && <div
                    style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'row',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '15%'
                    }}
                >
                    <textarea
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: 'auto',
                            margin: 5,
                            overflowY: 'auto',
                            resize: 'none'
                        }}
                        placeholder="type message"
                        value={inputValue}
                        onChange={(e) => setInputvalue(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            if(inputValue.trim()) {
                                commitMessage(inputValue)
                                setInputvalue('')  
                            }
                        }}
                        style={{
                            position: 'relative',
                            width: 30,
                            height: 'auto',
                            margin: 5,
                            backgroundColor: 'transparent',
                            border: 'none'
                        }}
                    >
                        <img 
                            src={IMAGE_DIRECTORY + "righthead-arrow.png"}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%'
                            }}
                        ></img>
                    </button>
                </div>}
            </div>}
            {/*new chat box*/}
            {displayNewChat && <div 
                style={{
                    display: 'flex',
                    position: 'relative',
                    flexDirection: 'column',
                    width: 350,
                    height: 450,
                    backgroundColor: 'rgb(255, 0, 0)',
                    overflow: 'hidden',
                    fontFamily: 'monospace',
                    fontSize: 15,
                    color: 'white',
                    borderRadius: 10,
                    border: '1px solid black',
                    gap: 5
                }}
            >
                {/* header */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '15%',
                        fontWeight: 'bold',
                        whiteSpace: 'pre-wrap',
                        fontSize: 30,
                        textAlign: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        color: 'blueviolet',
                        margin: 10
                    }}
                > (+) New Chat </div>
                {/* create new chat */}
                <button
                    onClick={() => (createNewChat(), setDisplayNewChat(false))}
                    style={{
                        display: 'inline-block',
                        whiteSpace: 'pre-wrap',
                        height: 25,
                        width: 'auto',
                        alignSelf: 'flex-start',
                        backgroundColor: 'rgb(31, 200, 45)',
                        margin: 10
                    }}
                >
                    (+) Create New Chat
                </button>
                <p style={{margin: 10}}> Or </p>
                {/*enter chat id + password*/}
                <div
                    style={{
                        margin: 10,
                        width: '70%',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                    }}
                >
                    <input
                        placeholder="enter chat ID"
                        value={inviteInfo['id']}
                        onChange={(e) => setInviteInfo(obj => ({...obj, id: e.target.value}))}
                    ></input>
                    <div
                        style={{
                            width: '100%',
                            height: 21.5,
                            display: 'flex',
                            flexDirection: 'row'
                        }}
                    > 
                        <input
                            type={invitePasswordVisible ? 'text' : 'password'}
                            placeholder="enter chat password (if private)"
                            value={inviteInfo['password']}
                            onChange={(e) => setInviteInfo(obj => ({...obj, password: e.target.value}))}
                            style={{
                                width: '100%'
                            }}
                        ></input>
                        <button
                            style={{
                                height: '100%',
                                aspectRatio: 1,
                                border: 'none',
                                backgroundColor: 'transparent'
                            }}
                            onClick={() => setInvitePasswordVisible(b => !b)}
                        >
                            <img 
                                src={IMAGE_DIRECTORY + `${invitePasswordVisible ? 'open-eye.png' : 'close-eye.png'}`}
                                style={{
                                    height: '100%',
                                    width: 'auto'
                                }}
                            ></img>
                        </button>
                    </div>

                    <button
                        onClick={async() => handleInvitation(inviteInfo['id'], inviteInfo['password']).then(res => {
                            if(res) {
                                setDisplayNewChat(false)
                                setDisplayChatBox(true)
                                getChat(inviteInfo['id'])
                            }
                        })}
                    > #Enter </button>
                </div>
            </div>}
            {/*chat feature */}
            <div
                style={{
                    position: 'relative',
                    width: 70,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                }}
            >
                {/*new chat button */}
                <button 
                    onClick={() => setDisplayNewChat(b => !b)}
                    style={{
                        position: 'relative',
                        backgroundColor: 'aqua',
                        border: '3px dot black',
                        borderRadius: 5,
                        width: 50,
                        aspectRatio: 1,
                        whiteSpace: 'preserve-spaces',
                        margin: 10
                    }}
                > (+) New Chat </button>
                {/*chat bubble(s) */}
                {chatIdList?.map(id => (
                    <div
                        key={id + '-bubble'}
                        style={{
                            position: 'relative',
                            width: 50,
                            aspectRatio: 1,
                            margin: 5
                        }}
                    >
                        {/*bubble */}
                        <button
                            onClick={() => (getChat(id), setDisplayChatBox(true), setDisplayNewChat(false))}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                border: '2px solid',
                                borderColor: chatId && chatId === id ? 'green' : 'gray',
                                overflow: 'hidden'
                            }}
                        >
                            {/**bubble img */}
                            <img 
                                src={chatAvatarSrcs?.[id] || IMAGE_DIRECTORY + 'question-mark.png'} 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 50,
                                    height: 'auto'
                                }}
                            ></img>
                        </button>
                        {/**close bubble */}
                        <button
                            onClick={() => rmFromChatIdList(id)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 15,
                                height: 15,
                                maxWidth: 15,
                                maxHeight: 15,
                                borderRadius: 5,
                                backgroundColor: 'red',
                                color: 'yellow',
                                fontSize: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >X</button>
                    </div>
                ))}
            </div>
        </div>
    )
}