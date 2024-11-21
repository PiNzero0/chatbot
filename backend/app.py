from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv


# .envファイルを読み込む
load_dotenv()

app = Flask(__name__)
CORS(app)
# Gemini Pro APIのエンドポイントとAPIキーを設定
GEMINI_API_URL = "https://api.geminipro.com/v1/query"
API_KEY = os.getenv('GEMINI_PRO_API_KEY')

@app.route('/api/message', methods=['POST'])
def message():
    data = request.get_json()
    user_message = data.get("message", "")

    # Gemini Pro APIにリクエストを送信
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "query": user_message,
        "sources": ["https://example.com"],  # 利用するURLを指定
    }

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        response_data = response.json()
        
        # 応答を返す（エラーチェックを追加することを推奨）
        if response.status_code == 200:
            reply = response_data.get("reply", "応答がありません")
        else:
            reply = f"エラー: {response_data.get('error', '詳細不明')}"
        
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": f"エラー: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

