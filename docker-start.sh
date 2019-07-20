#!/bin/bash

cd ../client
./env-gen.sh

cd -
node dist/server/index.js
