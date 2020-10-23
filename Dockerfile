FROM alpine:3.7
MAINTAINER GoCD Contributors <go-cd-dev@googlegroups.com>

EXPOSE 5000

COPY . /cla-assistant
WORKDIR /cla-assistant

RUN \
  apk add --update ca-certificates nodejs su-exec git curl bzip2 patch make g++ && \
  addgroup -S cla-assistant && \
  adduser -S -D -G cla-assistant cla-assistant && \
  chown -R cla-assistant:cla-assistant /cla-assistant && \
  su-exec cla-assistant /bin/sh -c 'cd /cla-assistant && npm install && node_modules/grunt-cli/bin/grunt build && rm -rf /home/cla-assistant/.npm .git' && \
  apk del git curl bzip2 patch make g++ && \
  rm -rf /var/cache/apk/*

USER cla-assistant
CMD npm start
