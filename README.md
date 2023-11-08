This is a collection of docker images for testing Homebridge against various platforms and operating release levels. These only work when run on a Linux platform, and can not be run on a MacOS or windows Platform.  So to workaround this, I'm using a Virtual Box Ubuntu Image on my Intel Mac, and running docker inside that.  To make it easy to work with the files, I mounted the git repo from my Coding working on the Mac into Virtual Box.

These images are designed to run homebridge-config-ui-x as a service

# Raspberry PI

## Raspbian Buster - ./runRPIBuster.sh

This docker images creates a Raspbian Buster environment and sets up / configures homebridge via the current homebridge APT package.  Startup time takes about 3-4 minutes, and you can access homebridge via the UI.


```
PRETTY_NAME="Raspbian GNU/Linux 10 (buster)"
NAME="Raspbian GNU/Linux"
VERSION_ID="10"
VERSION="10 (buster)"
VERSION_CODENAME=buster
ID=raspbian
ID_LIKE=debian
HOME_URL="http://www.raspbian.org/"
SUPPORT_URL="http://www.raspbian.org/RaspbianForums"
BUG_REPORT_URL="http://www.raspbian.org/RaspbianBugs"
```

```
getconf GNU_LIBC_VERSION
glibc 2.28
```

## Ubuntu Buster - ./runX86.sh

This docker images creates a X86_64 Buster environment and sets up / configures homebridge via the current homebridge APT package.  Startup time takes about 3-4 minutes, and you can access homebridge via the UI.

```
PRETTY_NAME="Debian GNU/Linux 10 (buster)"
NAME="Debian GNU/Linux"
VERSION_ID="10"
VERSION="10 (buster)"
VERSION_CODENAME=buster
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"
```

```
getconf GNU_LIBC_VERSION
glibc 2.28
```