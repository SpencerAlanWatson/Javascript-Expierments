'use strict';
/*
 *Requires:
 
 *Underscorejs
 *asyncjs
 */

var cManagerInit = _.once(function (Size) {
    var self = this;
    self.cObjects = [];

    $('<canvas width="' + Size.x + '" height="' + Size.y + '" id="main-canvas" class="canvas">').prependTo('body');

    self.canvas = document.getElementById('main-canvas');
    self.backgroundCanvas = document.createElement('canvas');
    
    self.backgroundCanvas.setAttribute('width', Size.x);
    self.backgroundCanvas.setAttribute('height', Size.y);
    self.backctx = self.backgroundCanvas.getContext('2d');
    self.backctx.translate(0.5,0.5);
    
    self.bCanvas = document.createElement('canvas');
    self.bCanvas.setAttribute('width', Size.x);
    self.bCanvas.setAttribute('height', Size.y);

    self.ctx = self.canvas.getContext('2d');
    self.bctx = self.bCanvas.getContext('2d');
    self.bctx.translate(0.5, 0.5);

    self.AddToDraw = function (canvasObject) {
        var drawID = canvasObject.drawID;
        if (!self.cObjects[drawID]) {
            self.cObjects[drawID] = [];
        }
        self.cObjects[drawID].push(canvasObject);
    };

    self.RemoveFromDraw = function (canvasObject) {
        var index = canvasObject.drawID;
        if (index === -1) return;

        var index2 = self.cObjects[index].indexOf(canvasObject);
        if (index2 === -1) return;

        return self.cObjects[index].splice(index2, 1);
    };
    //Drawing lines: Render: 0.980ms 
    //Other way: Render: 4.831ms 
    //Precreating rect on cashed canvas, then drawing that a ton of times: Render: 10.254ms 
    self.Render = function () {
        var bctx = self.bctx;
        
        /*var cc = document.createElement('canvas');
        cc.width = 10;
        cc.height = 10;
        var cctx = cc.getContext('2d');
        cctx.rect(0, 0, 10, 10);
        cctx.stroke();*/

        console.time("Render");
        self.ctx.clearRect(0, 0, Size.x, Size.y);
        self.ctx.drawImage(self.backgroundCanvas, 0, 0);
        self.ctx.drawImage(self.bCanvas, 0, 0);
        /*for(var x = 0; x < 500; x += 10){
            for(var y = 0; y < 500; y += 10){
                bctx.drawImage(cc, x, y);
            }
        }*/

        /*bctx.beginPath();
        for(var x = 0; x < 500; x += 10){
            bctx.moveTo(x, 0);
            bctx.lineTo(x, 500);
        }
        for(var y = 0; y < 500; y += 10){
            bctx.moveTo(0, y);
            bctx.lineTo(500, y);
        }
        bctx.stroke();*/
        //self.bctx.width++;
        //self.bctx.width--;

        _.each(self.cObjects, function (e, i, list) {
            
            var drawStyle = e[0].drawStyle.toLowerCase();
            var cctx = e[0].isBackground ? self.backctx : self.bctx;
            /*_.each(e[0].Opts, function (Opt, index) {
                self.bctx[index] = Opt;
            });*/

            _.each(e, function (item, i) {

                    item.Draw(cctx);
                //self.RemoveFromDraw(item);
            });
            //delete self.cObjects[i];
            switch (drawStyle) {
            case "fill":
                cctx.fill();
                break;
            case "stroke":
                cctx.stroke();
                break;
            default:
                cctx.stroke();
                break;
            }
            
        });
        self.cObjects = [];     
        console.timeEnd("Render");
    };
});

var cManager = new cManagerInit(new Vec2(501, 501));

function cObject(Position, Size, drawID, Opts) {
    var self = this;

    self.pos = Position;
    self.size = Size;
    self.drawID = drawID;

    var Options = Opts;
    if (!Options) {
        Options = {};
        Options.fillStyle = "white";
        Options.strokeStyle = "black";
        Options.shadowColor = "black";
        Options.shadowBlur = 0;
        Options.shadowOffsetX = 0;
        Options.shadowOffsetY = 0;
        Options.lineCap = "butt";
        Options.lineJoin = "miter";
        Options.lineWidth = 1;
        Options.miterLimit = 10;
        self.drawStyle = "stroke";
    } else {
        Options.fillStyle = Options.fillStyle || "white";
        Options.strokeStyle = Options.strokeStyle || "black";
        Options.shadowColor = Options.shadowColor || "black";
        Options.shadowBlur = Options.shadowBlur || 0;
        Options.shadowOffsetX = Options.shadowOffsetX || 0;
        Options.shadowOffsetY = Options.shadowOffsetY || 0;

        Options.lineCap = Options.lineCap || "butt";
        Options.lineJoin = Options.lineJoin || "miter";
        Options.lineWidth = Options.lineWidth || 1;
        Options.miterLimit = Options.miterLimit || 10;
        self.drawStyle = Options.drawStyle || "stroke";
    }//2
    self.Opts = Options;
}
Tile.prototype = new cObject();
Tile.prototype.constructor = Tile;
function Tile(Pos){
    var self = this;
    cObject.call(this, Pos, new Vec2(10,10), 0);
    
    self.Draw = function (ctx) {
        ctx.rect(self.pos.x, self.pos.y, self.size.x, self.size.y);
    }
    self.isBackground = true;
    cManager.AddToDraw(self);
}

Player.prototype = new cObject();
Player.prototype.constructor = Player;

function Player(){
    var self = this;
    cObject.call(this, new Vec2(0,0), new Vec2(9,9), 0, {drawStyle: 'fill', fillStyle: 'green'});
    $('#main-canvas').keyup(function(e){
       console.info(e);
        return false;
    });
}