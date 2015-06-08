#!/usr/bin/env python
# An example script for populating servers.json

import json
from collections import OrderedDict

output = 'servers.json'

php54_startip = 1
php54_server_count = 4
php54_server_prefix = 'apache-php54-'

php55_startip = 1
php55_server_count = 2
php55_server_prefix = 'apache-php55-'


# The webpage shows servers in the order they are listed in
# the json document => keep them in order
server_map = OrderedDict()

server_map['php54'] = OrderedDict()
server_map['php54']['alias'] = 'PHP 5.4'
server_map['php54']['servers'] = OrderedDict()

server_map['php55'] = OrderedDict()
server_map['php55']['alias'] = 'PHP 5.5'
server_map['php55']['servers'] = OrderedDict()


# Define name-IP bindings. Your server addresses might 
# be in different order/using FQDN names/listening on other ports etc.
for i in range(php54_startip, php54_startip + php54_server_count):
    server_map['php54']['servers'][php54_server_prefix + str(i)] = '10.20.54.' + str(i)

for i in range(php55_startip, php55_startip + php55_server_count):
    server_map['php55']['servers'][php55_server_prefix + str(i)] = '10.20.55.' + str(i)


# Dump the data to json format
with open(output, 'w+') as f:
	f.write(json.dumps(server_map, sort_keys=False, indent=4))