#!/bin/bash
set -e
set -x

cd /app
npm install

[ $# -eq 0 ] && exec /bin/bash || exec $@
