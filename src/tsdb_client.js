/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file src/face_client.js
 * @author dan
 */

/* eslint-env node */
/* eslint max-params:[0,10] */

var util = require('util');
var u = require('underscore');
var url = require('url');
var path = require('path');

var strings = require('./strings');
var HttpClient = require('./http_client');
var config = require('./config');
var BceBaseClient = require('./bce_base_client');

/**
 *TSDB service api
 *
 * @see http://***
 *
 * @constructor
 * @param {Object} config The tsdb client configuration.
 * @extends {BceBaseClient}
 */

function TsdbClient(config) {
    BceBaseClient.call(this, config, 'tsdb', true);

    /**
     * @type {HttpClient}
     */
    this._httpAgent = null;
}
util.inherits(TsdbClient, BceBaseClient);

// --- B E G I N ---

TsdbClient.prototype.getMetics = function (database, options) {
    var options = options || {};
    var params = {
        database: database,
        query:''
    };
    
    return this.sendRequest('GET', '/v1/metric', {   
      params: params,
      config: options.config
    });
};
TsdbClient.prototype.listdataBases = function (options) {
    var options = options || {};
    // var params = {
    //     database: database,
    //     query:''
    // };
    
    return this.sendRequest('GET', '/v1/database', {   
      //params: params,
      config: options.config
    });
};    

// --- E N D ---

TsdbClient.prototype.sendRequest = function (httpMethod, resource, varArgs) {
    var defaultArgs = {
        database: null,
        key: null,
        body: null,
        headers: {},
        params: {},
        config: {},
        outputStream: null
    };
    var args = u.extend(defaultArgs, varArgs);

    var config = u.extend({}, this.config, args.config);
    var resource = path.normalize(path.join(
        '/v1/metric',
        strings.normalize(args.database || ''),
        strings.normalize(args.key || '', false)
    )).replace(/\\/g, '/');

    var client = this;
    var agent = this._httpAgent = new HttpClient(config);
    var httpContext = {
        httpMethod: httpMethod,
        resource: resource,
        args: args,
        config: config
    };
    u.each(['progress', 'error', 'abort'], function (eventName) {
        agent.on(eventName, function (evt) {
            client.emit(eventName, evt, httpContext);
        });
    });

    return this._httpAgent.sendRequest(httpMethod, resource, args.body,
        args.headers, args.params, u.bind(this.createSignature, this),
        args.outputStream
    );
};
module.exports = TsdbClient;