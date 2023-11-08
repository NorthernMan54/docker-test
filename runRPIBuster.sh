#!/bin/bash

set -e


# docker run --rm -v $(pwd):/node-pty raspbian

export VERSION=${1:-buster}
export BASE_IMAGE=balenalib/raspberry-pi-debian:$VERSION
export QEMU_ARCH=arm
export DOCKERFILE="Dockerfile.debian"

export RUNNING=`docker ps -a -q| wc -l`
if [ $RUNNING -ne 0 ]; then
	docker stop $(docker ps -a -q)
fi

export RUNNING=`docker ps -a -q| wc -l`
if [ $RUNNING -ne 0 ]; then
	docker rm $(docker ps -a -q)
fi

export CONTAINER="rpi-$VERSION"

docker run --rm --privileged multiarch/qemu-user-static:register --reset
docker build -f docker/$DOCKERFILE --build-arg BASE_IMAGE=${BASE_IMAGE} --build-arg QEMU_ARCH=${QEMU_ARCH} -t $CONTAINER-test .
docker run --rm -d --name $CONTAINER --net=host --tmpfs /tmp --tmpfs /run --platform linux/arm/v6 --privileged -v $(pwd):/image $CONTAINER-test 

until docker exec -it $CONTAINER bash -c 'ps -ef | grep journald | grep systemd | grep -v bash' ; do sleep 10; done
#docker exec x86-$VERSION ps -ef
docker exec $CONTAINER hb-service start
echo
until docker exec $CONTAINER hb-service status; do sleep 10; done
echo 'To see the logs run'
echo docker exec $CONTAINER hb-service logs
echo 'To see the console'
echo docker exec -it $CONTAINER bash



#until docker exec raspbian hb-service status; do sleep 10; done
