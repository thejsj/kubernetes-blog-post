FROM node:latest

COPY ["./package.json", "/app/"]
WORKDIR /app
RUN npm install # runnable-cache

COPY ["./", "/app/"]

# Open up ports on the container
EXPOSE 80 8000

# Command to start the app
CMD npm start
