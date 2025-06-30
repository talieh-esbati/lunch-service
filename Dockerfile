# Use the official Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
#ENV PATH /app/node_modules/.bin:$PATH


# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./


# Install dependencies
#RUN npm config set strict-ssl false
#RUN npm cache clean --force
RUN npm install 

# Copy the rest of the app files to the working directory
COPY . .

# Build the React app
RUN npm run build
# Use a lightweight web server to serve the static files
# Here, we're using the 'serve' package, but you can choose a different web server if desired
RUN npm install -g serve

# Set the command to run when the container starts
CMD ["serve", "-s", "build", "-l", "3000"]

# Expose the port that the app will be running on
EXPOSE 3096