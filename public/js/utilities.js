function Vec2(_x, _y) {
    var self = this;
    self.x = _x;
    self.y = _y;

    self.Distance = function (OtherPoint) {
        try {
            return Math.sqrt(Math.pow(OtherPoint.x - self.x, 2) + Math.pow(OtherPoint.y - self.y, 2));
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}

function getMCC(c, e) {
    var x;
    var y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= c.offsetLeft + c.clientLeft;
    y -= c.offsetTop + c.clientTop;
    return new Vec2(x, y);
}