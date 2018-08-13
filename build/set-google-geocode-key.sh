#!/bin/sh

SCRIPT_DIR=`dirname "$0"`

echo "export const GOOGLE_GEOCODE_KEY = \"${GOOGLE_GEOCODE_KEY}\";" > ${SCRIPT_DIR}/../src/conf/secret.ts