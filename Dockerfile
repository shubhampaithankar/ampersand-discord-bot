# Use a lightweight Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your bot code
COPY . .

# Build a slimmer image for production
FROM node:18-alpine

# Copy only the production dependencies and your bot code
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app .

# Expose the port your bot listens on (adjust if needed)
EXPOSE 3000

# Set the command to run your bot application
CMD [ "npm", "run", "dev" ]
