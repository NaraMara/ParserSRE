# ParserSRE
Для решения задачи был написан node.js скрипт.\
Docker image можно найти [здесь](https://hub.docker.com/repository/docker/naramara/parserapp/general)

# ВАЖНО!
Для корректной работы при запуске скрипта необходимо передать путь до .yaml файла с данными расписания.\
Например:\
`
 sudo docker run -d naramara/parserapp ./file.yaml
`\
или
\
`
sudo apt install nodejs
node yamlparser.js ./file.yaml
`
# Еще замечание 
В скрипте использутся библиотека [node-libcurl](https://www.npmjs.com/package/node-libcurl).\ 
В ходе разработки было обнаружено, что при успешном выполнении post запроса ответ от сервера роняет код библиотеки с ошибкой о неудачном парсинге тела запроса. \
Из-за не получается нормально логировать ответы от сервера. Возможно написать свой парсер, но у меня, к сожалению, нет это времени

# Dockerfile

```
FROM node:18

WORKDIR /home/parser

COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT [ "node","yamlParser.js" ]
```
