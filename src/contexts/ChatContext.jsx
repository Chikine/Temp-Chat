import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../libs/firebase";
import { collection, query, orderBy, onSnapshot, setDoc, doc, addDoc, serverTimestamp, getDoc, limit } from "firebase/firestore";

export class ChatContextValue {
    /**
     * current chat ID
     * @type {number}
     */
    chatId

    /**
     * messages in chats
     * @type {{id: string, createdAt: timestamp, sender: string, text: string}[]}
     */
    messages

    /**
     * get chat from chat id
     * @type {(id: string) => Promise<void>}
     */
    getChat

    /**
     * get new chat
     * @type {() => Promise<void>}
     */
    newChat

    /**
     * commit a new message 
     * @type {(message: string) => Promise<void>}
     */
    commitMessage

    /**
     * list of chat id
     * @type {string[]}
     */
    chatIdList

    /**
     * remove a chat from list
     * @type {(id: string) => void}
     */
    rmFromChatIdList

    /**
     * get chat info 
     * @type {(id?: string) => Promise<Object.<string, any>>}
     */
    getChatInfo

    /**
     * set chat info using an object
     * @example
     * //set chat create time with current chat id (no pass id)
     * await setChatInfo({
     *      createdAt : serverTimestamp()
     * })
     * @type {(source?: Object.<string, any>, id?: string) => Promise<void>}
     */
    setChatInfo

    /**
     * handle invite with id and password, return is success or not
     * @type {(id: string, password: string) => Promise<boolean}
     */
    handleInvitation
}

/**@type {React.Context<ChatContextValue>}*/
const ChatContext = createContext(null)

/**
 * chat context provider
 * @param {{children: ReactNode}}
 * @returns {JSX.Element}
 */
export function ChatProvider({children}) {
    const [chatId, setChatId] = useState('')

    const [messages, setMessages] = useState([])

    const [chatIdList, setChatIdList] = useState([])
    const _chatIdListLocalStorageKey = "chat-list"
    const _chatIdListLimit = 5

    //get chat list from local storage ? B)
    useEffect(() => {
        const list = localStorage.getItem(_chatIdListLocalStorageKey) || null
        if(list) {
            try {
                const arr = JSON.parse(list)
                console.log(arr)
                arr.length && setChatIdList(arr)
            } catch(e) {}
        }
    },[])

    //save chat list
    useEffect(() => {
        localStorage.setItem(_chatIdListLocalStorageKey, JSON.stringify(chatIdList))
    }, [chatIdList])

    function rmFromChatIdList(id) {
        const arr = chatIdList.filter(chatId => chatId !== id)

        if(chatId === id) {
            if(arr.length) {
                setChatId(arr[0])
            }
            else {
                setChatId('')
            }
        }

        setChatIdList(arr)
    }

    //on change chat id get messages
    useEffect(() => {
        if(chatId) {
            const q = query(
                collection(db, 'chats', chatId, 'messages'), //messages collection point from chats => id => messages
                orderBy('createdAt', 'desc'), //descending base on time created message
                limit(50) //limited the messages that is loaded first
            )

            const unSubscribe = onSnapshot(q, (snapshot) => {
                //on change chat id set messages
                const msgs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))

                //desc => asc
                setMessages(msgs.reverse())
            })


            //change location on changing chat id
            {
                const params = new URLSearchParams(window.location.search)
                params.set('chatID', chatId)

                const newUrl = `${window.location.pathname}?${params.toString()}`
                window.history.replaceState({}, "", newUrl)
            }

            console.log(chatId)

            //add to list
            if(chatIdList.includes(chatId)) {
                //go to first position of list
                // setChatIdList(list => [chatId, ...list.filter(id => id !== chatId)])
            }
            else {
                setChatIdList(list => {
                    if(list.length >= _chatIdListLimit) {
                        return [...list.slice(0, 4), chatId]
                    }
                    return [...list, chatId]
                })
            }

            return () => unSubscribe()
        }
    }, [chatId])

    function getChat(id) {
        if(id === chatId) return

        setChatId(id)
        setMessages([])
    }

    /**
     * add new chat to chats collection
     * @example
     * //new chat structure:
     * `
     * chat ID (document)
     * |---(collections)---
     * |_ messages
     * |  |_ message id (document)
     * |    |_ text: string
     * |    |_ sender: string
     * |    |_ createdAt: timestamp
     * |
     * |_ settings
     * | |_ access (document)
     * |   |_ password: string
     * |   |_ visibility: 'public' | 'private'
     * |---(fields)---
     * |_ createdAt: timestamp
     */
    async function newChat() {
        const id = crypto.randomUUID()
        //set fields for chat doc
        await setChatInfo({
            createdAt : serverTimestamp()
        }, id)

        //set settings accessibility
        await setDoc(doc(db, 'chats', chatId, 'settings', 'access'), {
            visibility: 'public',
            password: ''
        })

        //focus on new chat
        getChat(id)
    }

    async function setChatInfo(source = {}, id = chatId) {
        try {
            await setDoc(doc(db, 'chats', id), source, {merge: true})
        } catch (e) {
            console.log('failed set chat info')
        }
    }

    async function getChatInfo(id = chatId) {
        if(chatId) {
            const snap = await getDoc(doc(db, 'chats', id))
            return snap.exists() ? snap.data() : {}
        }
        else return {}
    }

    /**
     * commit message to db
     * @param {string} message - user message
     */
    async function commitMessage(message) {
        if (!chatId) return

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            text: message,
            sender: 'anonymous', // Change later to actual user
            createdAt: serverTimestamp()
        })
    }
    
    async function handleInvitation(id, password) {
        //try get chat
        const snap = await getDoc(doc(db, 'chats', id))

        if(snap.exists()) {
            //get setting access
            const setting = await getDoc(doc(db, 'chats', id, 'settings', 'access'))
            if(setting.exists()) {
                const access = setting.data()
                if(access.visibility === 'public' || access.password === password) {
                    console.log('exact info, user can access')
                    return true
                }
                else {
                    alert('no rights to access (wrong password)')
                    return false
                }
            }
            else {
                console.error('no access doc found (chat is deprecated), try create one')
                await setDoc(doc(db, 'chats', id, 'settings', 'access'), {
                    visibility: 'public',
                    password: ''
                })
                return true
            }
        }
        else {
            alert('no chat found')
            return false
        }
    }

    return (
        <ChatContext.Provider
            value={{
                newChat,
                getChat,
                commitMessage,
                chatId,
                messages,
                chatIdList,
                rmFromChatIdList,
                getChatInfo,
                setChatInfo,
                handleInvitation
            }}
        >
            {children}
        </ChatContext.Provider>
    )
}

/**
 * use {@link ChatContextValue}
 * @returns {ChatContextValue}
 */
export function useChat() {
    const ctx = useContext(ChatContext)
    return ctx
}