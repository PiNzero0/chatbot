from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import google.generativeai as genai
from dotenv import load_dotenv


# .envファイルを読み込む
load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('GEMINI_PRO_API_KEY')

if not API_KEY:
    raise EnvironmentError("GEMINI_PRO_API_KEY is not set in the environment variables.")

# Google Generative AIを初期化
genai.configure(api_key=API_KEY)

@app.route('/api/message', methods=['POST'])
def handle_message():
    try:
        # フロントエンドから受け取ったリクエストデータ
        data = request.get_json()
        user_message = data.get("message", "")
        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Gemini APIに問い合わせ
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt=user_message
        response = model.generate_content(prompt)
        

        # 応答を返す
        return jsonify({"reply": response.text}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

