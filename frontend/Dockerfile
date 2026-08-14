# declare node version and os
FROM node:20-alpine
# creating working directory
WORKDIR /app
# copy packege file into the working dir
COPY package*.json ./
# install dependecies
RUN npm install
# copy the project into the working app
COPY . .
# expose the port
EXPOSE 5173
# run the project
CMD ["npm", "run", "dev"]
