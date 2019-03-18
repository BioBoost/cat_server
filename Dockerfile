# The base image to start from
FROM node:11.11.0-stretch-slim

# Setup a working directory for our app
WORKDIR /app

# Copy package.json first
COPY package.json .
COPY package-lock.json .

# Install the node modules
RUN npm install

# Copy the application files
COPY . .

# Expose port 3000 from node
EXPOSE 3000

# The final command that starts the app
CMD ["npm", "start"]