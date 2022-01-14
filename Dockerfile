FROM node:16-alpine

EXPOSE 5000

RUN addgroup -S cla-assistant
RUN adduser -S -D -G cla-assistant cla-assistant

COPY . /cla-assistant
WORKDIR /cla-assistant

RUN npm install && npm run build && npm prune --production

USER cla-assistant

CMD ["npm", "start"]
