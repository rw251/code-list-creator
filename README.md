# Clinical code list creator

[![travis][travis-image]][travis-url]
[![david-dm][david-dm-image]][david-dm-url]
[![codecov][codecov-image]][codecov-url]
[![bitHound][bithound-image]][bithound-url]

  A cross platform command line tool for creating lists of clinical codes.

# Background

The construction of reliable, reusable clinical code lists is essential for the analysis of Electronic Health Record (EHR) data, yet code list definitions are rarely transparent and their sharing is almost non-existent. In order to improve analyses of EHRs, generic tools and techniques for the construction, inspection, sharing and reuse of code lists are essential. We have identified the key elements in the construction process that need to be captured to enable properly computable code lists and we propose a simple structure for storing the requisite metadata alongside the code lists.

# Command line tool

We provide a command line script for creating clinical code lists and give three practical examples of assorted codes reflecting typical concepts: a diagnosis (acute myocardial infarction); an observation (blood pressure); and a prescribing event (clopidogrel). These can be found in [lists/](https://github.com/rw251/code-list-creator/tree/master/lists).

# Pre-requisites

The following software needs to be installed for the script to run:

1. nodejs ≥ 0.10.0 (https://nodejs.org)
2. git (https://git-scm.com/)

# Quick start

The following shows how to get up and running quickly using an example dictionary.

1. Open a command line prompt and clone this repository

        git clone https://github.com/rw251/code-list-creator.git

2. Navigate into the newly created directory

        cd code-list-creator

3. Install the dependencies

        npm install

4. Create the database from the sample code dictionary

        node index.js --process

5. Start creating a code list (hint - the sample code dictionary contains codes relating to acute myocardial infarction so try specifying 'myocardial infarction' when prompted for synonyms)

        node index.js

6. Follow on screen instructions. Ultimately two files will be created in the out/ directory:
  - codes.txt - the raw list of codes selected
  - meta.json - the associated metadata


# Command line options
```
$ node index.js --help

  Usage: index [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -P, --process      Load files in ./processed into database
    -m, --meta <file>  Load a metadata file
```

# Code dictionaries

When using the `--process` flag the script attempts to load all files in the processed directory. Code dictionaries should be placed here as tab delimited text files as shown be the example file `example-read-code-dictionary.txt`. The file should contain 3 columns: code, description, parent. For code dictionaries without a hierarchy the parent field can be left blank. For entries with multiple descriptions of multiple parents these should be entered on multiple lines e.g.

| CODE | DESCRIPTION | PARENT |
| ---- | ----------- | ------ |
| 1111 | first description | 123 |
| 1111 | second description | 123 |

A code dictionary will therefore need a certain degree of pre-processing to get it into this format. Two scripts are provided for example which take read code v2 lists for concepts and medications and convert them into this format. These dictionaries are available on request from the [Health and Social Care Information Centre](https://isd.hscic.gov.uk/trud3/user/guest/group/0/home).      

# Iterating

Sometimes it is necessary to perform multiple iterations of the tool. This typically happens when extra synonyms are discovered during the process. In this case it is possible to pass the JSON metadata file that was created by the process into a new run of the script (using the `--meta` flag). Codes previously rejected or accepted remain as such to save the user time. 



[travis-url]: https://travis-ci.org/rw251/code-list-creator
[travis-image]: https://travis-ci.org/rw251/code-list-creator.svg?branch=master
[david-dm-image]: https://david-dm.org/rw251/code-list-creator.svg
[david-dm-url]: https://david-dm.org/rw251/code-list-creator
[codecov-image]: https://codecov.io/github/rw251/code-list-creator/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/rw251/code-list-creator?branch=master
[bithound-image]: https://www.bithound.io/github/rw251/code-list-creator/badges/score.svg
[bithound-url]: https://www.bithound.io/github/rw251/code-list-creator
