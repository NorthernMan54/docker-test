const child_process = require("child_process");
const fs = require("fs");

jest.setTimeout(30000);

describe.each(['buster', 'bullseye', 'bookworm'])('Regression Testing - RPI', (OS_VERSION) => {
  var CONTAINER = 'rpi-' + OS_VERSION;
  describe(OS_VERSION, () => {
    beforeAll(async () => {

      var DOCKERFILE = 'Dockerfile.debian';
      var BASE_IMAGE = 'balenalib/raspberry-pi-debian:' + OS_VERSION;
      var QEMU_ARCH = 'arm';

      console.log('Starting Homebridge on', OS_VERSION);
      await dockerRunner('docker build -f docker/' + DOCKERFILE + ' --build-arg BASE_IMAGE=' + BASE_IMAGE + ' --build-arg QEMU_ARCH=' + QEMU_ARCH + ' -t ' + CONTAINER + '-test .', 1800000);

      await dockerRunner('docker run --rm -d -p 8500:8581 --name ' + CONTAINER + ' --net=host --tmpfs /tmp --tmpfs /run --privileged -v ' + process.cwd() + ':/image ' + CONTAINER + '-test');

      await dockerUntil('docker exec -i ' + CONTAINER + ' bash -c ', 120000, 'ps -ef | grep journald | grep systemd | grep -v bash');
      await sleep(5000);
      await dockerRunner('docker exec ' + CONTAINER + ' sudo hb-service start');

      var result = await dockerUntil('docker exec ' + CONTAINER + ' hb-service status');
//      if (result.stdout)
//        console.log('STDOUT:', result.stdout.toString())
//      if (result.stderr)
//        console.log('STDERR:', result.stderr.toString())

//      result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
//      if (result.stdout)
//        console.log('STDOUT:', result.stdout.toString())
//      if (result.stderr)
//        console.log('STDERR:', result.stderr.toString())

      console.log('Homebridge is running on', OS_VERSION);

    }, 900000);

    afterAll(async () => {
      console.log('Stopping Homebridge on', OS_VERSION);
      var result = await child_process.execSync('docker stop $(docker ps -a -q)', { timeout: 120000 })
    });

    describe('GLIBC Version', () => {
      test('getconf GNU_LIBC_VERSION', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' getconf GNU_LIBC_VERSION');
        expect(result.stdout.toString()).toContain('glibc');
        console.log(OS_VERSION + ': ' + result.stdout.toString())
      });

      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toMatch(/Homebridge.*HAP.*Homebridge.* is running on port/);
      });
    });

    describe('update-node', () => {
      test('hb-service update-node', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service update-node');
        expect(result.stdout.toString()).toContain('rebuilt dependencies successfully');
      });
      test('hb-service status', async () => {
        var result = await dockerUntil('docker exec ' + CONTAINER + ' hb-service status');
        expect(result.stderr.toString()).toContain('Homebridge UI Running');
      }, 60000);
      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toMatch(/Homebridge.*HAP.*Homebridge.* is running on port/);
      });
    });

    describe('update to 4.51.0', () => {
      test('hb-service stop', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service stop');
        expect(result.stdout.toString()).toContain('Stopping Homebridge...');
      });
      test('touch /var/lib/homebridge/placeholder.json', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' touch /var/lib/homebridge/placeholder.json');
        //  expect(result.stdout.toString()).toContain('Stopping Homebridge...');
      });
      test('upgrade-install.sh 4.51.0 /opt/homebridge', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' sudo --user homebridge env HOME=/home/homebridge bash --rcfile /opt/homebridge/bashrc-hb-shell -ci', 600000, '/opt/homebridge/lib/node_modules/homebridge-config-ui-x/upgrade-install.sh 4.51.0 /opt/homebridge');
        expect(result.stdout.toString()).toContain('Running post-install scripts');
      });
      test('hb-service restart', async () => {
        //    console.log(result.stdout.toString().length);
        //    console.log(result.stdout.toString().slice(-500));

        var result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service restart');
        expect(result.stdout.toString()).toContain('Restarting Homebridge...');
      });
      test('ls -l /var/lib/homebridge/placeholder.json', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' ls -l /var/lib/homebridge/');
        expect(result.stdout.toString()).toContain('placeholder.json');
      });
      test('hb-service status', async () => {
        var result = await dockerUntil('docker exec ' + CONTAINER + ' hb-service status');
        expect(result.stderr.toString()).toContain('Homebridge UI Running');
      }, 60000);
      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toMatch(/Homebridge Config UI X.*is listening on :: port/);
      });
    });

    describe('update to new APT release - homebridge_1.2.1', () => {
      test('hb-service stop', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service stop');
        expect(result.stdout.toString()).toContain('Stopping Homebridge...');
      });
      test('wget homebridge_1.2.1_amd64.deb', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' wget -q https://github.com/NorthernMan54/homebridge-apt-pkg/releases/download/1.2.1/homebridge_1.2.1_armhf.deb');
        //    expect(result.stdout.toString()).toContain('Restarting Homebridge...');
      });
      test('dpkg -i homebridge_1.2.1_amd64.deb', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' sudo dpkg -i homebridge_1.2.1_amd64.deb');
        console.log('dpkg -i homebridge_1.2.1_amd64.deb', result.stdout.toString(), result.sterrr.toString());
        expect(result.stdout.toString()).toContain('Starting Homebridge service....');

        //    result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service restart');
        //    expect(result.stdout.toString()).toContain('Restarting Homebridge...');
      });
      test('hb-service status', async () => {
        var result = await dockerUntil('docker exec ' + CONTAINER + ' hb-service status');
        expect(result.stderr.toString()).toContain('Homebridge UI Running');
      }, 60000);
      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toMatch(/Homebridge Config UI X.*is listening on :: port/);
      });
    });

    describe('downgrade apt-pkg to 1.1.0', () => {
      test('hb-service stop', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service stop');
        expect(result.stdout.toString()).toContain('Stopping Homebridge...');
      });
      test('touch /var/lib/homebridge/placeholder.json', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' touch /var/lib/homebridge/placeholder.json');
        //  expect(result.stdout.toString()).toContain('Stopping Homebridge...');
      });
      test('apt-get remove homebridge', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' apt-get remove homebridge');
        expect(result.stdout.toString()).toContain('Removing homebridge');
      });
      test('wget homebridge_1.2.1_amd64.deb', async () => {
        //  result = await dockerRunner('docker exec ' + CONTAINER + ' apt-get purge homebridge');
        //  expect(result.stdout.toString()).toContain('Purging configuration files for homebridge');

        var result = await dockerRunner('docker exec ' + CONTAINER + ' apt-get install homebridge=1.1.0');
        expect(result.stdout.toString()).toContain('Setting up homebridge');
      });
      test('apt-get install homebridge=1.1.0', async () => {
        //    result = await dockerRunner('docker exec ' + CONTAINER + ' hb-service restart');
        //    expect(result.stdout.toString()).toContain('Restarting Homebridge...');

        var result = await dockerUntil('docker exec ' + CONTAINER + ' hb-service status');
        expect(result.stderr.toString()).toContain('Homebridge UI Running');
      });
      test('ls -l /var/lib/homebridge/placeholder.json', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' ls -l /var/lib/homebridge/');
        expect(result.stdout.toString()).toContain('placeholder.json');
      });
      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toMatch(/Homebridge Config UI X.*is listening on :: port/);
      });
    });

    describe('check logs', () => {
      test('hb-service logs', async () => {
        var result = await dockerRunner('docker exec ' + CONTAINER + ' tail -n 100 /var/lib/homebridge/homebridge.log')
        expect(result.stdout.toString()).toContain('Homebridge UI Running');
        //  expect(result.stdout.toString()).toContain('Started Homebridge');
      });
    });
  });
});

async function dockerRunner(command, timeout = 120000, subcommand = '') {
  var args = command.split(" ");
  var cmd = args.shift();
  if (subcommand) {
    args.push(subcommand);
  }
  var result = child_process.spawnSync(cmd, args, {
    timeout: timeout,
    maxBuffer: 100048577
  })
  if (result.error) {
    if (result.error.toString().includes('Error: spawnSync docker ETIMEDOUT') && command.includes(' logs')) {
      return result;
    } else {
      console.log(command, subcommand);
      console.trace('ERROR: ', result.error.toString())
      console.log(result.stdout.toString());
      console.log(result.stderr.toString());
      throw new Error(result.error);
    }
  } else if (result.status === 125) {
    console.log(command, subcommand);
    console.trace('ERROR: ', result.status)
    throw new Error(command + ', status: ' + result.status);
  } else if (result.status) {
    //    console.log(cmd, args);
    //    console.log('STATUS: ', result.status);
    //    console.log(result.stdout.toString());
    //    console.log(result.stderr.toString());
  }
  return result;
}

async function dockerUntil(command, timeout = 120000, subcommand = '') {
  var result = { status: 1 };
  var count = 0;
  while (result.status != 0) {
    result = await dockerRunner(command, timeout, subcommand);
    //    console.log('dockerUntil:', command, result.status);
    count++;
    await sleep(5000);
    if (count > 1000) {
      console.log(command);
      console.trace('ERROR: ', 'dockerUntil TIMEOUT')
      throw new Error('dockerUntil TIMEOUT');
    }
  }
  //  console.log('dockerUntil', command);
  //  console.log(result);
  //  console.log(result.stdout.toString());
  //  console.log(result.stderr.toString());
  return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
