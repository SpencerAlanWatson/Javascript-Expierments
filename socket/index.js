var io = global.io;
var _ = require('underscore');
var http = require('http'),
    url = require('url'),
    async = require("async");

var neighbors = [[-1, 1], [0, 1], [1, 1], [1, 0], [-1, 0], [1, -1], [0, -1], [1, -1]];
var nodesX = 100;
var nodesY = 100;
var nodesSeperation = 10;

function Node(x, y, px, py, closed) {
    var self = this;
    self.x = x;
    self.y = y;
    self.px = px;
    self.py = py;
    self.fScore = 0;
    self.gScore = 0;
    self.parent = null;
    self.closed = closed;
}

var Nodes = [];
var closed = [];
var open = [];
var initData = [];

function setup() {
    for (var x = 0; x < nodesX; x++) {
        Nodes[x] = [];
        for (var y = 0; y < nodesY; y++) {
            var n;
            if (x == 49 && y >= 44 && y <= 54) {
                n = new Node(x, y, x * nodesSeperation, y * nodesSeperation, true);
                closed.push(n);
            } else {
                n = new Node(x, y, x * nodesSeperation, y * nodesSeperation, false);
            }
            Nodes[x][y] = n;
            initData.push({
                px: n.px,
                py: n.py,
                closed: n.closed
            });
        }
    }
}

setup();
var tilesX = 50,
    tilesY = 50,
    delay = 100,
    stepCount = 0,
    running = false,
    Tiles = [];

function createTiles() {
    for (var x = 0; x < tilesX; x++) {
        for (var y = 0; y < tilesY; y++) {
            var tilePos = (x * tilesY) + y;
            Tiles[tilePos] = new Tile(x, y);
        }
    }
}

//createTiles();


function SimLoop(socket) {
    console.time("SimLoop");
    stepCount++;

    console.time("Counting Alive Tiles");
    var aliveTiles = [];
    async.each(Tiles, function (e, cb) {
        aliveTiles[e.tilePos] = e.alive;
        cb();
    }, function () {
        console.timeEnd("Counting Alive Tiles");

        console.time("MainLoop");
        async.each(Tiles, function (tile, cb) {
            var numAlive = countAliveNeighbors(tile.nAddress, aliveTiles, function (numAlive) {
                //console.time("Deciding Alive or Dead");
                if (numAlive < 2 || numAlive > 3) {
                    tile.alive = false;
                } else if (numAlive == 3) {
                    tile.alive = true;
                }
                cb();
            });
        }, function () {
            console.timeEnd("MainLoop");
            if (running) {
                //async.each(global.ioClients, function (e, cb) {
                //e.emit("Step", {}, function (data) {
                //  cb();
                socket.emit("Step", stepCount);
                _.delay(SimLoop, delay, socket);

            }
            //}, function () {
            console.timeEnd("SimLoop");
        });

    });

}

function Tile(x, y) {
    var self = this;
    var alive = false;

    this.__defineGetter__("alive", function () {

        return alive;
    });

    this.__defineSetter__("alive", function (val) {
        if (alive !== val) {
            alive = val;
            _.defer(function () {
                _.each(global.ioClients, function (e) {
                    e.emit("TileChange", {
                        "tilePos": self.tilePos,
                        "x": self.x,
                        "y": self.y,
                        "alive": alive
                    });
                });
            });
        }

    });

    self.x = x;
    self.y = y;
    self.tilePos = (x * tilesY) + (y);

    self.nAddress = [];
    for (var x = -1; x < 2; x++) {
        var nX = self.x + x;
        if (nX >= 0 && nX < tilesX) {
            for (var y = -1; y < 2; y++) {
                var nY = self.y + y;
                if (x == 0 && y == 0) continue;
                if (nY >= 0 && nY < tilesY) {
                    self.nAddress.push((nX * tilesY) + nY);
                }
            }
        }
    }
}

function countAliveNeighbors(nAddrs, list, fn) {

    var numAlive = 0;
    async.each(nAddrs, function (item, cb) {
        if (list[item]) numAlive++;
        cb();
    }, function () {
        fn(numAlive);
    });

}

var id;

io.sockets.on('connection', function (socket) {

    global.ioClients.push(socket);

    /*socket.on("start", function (data) {
        running = true;
        var id = _.delay(SimLoop, delay, socket);
    });

    socket.on("stop", function (data) {
        running = false;
        clearTimeout(id);
    });
    socket.on("Click", function (data) {
        var tilePos = (data.x * tilesY) + data.y;
        Tiles[tilePos].alive = !Tiles[tilePos].alive;
        /*socket.emit("TileChange", {
            "tilePos": tilePos,
            "alive": Tiles[tilePos].alive
        });*/
    /*});
    socket.on("Set", function (data) {
        Tiles[data.tilePos].alive = data.alive;
    });
    socket.on("ChangeDelay", function (data) {
        delay = data;
    });*/
    /* http.get(url.parse('http://69.88.138.29:8088/observer-mode/rest/consumer/getGameDataChunk/PBE1/37237862/1/token'), function (res) {
        var data = [];

        res.on('data', function (chunk) {
            socket.emit("OData", chunk.toString("hex"));
            data.push(chunk);
        }).on('end', function () {
            //at this point data is an array of Buffers
            //so we take each octet in each of the buffers
            //and combine them into one big octet array to pass to a
            //new buffer instance constructor
            console.log("finished");
        });
    });*/
    socket.on("TurnToHex", function (data, fn) {
        fn(data.toString("hex"));
    });
    socket.emit("Initiate", initData, function (data) {
        var start = data.start;
        var end = data.end;
        FindPath(Nodes[start.x][start.y], Nodes[end.x][end.y], socket);
    });
    socket.on('disconnect', function () {
        //global.ioClients.splice(global.ioClient.indexOf(socket), 1);
    });
});

function FindPath(start, end, socket) {
    socket.emit("drawEnds", {
        start: {
            px: start.px,
            py: start.py
        },
        end: {
            px: end.px,
            py: end.py
        }
    });
    start.fScore = heuristicCostEstimate(start, end);
    open.push(start);

    // var first = true;
    console.time("2");
    setTimeout(function pathLoop() {
        console.time("1");
        var current = _.min(open, function (node) {
            return node.fScore;
        });

        if (!_.isEqual(start, current)) {
            socket.emit('drawLine', {
                start: [current.parent.px, current.parent.py],
                end: [current.px, current.py]
            });
            socket.emit('addClosedNode', {
                px: current.px,
                py: current.py
            });
        }

        if (_.isEqual(current, end)) {
            //_.defer(constructPath(end, end.parent));
            socket.emit("Finish");
            console.log("finished");
            console.timeEnd("1");
            console.timeEnd("2");
            return;
        }

        open.splice(open.indexOf(current), 1);
        closed.push(current);


        for (var i = 0; i < 8; i++) {
            var neighborPos = neighbors[i];
            var nx = current.x + neighborPos[0];
            var ny = current.y + neighborPos[1];
            if (nx < 0 || ny < 0 || nx >= nodesX || ny >= nodesY) {
                continue;
            }

            //if(!Nodes[nx])continue;
            try {
                var neighbor = Nodes[nx][ny];
            } catch (e) {
                console.log(e, nx, ny, neighborPos, current.x, current.y);
                continue;
            }
            //if(!neighbor)continue;


            if (_.contains(closed, neighbor)) continue;
            /*if(neighbor.closed){
                socket.emit('addClosedNode', { px: neighbor.px, py: neighbor.py });
                closed.push(neighbor);
                continue;
            }*/
            var tentGScore = current.gScore + dFormula(current, neighbor);
            var isNotInOpen = !_.contains(open, neighbor);

            if (isNotInOpen || (neighbor.gScore != 0 && tentGScore < neighbor.gScore)) {
                neighbor.parent = current;
                neighbor.gScore = tentGScore;
                neighbor.fScore = tentGScore + heuristicCostEstimate(neighbor, end);
                if (isNotInOpen) {
                    open.push(neighbor);
                    socket.emit('addOpenNode', {
                        px: neighbor.px,
                        py: neighbor.py
                    });
                }
            }
        }
        if (!_.isEmpty(open)) {
            setTimeout(pathLoop, 10);
        }
        console.timeEnd("1");
    }, 10);
    /*while(!_.isEmpty(open)){
        var current = _.min(open, function(node){
            return node.fScore;
        });
        if(!first){
            socket.emit('drawLine', { start: [current.parent.px, current.parent.py], end: [current.px, current.py]});
        }else{ first = false; }
        
        if(current == end){
            //_.defer(constructPath(end, end.parent));
            break;
        }

        open.splice(open.indexOf(current), 1);
        closed.push(current);
        for(var i = 0; i < 4; i++){
            var neighborPos = neighbors[i];
            var nx = current.x + neighborPos[0];
            var ny = current.y + neighborPos[1];
            if( (nx < 0 || ny  < 0) && (nx >= 100 || ny >= 100)){
                continue;
            }
            if(!Nodes[nx])continue;
            var neighbor = Nodes[nx][ny];
            if(!neighbor)continue;

            if(_.contains(closed, neighbor))continue;

            var tentGScore = current.gScore + dFormula(current, neighbor);
            var isInOpen = _.contains(open, neighbor);

            if(!isInOpen || (neighbor.gScore != 0 && tentGScore < neighbor.gScore)){
                neighbor.parent = current;
                neighbor.gScore = tentGScore;
                neighbor.fScore = tentGScore + heuristicCostEstimate(neighbor, end);
                if(!isInOpen){
                    open.push(neighbor);   
                }
            }
        }
    }*/
}

function heuristicCostEstimate(start, end) {
    return dFormula(start, end);
}

function dFormula(start, end) {
    /*console.log(start, end);
    var xdelta = end.x - start.x;
    var ydelta = end.y - start.y;

    var xdsqr = Math.pow(xdelta, 2);
    var ydsqr = Math.pow(ydelta, 2);

    var xysum = xdsqr + ydsqr;

    return Math.sqrt(xysum);*/
    return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
}