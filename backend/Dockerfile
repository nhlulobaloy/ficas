#declare parent imamge
FROM node:20-alpine
#declare working directory
WORKDIR /app
#copy package.json and package-lock.json to the working directory
COPY package*.json ./
#install dependencies
RUN npm install
# install the typescipt run time and dev dep
RUN npm install typescript tsx
RUN npm install -D @types/express @types/node @types/cors @types/jsonwebtoken
#copy all files to the working directory
COPY . .
#expose port 3000
EXPOSE 3000
#run the command to start the application
CMD ["npx", "tsx", "index.ts"]