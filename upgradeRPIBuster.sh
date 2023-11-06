docker exec raspbian hb-service stop
docker exec raspbian wget https://github.com/NorthernMan54/homebridge-apt-pkg/releases/download/1.2.0/homebridge_1.2.0_armhf.deb
docker exec raspbian sudo dpkg -i homebridge_1.2.0_armhf.deb
docker exec raspbian hb-service logs
