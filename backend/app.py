import os
import json
from flask import Flask, Response, request, jsonify, stream_with_context
from flask_cors import CORS
from typing import List, Dict, Any, Generator
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma

app = Flask(__name__)
CORS(app)
load_dotenv()

class ChatState:
    def __init__(
        self,
        messages: List[BaseMessage] = None,
        web_search_results: List[Dict[str, str]] = None,
        conversation_history: List[Dict[str, str]] = None,
    ):
        self.messages = messages if messages is not None else []
        self.web_search_results = web_search_results if web_search_results is not None else []
        self.conversaiton_history = conversation_history if conversation_history is not None else []

class StreamingChatAgent:
    def __init__(self, google_api_key: str, tavily_api_key: str):
        os.environ["GOOGLE_API_KEY"] = google_api_key
        os.environ["TAVILY_API_KEY"] = tavily_api_key
        
        # モデルと検索ツールの初期化
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", streaming=True)
        self.web_search_tool = TavilySearchResults(k=3)
        self.embeddings = GoogleGenerativeAIEmbeddings(model="text-embedding-004")
        
        # 会話履歴用のベクターストア
        self.vectorstore = Chroma(
            collection_name="conversation_history",
            embedding_function=self.embeddings
        )
        
        # チャットグラフの定義
        self.workflow = self.define_workflow()
        self.app = StateGraph(ChatState)
        self.configure_graph()
    
    def define_workflow(self):
        def process_query(state: ChatState):
            # 最新のメッセージを取得
            current_message = state.messages[-1]
            
            # Web検索の実行
            web_results = self.web_search_tool.invoke(current_message.content)
            
            return {
                "web_search_results": web_results,
                "messages": state.messages
            }
        
        def rag_retrieval(state: ChatState):
            # 会話履歴からの関連情報の検索
            query = state.messages[-1].content
            relevant_docs = self.vectorstore.similarity_search(query, k=3)
            
            return {
                "context": relevant_docs,
                "messages": state.messages
            }
        
        def generate_response(state: ChatState):
            # プロンプトテンプレートの作成
            prompt = ChatPromptTemplate.from_messages([
                ("system", "あなたは有能で親切なアシスタントです。Web検索結果と過去の会話コンテキストを参考にして回答してください。"),
                ("user", "Web検索結果: {web_search_results}\n過去の会話コンテキスト: {context}\n質問: {query}")
            ])
            
            # チェーンの作成
            chain = (
                RunnablePassthrough.assign(
                    web_search_results=lambda x: x["web_search_results"],
                    context=lambda x: x["context"],
                    query=lambda x: x["messages"][-1].content
                )
                | prompt
                | self.llm
            )
            
            # レスポンスの生成
            response = chain.invoke(state)
            
            return {
                "messages": state.messages + [response],
                "conversation_history": state.conversation_history + [
                    {
                        "query": state.messages[-1].content,
                        "response": response.content
                    }
                ]
            }
        
        return {
            "process_query": process_query,
            "rag_retrieval": rag_retrieval,
            "generate_response": generate_response
        }
    
    def configure_graph(self):
        # グラフのノードとエッジの設定
        self.app.add_node("process_query", self.workflow["process_query"])
        self.app.add_node("rag_retrieval", self.workflow["rag_retrieval"])
        self.app.add_node("generate_response", self.workflow["generate_response"])
        
        self.app.set_entry_point("process_query")
        
        self.app.add_edge("process_query", "rag_retrieval")
        self.app.add_edge("rag_retrieval", "generate_response")
        self.app.add_edge("generate_response", END)
    
    def stream_response(self, query: str) -> Generator[str, None, None]:
        # 進捗ステータスの生成
        yield json.dumps({"type": "status", "content": "Web検索中..."}) + "\n"
        
        # チャットの実行
        initial_state = ChatState(messages=[HumanMessage(content=query)])
        result = self.app.compile().invoke(initial_state)
        
        # 会話履歴の保存
        self.vectorstore.add_documents([
            {"page_content": item["query"]} for item in result["conversation_history"]
        ])
        
        # レスポンスをストリーミング
        full_response = result["messages"][-1].content
        
        yield json.dumps({"type": "status", "content": "回答生成中..."}) + "\n"
        
        # 文字単位でストリーミング
        for i in range(1, len(full_response) + 1):
            yield json.dumps({
                "type": "response", 
                "content": full_response[:i]
            }) + "\n"
        
        yield json.dumps({"type": "status", "content": "完了"}) + "\n"

# チャットエージェントのインスタンス化
chat_agent = StreamingChatAgent(
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    tavily_api_key=os.getenv("TAVILY_API_KEY")
)

@app.route('/api/messages', methods=['POST'])
def stream_chat():
    data = request.json
    query = data.get('query', '')
    
    return Response(
        stream_with_context(chat_agent.stream_response(query)),
        content_type='text/event-stream'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
