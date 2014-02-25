// load library
var fs = require('fs'); //This is the file system library
var request = require('request');

function HomeController() {
    // define controller data
    var self = this;
    self.cache = {
        'index.html': ''
    };
    self.cache['index.html'] = fs.readFileSync(global.APP_DIR + '/index.html');

    // define utility functions
    self.cache_get = function (key) {
        return self.cache[key];
    };

    self.index = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/index.html'));
    };
    self.test = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/test.html'));
    };
    self.Path = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/PathFindingTest.html'));
    };
    self.ros = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/RiotOctetStream.html'));
    };
    self.life = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/life.html'));
    };
    self.pokemon = function (req, res) {
        res.set('Content-Type', 'text/html');
        res.send(fs.readFileSync(global.APP_DIR + '/Pokemon.html'));
    };
    self.logOnToPin = function (req, res) {
        var url = "http://pinnacle.lps.org/Pinnacle/Gradebook/Logon.aspx";
        var opts = {
            'url': url,
            'method': 'POST',
            'body': req.body.toString()
        };
        request(opts, function (err, r, data) {
            res.send(data);
        });
    }
    self.logon = function (req, res) {
        var url = "http://pinnacle.lps.org/Pinnacle/Gradebook/Logon.aspx?ReturnUrl=%2fPinnacle%2fGradebook%2fInternetViewer%2fInternetViewerService.ashx%2fInit%3fPageUniqueId%3de7a8c881-ed9c-4776-9c53-290705f6e157&PageUniqueId=e7a8c881-ed9c-4776-9c53-290705f6e157"
        request.get(url).pipe(res);
    }
    self.pinnacle = function (req, res) {
        var opts = {
            'url': "http://pinnacle.lps.org/Pinnacle/Gradebook/InternetViewer/InternetViewerService.ashx/Init?PageUniqueId=e7a8c881-ed9c-4776-9c53-290705f6e157",
            'method': 'POST',
            'json': true

        };
        //var jar = request.jar();
        var cookie = "BIGipServerPinnacle_pool=1191273482.20480.0000; PinnacleWeb.DomainId=Pinnacle; PinnacleWeb.ASPXAUTH=3DCB077A69B318FA9C38995E30F0496721B434DAF74A17C491117F6745E5B97E8DEEA98BE9AAC71B866D14FA96663E28CE187719AAF1C997D4583903EA587D99F115CCE65D9F59A37F9700B56FB5257B8C92963BF81EF4CECBD8E66AE289A5663B7D45E5E2021A1493A2C368BD359F5D18A5F75FA851C452BC98F3D329CEF7547A3C9FA37C13A4B438C9224A6B16D3405B28A0931FE138DB85E0AF9F4875AE22C683EE4EA5E7DA3214E032F4E457B429D22F0E3111547AA0A48A300DC939D724CF6314D6; __utma=33307297.2022509169.1390914803.1391695237.1391801126.8; __utmb=33307297.1.10.1391801126; __utmc=33307297; __utmz=33307297.1391801126.8.8.utmcsr=lse.lps.org|utmccn=(referral)|utmcmd=referral|utmcct=/index.html; PinnacleWeb.StudentId=14947";
        //jar.setCookie(cookie, opts.url);
        //opts.jar = jar;
        request.cookie(cookie);
        request(opts, function (err, r, data) {
            console.log(err, r, data);
            res.send(data);
        });
    }
}

var controller = new HomeController();

// define routes we handle here
exports.verbs = {
    'get': {
        '/': controller.index,
        '/t': controller.test,
        '/Pinnacle': controller.pinnacle,
        '/logon': controller.logon,
        '/path': controller.Path,
        '/life': controller.life,
        '/ros': controller.ros,
        '/pokemon': controller.pokemon

    },
    'post': {
        "/Logon.aspx": controller.logOnToPin
    }

};