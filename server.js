console.log("Starting Node Server");
// Load libaries
global.APP_DIR = __dirname;
var fs = require('fs');

var http = require('http');
var request = require('request');
var express = require('express');
var io = require('socket.io');
var _ = require('underscore');
var Router = require('./routes');
//Done

function Setup() {
    var self = {};
    self.app = express();
    self.app.use(express.compress());
    self.app.use(express.logger());
    self.app.use(express.bodyParser());
    self.app.use(express.cookieParser());
    self.app.use(express.session({
        secret: 'kitty'
    }));
    self.app.use(self.app.router);
    self.app.use(express.static(__dirname + '/public'));
    Router.route(self.app);
    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating MEW ...',
                Date(Date.now()), sig);
            var totalIOClients = global.ioClients.length;
            console.log('Disconnecting Socket.IO Clients (' + totalIOClients + ')...');
            _.each(global.ioClients, function (element, index, list) {
                console.log('Disconnecting IO Client #' + (index + 1));
                element.disconnect();
            });
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
      ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
       'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
      ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };
    self.setupTerminationHandlers();
    return self.app;
}

var app = Setup();
var server = http.createServer(app);
global.io = io.listen(server);
global.ioClients = [];
server.listen(3000);



var socket = require("./socket");
console.log("Node server started on port 3000, to stop press control-c");