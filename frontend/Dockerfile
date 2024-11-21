# ベースイメージとしてnodeを使用
FROM node:18

# 作業ディレクトリの作成
WORKDIR /app

# パッケージファイルをコピーし、依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# Reactアプリケーションをビルド
RUN npm run build

# サーバーを起動 (デフォルトで3000ポート)
EXPOSE 3000
CMD ["npm", "start"]

