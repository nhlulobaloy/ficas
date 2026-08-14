#declare parent imamge
FROM node:20-alpine
#declare working directory
WORKDIR /app
#copy package.json and package-lock.json to the working directory
COPY package*.json ./
#install dependencies
RUN npm install
#copy all files to the working directory
COPY . .
#expose port 3000
EXPOSE 3000
#run the command to start the application
CMD ["node", "index.js"]