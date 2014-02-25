var request = require('request');
var async = require("async");
var _ = require("underscore");
var querystring = require("querystring");


function RCO(json, End) {
    var self = this;
    self.Made = new Date().getTime();
    self.End = End;
    self.Json = json;
}
var baseURL = "https://prod.api.pvp.net/api/lol/";
var devAPIKey = "b4e17ddf-1177-4932-8acb-89ad976f7f3a";
function RiotController() {
    // define controller data
    var self = this;
    self.mCache = {};
    self.Items = {};
    self.Champions = {};
    //Request Limits
    self.reqLimits = {
        madeTenS: 0,
        madeTenM: 0,
        maxTenS: 10,
        maxTenM: 500
    };
    self.clearReqS = function () {
        self.reqLimits.madeTenS = 0;
    }
    self.clearReqM = function () {
        self.reqLimits.madeTenM = 0;
    }

    self.intervalSID = setInterval(self.clearReqS, 10000);
    self.intervalMID = setInterval(self.clearReqM, 600000);

    //Functions
    self.SendAPIReq = function (reqURL, queryString, storageTime, countsReqLimit, callback) {
        var qs;
        if(queryString){
            queryString.api_key = devAPIKey;
            qs = "?"+querystring.stringify(queryString);
        }else{
            queryString = {};
            queryString.api_key = devAPIKey;
            qs = "?"+querystring.stringify(queryString);
        }
        
        var url = baseURL + reqURL + qs;
        var json = self.CheckCache(url);
        if(json){
            callback(json);   
        }else{
            if (countsReqLimit) {
                if (self.reqLimits.madeTenS < self.reqLimits.maxTenS && self.reqLimits.madeTenM < self.reqLimits.maxTenM) {
                    ++self.reqLimits.madeTenS;
                    ++self.reqLimits.madeTenM;
                }else{
                    callback(null);
                    return;
                }
            }
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    self.mCache[url] = new RCO(body, new Date().getTime() + storageTime);
                    callback(body);
                } else {
                    callback(error);
                }
            });
        }
    }
    self.CheckCache = function (apiReq) {
        //console.log(self.mCache[apiReq]);
        if (typeof (self.mCache[apiReq]) != 'undefined') {
            var made = self.mCache[apiReq].Made;
            var end = self.mCache[apiReq].End;
            var json = self.mCache[apiReq].Json;
            if (made <= end) {
                return json;
            }
        }
        return false;
    }
    self.GetChampions = function(req, res){
        var rurl = "static-data/na/v1/champion";
        var qs = {};
        qs.champData = 'all';
        //self.SendAPIReq = function (reqURL, queryString, countsReqLimit, callback);
        self.SendAPIReq(rurl, qs, 3600000, false, function (data) {
            var jData = JSON.parse(data);
            var mapped = {};
            //Since we get champion keys and not ids (which are there names) we need to make a new object with the key being the key, and not the id.
            _.each(jData.data, function(item, key, list){
                mapped[item.key] = item;
            });
            self.Champions = mapped;
            if(res){
                res.json(mapped);
            }else{
                req(mapped);   
            }
        }); 
    }
    self.Champion = function (champId, callback) {
        
        self.GetChampions(function(Champ){
            var champ = Champ[champId];
            callback(champ);
        });
    }
    self.GetItems = function (req, res) {
        var rurl = "static-data/na/v1/item";
        var qs = {};
        qs.itemListData = 'all';
         self.SendAPIReq(rurl, qs, 3600000, false, function (data) {
             var jData = JSON.parse(data);
                
            self.Items = jData.data;
            if(res){
                res.json(data);
            }else{
                req(jData.data);   
            }
        });
    }
    self.Item = function (itemid, callback) {
        self.GetItems(function(Items){
            var item = Items[itemid];

            callback(null, Items[itemid]);
        });
    }
    self.id = "21225746";
    self.games = [];
    /*self.DataMine = function () {
        var rurl = "na/v1.3/game/by-summoner/21225746/recent";
        
        //var json = self.CheckCache(rurl);
        //if (json === false) {
        var url = baseURL + rurl + "?" + devAPIKey;
        self.SendAPIReq(url, function (data) {
            //self.mCache[rurl] = new RCO(data, new Date().getTime() + 30000);
            var j = JSON.parse(data);
            for (var i = 0; i < j.games.length; i++) {
                if (self.games.indexOf(j.games[i]) == -1) {
                    self.games.push(j.games[i]);
                }
            }
            //res.json(self.games);
        });
        //} else {
        //res.json(self.games);
        //}
    }*/
    self.GetMyRecentGames = function (sumid, callback) {
        var rurl = "na/v1.3/game/by-summoner/"+sumid+"/recent";
        self.SendAPIReq(rurl, {}, 30000, true, function (data) {
            callback(JSON.parse(data));
        });
    }
    self.GetSummonerID = function(name, cont){
        var ret = {};
        var standardName = name.replace(' ', '');
        standardName = standardName.toLowerCase();
        standardName = standardName.trim();
        var rurl =  "na/v1.3/summoner/by-name/"+standardName;
        
        self.SendAPIReq(rurl, {}, 3600000, true, function (data) {
            var j = JSON.parse(data);
            var id = j[standardName].id;
            ret.id = id;
            var rurl2 = "na/v1.3/summoner/"+id+"/name";
            self.SendAPIReq(rurl2, {}, 3600000, true, function(data2){
                var Data2 = JSON.parse(data2);
                ret.name = Data2[id];
                cont(ret);
            });
        });
    }
    self.GameComparision = function (req, res){
        var ret = {};
        var player = {};
        
        var summonerId;
        var RecentGames;
        var Game;
        var name = req.query["name"];
        

        var GetSummonerIdCB = function(sumid){
            summonerId = sumid.id;
            player.id = summonerId;
            player.name = sumid.name;
            
            self.GetMyRecentGames(summonerId, GetRecentGamesCB);
        }
        
        var GetRecentGamesCB = function(recentGames){
            RecentGames = recentGames;
            Game = recentGames.games[0];
            
            var championId = Game.championId;
            
            var stats = Game.stats;


            var itemArr = [stats.item0, stats.item1, stats.item2, stats.item3, stats.item4, stats.item5, stats.item6];

            async.map(itemArr, self.Item, function(err, results){
                player.items = results;
                self.Champion(championId, ChampionCB);

            });
        }
        var ChampionCB = function(championInfo){
            player.champion = championInfo;
            ret.player = player;
            ret.game = Game;
            console.log("Sending info");
            res.json(ret);
        }
        self.GetSummonerID(name, GetSummonerIdCB);
        
        
        /*var r = JSON.parse(recentGames);
        var game = r[0];
        var stats = game.stats;
        var ret = {};
        var player = {};
        player.item0 = self.Item(game.stats.item0
        console.log(sumid, recentGames);*/
         
        
        
    }
}

var controller = new RiotController();

// define routes we handle here
exports.verbs = {
    'get': {
        //'/RiotAPI/:api/:request': controller.RiotRequest,
        '/RiotAPI/Items': controller.GetItems,
        '/RiotAPI/Item/:id': controller.Item,
        //'/RiotAPI/DataMine': controller.GetMyRecentGames,
        '/RiotAPI/GameComparision': controller.GameComparision
    },
    'post': {

    }

};