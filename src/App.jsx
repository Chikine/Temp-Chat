import React from "react";
import { ChatBox } from "./components/ChatBox";

export function App() {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <ChatBox></ChatBox>
        </div>
    )
}