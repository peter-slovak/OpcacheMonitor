# OpcacheMonitor
A simple dashboard for monitoring a number of PHP instances or FPM pools that use OPcache. If you only need to keep an eye on one instance, you can also have a look at some of the other projects (my favorite being <a href="https://github.com/PeeHaa/OpCacheGUI">PeeHaa's OpCacheGUI</a>). This one trades off more specific and advanced functions like single-file invalidation for an overview of the most important metrics of your PHP pools.

### Installation - Server side
For every PHP pool or OPcache instance you want to monitor, clone the repository into a directory visible by that instance's PHP interpreter. You only need the `api/` subdirectory on Server side.
```sh
$ cd mydomain.com/wwwroot/
$ git clone https://github.com/peter-slovak/OpcacheMonitor.git opcache
```
Make sure the monitor API scripts are accessible on the same URL that is defined in `main.js` on Client side. This defaults to `/opcache/api`, so in the example above, these scripts should be located at `http://mydomain.com/opcache/api`.

Since the same scripts are used for all the instances, it makes sense to create symlinks from all the docroots to a single repository.

### Installation - Client side
Clone the repository into a directory accessible by your web server:
```sh
$ cd /var/www/html
$ git clone https://github.com/peter-slovak/OpcacheMonitor.git opcache-monitor
$ cd opcache-monitor
# Don't forget to check out necessary Chart.js libraries
$ git submodule init
$ git submodule update
# OR fetch them manually
$ rmdir chartjs; git clone https://github.com/nnnick/Chart.js.git chartjs
```
Create a map of servers you wish to monitor, either manually (see `examples/example.servers.json`) or with a script (`examples/generate_servers.py`). Save the configuration into `servers.json` and open the URL (in this case `http://localhost/opcache-monitor`). If you run the Client side locally, make sure you have a webserver running.

### Configuration
Everything should work out-of-the-box, but you can fiddle with the details in `main.js`. For example, you can change the refresh interval, the color scheme of charts or warning thresholds.

### Future
- Add a Settings page to manage servers and tweak settings
- Add optional authentication

### Screenshots
<img src="https://raw.githubusercontent.com/peter-slovak/OpcacheMonitor/master/img/dashboard.png" style="width: 700px; margin-left: 40px">
