import React from 'react';
import './App.css'; // CSS ファイルをインポート
import ChatContainer from './ChatContainer';
import MessageInput from './MessageInput';
import { useChat } from './useChat';

function App() {
  const { messages, input, setInput, handleSend } = useChat();

  return (
    <div className="container">
      <h1>ChatBot</h1>
      <ChatContainer messages={messages} />
      <MessageInput input={input} setInput={setInput} handleSend={handleSend} />
    </div>
  );
}

export default App;

