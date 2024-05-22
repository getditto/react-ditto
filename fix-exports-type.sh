#! /bin/bash

# This script defines the type of exports in the dist directory using minimal
# package.json files. Setting the type in the main package.json file does not
# work because we want to support both CommonJS and ES Module exports in the
# same package.

cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF
echo "Exports type set to CommonJS in dist/cjs/package.json"

cat >dist/esm/package.json <<!EOF
{
    "type": "module"
}
!EOF
echo "Exports type set to ES Module in dist/esm/package.json"