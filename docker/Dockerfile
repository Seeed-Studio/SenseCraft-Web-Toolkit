FROM node:16-alpine3.14  as builder

RUN apk add --no-cache yarn git autoconf automake libtool g++ make libpng-dev file nasm

RUN git clone https://github.com/Seeed-Studio/SenseCraft-Web-Toolkit.git  /usr/SenseCraft-Web-Toolkit

WORKDIR /usr/SenseCraft-Web-Toolkit/

RUN yarn install \
    && yarn run build

COPY ./docker/default/nginx-default.conf /usr/SenseCraft-Web-Toolkit/nginx-default.conf

FROM nginx as runner
COPY --from=builder /usr/SenseCraft-Web-Toolkit/dist /usr/share/nginx/html/
COPY --from=builder /usr/SenseCraft-Web-Toolkit/nginx-default.conf /etc/nginx/conf.d/default.conf