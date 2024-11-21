import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);  // 追加: chat-container の参照を保持

  // メッセージ送信の処理
  const handleSend = async () => {
    if (!input) return;

    // フロントエンドにユーザーメッセージを追加
    const userMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // バックエンドにリクエストを送信
      const response = await axios.post('http://localhost:5000/api/message', {
        message: input,
      });

      console.log('Server Response:', response.data);
      // サーバーからの応答をメッセージに追加
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // メッセージが更新されるたびにスクロールを最下部にする
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]); // messagesが変更されるたびに実行

  return (
    <div style={styles.container}>
      <h1>ChatBot</h1>
      <div style={styles.chatContainer} ref={chatContainerRef}> {/* refを設定 */}
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#DCF8C6' : '#ECECEC',
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

// スタイル
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
    height: '100vh',
    justifyContent: 'center',
  },
  chatContainer: {
    width: '80%',
    maxHeight: '60vh',
    overflowY: 'auto',
    border: '1px solid #ddd',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
  },
  message: {
    margin: '5px 0',
    padding: '10px',
    borderRadius: '5px',
    maxWidth: '80%',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '80%',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginRight: '10px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
};

export default App;

