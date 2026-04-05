FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate prisma client
RUN npx prisma generate

# Copy app files
COPY . .

# Build app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
