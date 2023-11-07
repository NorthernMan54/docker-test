
export VERSION=${1:-buster}
export CONTAINER=x86-$VERSION

docker exec $CONTAINER hb-service update-node
docker exec $CONTAINER hb-service stop
docker exec $CONTAINER sudo --user homebridge env HOME=/home/homebridge bash --rcfile /opt/homebridge/bashrc-hb-shell -ci '/opt/homebridge/lib/node_modules/homebridge-config-ui-x/upgrade-install.sh 4.51.0 /opt/homebridge'
docker exec $CONTAINER hb-service restart
until docker exec $CONTAINER hb-service status; do sleep 10; done
docker exec $CONTAINER hb-service stop
docker exec $CONTAINER wget -q https://github.com/NorthernMan54/homebridge-apt-pkg/releases/download/1.2.1/homebridge_1.2.1_amd64.deb
docker exec $CONTAINER sudo dpkg -i homebridge_1.2.1_amd64.deb
docker exec $CONTAINER hb-service logs
