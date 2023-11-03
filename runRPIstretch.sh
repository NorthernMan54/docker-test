#!/bin/bash

set -e


# docker run --rm -v $(pwd):/node-pty raspbian

export BASE_IMAGE=balenalib/raspberry-pi-debian:stretch
#export BASE_IMAGE=balenalib/raspberrypi3-debian-node:10.10-stretch-build
export QEMU_ARCH=arm
export DOCKERFILE="Dockerfile.oldDebian"
docker build -f docker/$DOCKERFILE --build-arg BASE_IMAGE=${BASE_IMAGE} --build-arg QEMU_ARCH=${QEMU_ARCH} -t raspbian-test .
docker run --rm -d --name raspbian --net=host --tmpfs /tmp --tmpfs /run --platform linux/arm/v5 --privileged -v $(pwd):/image raspbian-test 

until docker exec raspbian hb-service status; do sleep 10; done
