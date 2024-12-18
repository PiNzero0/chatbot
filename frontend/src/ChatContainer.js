import React, { useRef, useEffect } from 'react';

function ChatContainer({ messages }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container" ref={chatContainerRef}> {/* classNameを使用 */}
      {messages.map((msg, index) => (
        <div
          key={index}
          className="message" // classNameを使用
          style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.sender === 'user' ? '#DCF8C6' : '#ECECEC',
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}

export default ChatContainer;

