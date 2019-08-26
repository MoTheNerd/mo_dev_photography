# mohammaddev/mo_dev_photography

FROM node:12.8.0-alpine

ENV COMPlus_EnabledDiagnostics=0
WORKDIR /usr/share/mo_dev_photography

RUN apk update && apk upgrade \
    && apk add --no-cache git \
    && apk --no-cache add --virtual builds-deps build-base python

ENV PORT 6003
EXPOSE 6003

COPY . /usr/share/mo_dev_photography
RUN cd /usr/share/mo_dev_photography
RUN yarn

CMD ["yarn", "start"]