FROM node:alpine
LABEL maintainer="Wiktor Tkaczyński <wiktor.tkaczynski@gmail.com>"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

ENV STORAGE_PATH /data/busydb
RUN mkdir -p ${STORAGE_PATH}

VOLUME $STORAGE_PATH

RUN yarn install


CMD yarn start
