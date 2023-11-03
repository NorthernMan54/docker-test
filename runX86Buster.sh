#!/bin/bash

set -e


# docker run --rm -v $(pwd):/node-pty x86

export BASE_IMAGE=balenalib/amd64-debian:buster
export QEMU_ARCH=x86_64
export DOCKERFILE="Dockerfile.debian"

export RUNNING=`docker ps --filter "NAME=x86-buster" | wc -l`
if [ $RUNNING -eq 2 ]; then
        docker stop x86-buster
fi

docker build -f docker/$DOCKERFILE --build-arg BASE_IMAGE=${BASE_IMAGE} --build-arg QEMU_ARCH=${QEMU_ARCH} -t x86-buster-test .
docker run --rm -d --name x86-buster --net=host --tmpfs /tmp --tmpfs /run --privileged -v $(pwd):/image x86-buster-test 

until docker exec x86-buster hb-service status; do sleep 10; done
echo 'To see the logs run'
echo docker exec x86-buster hb-service logs