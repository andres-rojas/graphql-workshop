#!/usr/bin/env bash
set -e
set -x

docker run \
  --interactive \
  --tty \
  --rm \
  --name graphql-workshop \
  --publish 3000:3000 \
  --volume ${PWD}:/app \
  node:11.2 /app/entrypoint.sh $@
