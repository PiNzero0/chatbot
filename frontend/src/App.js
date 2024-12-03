import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCcw } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const currentResponseRef = useRef('');
  const abortControllerRef = useRef(null);

  const fetchStreamingResponse = async () => {
    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
        signal
      });

      // ストリーミングレスポンスの処理
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      currentResponseRef.current = '';

      while (true) {
        const { done, value } = await reader?.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
          try {
            const parsedData = JSON.parse(line);
            
            if (parsedData.type === 'status') {
              // ステータス更新
              setProgress(parsedData.content);
            } else if (parsedData.type === 'response') {
              // 部分的なレスポンス
              currentResponseRef.current = parsedData.content;
              
              // メッセージステートを更新
              setMessages(prev => {
                const lastMessageIndex = prev.length - 1;
                const updatedMessages = [...prev];
                
                if (lastMessageIndex >= 0 && prev[lastMessageIndex].role === 'ai') {
                  // 既存のAIメッセージを更新
                  updatedMessages[lastMessageIndex] = {
                    role: 'ai',
                    content: currentResponseRef.current
                  };
                } else {
                  // 新しいAIメッセージを追加
                  updatedMessages.push({
                    role: 'ai',
                    content: currentResponseRef.current
                  });
                }
                
                return updatedMessages;
              });
            }
          } catch (parseError) {
            console.error('JSONパースエラー:', parseError);
          }
        });
      }

      // ローディング終了
      setIsLoading(false);
      setProgress('');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('エラーが発生しました:', error);
        setMessages(prev => [...prev, {
          role: 'ai',
          content: 'エラーが発生しました。再試行してください。'
        }]);
        setIsLoading(false);
        setProgress('');
      }
    }
  };

  const sendMessage = () => {
    if (!input.trim() || isLoading) return;

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: input 
    }]);

    // ストリーミングリクエストの開始
    setIsLoading(true);
    fetchStreamingResponse();
    
    // 入力のクリア
    setInput('');
  };

  const clearChat = () => {
    setMessages([]);
    setProgress('');
    
    // 進行中のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">AI チャットボット</h1>
        <button 
          onClick={clearChat}
          className="p-2 rounded hover:bg-gray-100"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg max-w-3/4 
              ${msg.role === 'user' 
                ? 'bg-blue-100 self-end ml-auto' 
                : 'bg-gray-100 self-start mr-auto'
              }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">
            {progress || '思考中...'}
          </div>
        )}
      </div>

      <div className="p-4 border-t flex items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          className="flex-grow p-2 border rounded mr-2 resize-none"
          rows={3}
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
