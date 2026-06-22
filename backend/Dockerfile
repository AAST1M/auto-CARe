# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build || true # Build tsx if necessary, or just run tsx

EXPOSE 5001
# Start the server using tsx 
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/index.ts"]
