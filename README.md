# Clinical code list creator

[![travis][travis-image]][travis-url]
[![david-dm][david-dm-image]][david-dm-url]
[![codecov][codecov-image]][codecov-url]
[![bitHound][bithound-image]][bithound-url]

  A cross platform command line tool for creating lists of clinical codes.

# Pre-requisites
1. Install [node.js](https://nodejs.org) >= 0.10.0
2. Install [git](https://git-scm.com/)

# Quick start
1. Open a command line prompt and clone this repository
```
git clone https://github.com/rw251/code-list-creator.git
```
2. Navigate into the newly created directory
```
cd code-list-creator
```
3. Install the dependencies
```
npm install
```
4. Create the database from the sample code dictionary
```
node index.js --process
```
5. Start creating a code list (hint - the sample code dictionary contains codes relating to acute myocardial infarction)
```
node index.js
```

# Command line options


# Use cases

1. User just wants a link to a list of codes
2. afsd





[travis-url]: https://travis-ci.org/rw251/code-list-creator
[travis-image]: https://travis-ci.org/rw251/code-list-creator.svg?branch=master
[david-dm-image]: https://david-dm.org/rw251/code-list-creator.svg
[david-dm-url]: https://david-dm.org/rw251/code-list-creator
[codecov-image]: https://codecov.io/github/rw251/code-list-creator/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/rw251/code-list-creator?branch=master
[bithound-image]: https://www.bithound.io/github/rw251/code-list-creator/badges/score.svg
[bithound-url]: https://www.bithound.io/github/rw251/code-list-creator
