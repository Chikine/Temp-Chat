import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './src/App'
import { ChatProvider } from './src/contexts/ChatContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ChatProvider>
            <App/>    
        </ChatProvider>
    </React.StrictMode>
)