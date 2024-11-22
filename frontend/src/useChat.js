import { useState } from 'react';
import axios from 'axios';

export function useChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!input) return;

    // ユーザーメッセージを追加
    const userMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // バックエンドにリクエストを送信
      const response = await axios.post('https//api.pinzero.net/api/message', {
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

  return { messages, input, setInput, handleSend };
}

