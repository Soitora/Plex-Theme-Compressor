FROM node:20-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Ensure upload dir exists
RUN mkdir -p uploads

# Expose app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
