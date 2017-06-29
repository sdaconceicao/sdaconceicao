'use strict';

process.env.NODE_ENV = 'development';

const chalk = require('chalk');
const webpack = require('webpack');
const config = require('../config/webpack.prod.config.js');
const fs = require('fs');

function build(){
    console.log(`Building bundle`);
    webpack(config).run((err, stats)=> {
        if (err) {
            console.error('Failed to compile.', [err]);
        } else if (stats.compilation.errors.length) {
            console.error('Failed to compile.', stats.compilation.errors);
        }
    });
}

build();
