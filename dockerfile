FROM node:18

WORKDIR /home/parser

COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT [ "node","yamlParser.js" ]