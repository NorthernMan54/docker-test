#!/bin/bash

set -e

export VERSION=${1:-buster}

# docker run --rm -v $(pwd):/node-pty x86

export BASE_IMAGE=balenalib/amd64-debian:$VERSION
export QEMU_ARCH=x86_64
export DOCKERFILE="Dockerfile.debian"

export RUNNING=`docker ps -a -q| wc -l`
if [ $RUNNING -ne 0 ]; then
	docker stop $(docker ps -a -q)
fi

export RUNNING=`docker ps -a -q| wc -l`
if [ $RUNNING -ne 0 ]; then
	docker rm $(docker ps -a -q)
fi

docker run --rm --privileged multiarch/qemu-user-static:register --reset
docker build -f docker/$DOCKERFILE --build-arg BASE_IMAGE=${BASE_IMAGE} --build-arg QEMU_ARCH=${QEMU_ARCH} -t x86-$VERSION-test .
docker run --rm -d --name x86-$VERSION --net=host --tmpfs /tmp --tmpfs /run --privileged -v $(pwd):/image x86-$VERSION-test 
echo

until docker exec -it x86-$VERSION bash -c 'ps -ef | grep journald | grep systemd | grep -v bash' ; do sleep 10; done
#docker exec x86-$VERSION ps -ef
docker exec x86-$VERSION sudo hb-service start
echo
until docker exec x86-$VERSION hb-service status; do sleep 10; done
echo 'To see the logs run'
echo docker exec x86-$VERSION hb-service logs
echo 'To see the console'
echo docker exec -it x86-$VERSION bash