import React from 'react';

function MessageInput({ input, setInput, handleSend }) {
  return (
    <div className="input-container">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="input" 
      />
      <button onClick={handleSend} className="button">
        Send
      </button>
    </div>
  );
}

export default MessageInput;

