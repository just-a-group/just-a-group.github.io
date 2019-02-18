"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * This is very bad code... I should refactor this...
 * eventually
 */
(function () {
    var NUMBER_OF_POINTS = 25;
    var Connection = /** @class */ (function () {
        function Connection(from, to) {
            this.from = from;
            this.to = to;
            this.opacity = 0;
            this.colorHue = this.getColorHue();
        }
        Connection.prototype.getColorHue = function () {
            return this.from.getConnectionColorHue() || this.to.getConnectionColorHue() || this.from.getPersonalColorHue();
        };
        Connection.prototype.increase = function () {
            this.opacity += 0.1;
            if (this.opacity > 1) {
                this.opacity = 1;
            }
        };
        Connection.prototype.decrease = function () {
            this.opacity -= 0.1;
            if (this.opacity < 0) {
                this.opacity = 0;
            }
        };
        Connection.prototype.isNone = function () {
            return this.opacity === 0;
        };
        Connection.prototype.draw = function () {
            X.save();
            X.globalAlpha = this.opacity * Connection.globalOpacity;
            X.strokeStyle = "hsl(" + this.colorHue + ", 100%, 50%)";
            X.beginPath();
            X.moveTo(this.from.x * width, this.from.y * height);
            X.lineTo(this.to.x * width, this.to.y * height);
            X.stroke();
            X.restore();
        };
        Connection.globalOpacity = 0.7;
        return Connection;
    }());
    var Point = /** @class */ (function () {
        function Point() {
            this.x = Math.random();
            this.y = Math.random();
            this.vx = 0;
            this.vy = 0;
            this.colorHue = Math.random() * 360;
            this.connections = [];
            this.unownedConnections = [];
        }
        Point.prototype.addConnection = function (newConnection) {
            for (var _i = 0, _a = this.unownedConnections; _i < _a.length; _i++) {
                var connection = _a[_i];
                connection.colorHue = newConnection.colorHue;
            }
            for (var _b = 0, _c = this.connections; _b < _c.length; _b++) {
                var connection = _c[_b];
                connection.colorHue = newConnection.colorHue;
            }
            this.unownedConnections.push(newConnection);
        };
        Point.prototype.getFirstConnection = function () {
            return this.connections[0] || this.unownedConnections[0];
        };
        Point.prototype.getConnectionColorHue = function () {
            var connection = this.getFirstConnection();
            if (connection) {
                return connection.colorHue;
            }
            else {
                return null;
            }
        };
        Point.prototype.getPersonalColorHue = function () {
            return this.colorHue;
        };
        Point.prototype.tick = function () {
            this.physic();
            this.changeDirIfOutOfBounds();
            this.updateVelocityByConnection();
            this.updateUnownedConnections();
        };
        Point.prototype.physic = function () {
            this.vx *= 0.995;
            this.vy *= 0.995;
            this.x += this.vx;
            this.y += this.vy;
        };
        Point.prototype.getFirstConnectionPoint = function () {
            var connection = this.getFirstConnection();
            if (!connection) {
                return;
            }
            if (connection.from === this) {
                return connection.to;
            }
            else {
                return connection.from;
            }
        };
        Point.prototype.updateVelocityByConnection = function () {
            var point = this.getFirstConnectionPoint();
            if (point) {
                var dx = point.x - this.x;
                var dy = point.y - this.y;
                var ang = Math.atan2(dy, dx);
                var dist = this.distanceTo(point);
                if (dist < Point.personalSpace) {
                    this.vx -= Math.cos(ang) * 0.001 * (Point.personalSpace - dist);
                    this.vy -= Math.sin(ang) * 0.001 * (Point.personalSpace - dist);
                }
                else {
                    this.vx += Math.cos(ang) * 0.00004;
                    this.vy += Math.sin(ang) * 0.00004;
                }
            }
            else {
                this.vx /= 0.995;
                this.vy /= 0.995;
            }
        };
        Point.prototype.updateUnownedConnections = function () {
            for (var i = this.unownedConnections.length - 1; i >= 0; i--) {
                var connection = this.unownedConnections[i];
                if (connection.isNone()) {
                    this.unownedConnections.splice(i, 1);
                }
            }
        };
        Point.prototype.changeDirIfOutOfBounds = function () {
            if (this.x < 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx);
            }
            else if (this.x > 1) {
                this.x = 1;
                this.vx = -Math.abs(this.vx);
            }
            if (this.y < 0) {
                this.y = 0;
                this.vy = Math.abs(this.vy);
            }
            else if (this.y > 1) {
                this.y = 1;
                this.vy = -Math.abs(this.vy);
            }
        };
        Point.prototype.draw = function () {
            X.beginPath();
            X.arc(this.x * width, this.y * height, 4, 0, Math.PI * 2);
            X.fill();
        };
        Point.prototype.drawLineTo = function (point) {
            if (this.distanceTo(point) < Point.minDistLine) {
                this.increaseConnectionAndDraw(point);
            }
            else {
                this.reduceConnectionAndDraw(point);
            }
        };
        Point.prototype.distanceTo = function (point) {
            var dx = this.x - point.x;
            var dy = this.y - point.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        Point.prototype.increaseConnectionAndDraw = function (point) {
            var connection = this.getConnectionWith(point) || this.createConnectionWith(point);
            connection.increase();
            connection.draw();
        };
        Point.prototype.reduceConnectionAndDraw = function (point) {
            var connection = this.getConnectionWith(point);
            if (connection) {
                connection.decrease();
                connection.draw();
                if (connection.isNone()) {
                    this.removeConnection(connection);
                }
            }
        };
        Point.prototype.createConnectionWith = function (point) {
            var connection = new Connection(this, point);
            this.connections.push(connection);
            point.addConnection(connection);
            return connection;
        };
        Point.prototype.removeConnection = function (connection) {
            this.connections.splice(this.connections.indexOf(connection), 1);
        };
        Point.prototype.getConnectionWith = function (point) {
            for (var _i = 0, _a = this.connections; _i < _a.length; _i++) {
                var connection = _a[_i];
                if (connection.to === point) {
                    return connection;
                }
            }
            return null;
        };
        Point.minDistLine = 0.2;
        Point.personalSpace = Point.minDistLine - 0.0075;
        return Point;
    }());
    var Cursor = /** @class */ (function (_super) {
        __extends(Cursor, _super);
        function Cursor() {
            return _super.call(this) || this;
        }
        Cursor.prototype.draw = function () { return; };
        Cursor.prototype.tick = function () {
            this.physic();
            this.changeDirIfOutOfBounds();
            this.updateUnownedConnections();
        };
        return Cursor;
    }(Point));
    var canvas = document.getElementById("backgroundCanvas");
    var X = canvas.getContext("2d");
    if (!X) {
        return;
    }
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var points = [];
    initPoints();
    addCursor();
    reqanf();
    function initPoints() {
        for (var i = 0; i < NUMBER_OF_POINTS; i++) {
            points.push(new Point());
        }
    }
    function addCursor() {
        var cursor = new Cursor();
        points.push(cursor);
        addEventListener("mousemove", function (e) {
            cursor.x = e.clientX / width;
            cursor.y = e.clientY / height;
        });
    }
    function reqanf() {
        updateCanvasSize();
        updatePoints();
        drawPoints();
        requestAnimationFrame(reqanf);
    }
    function updateCanvasSize() {
        var dpr = window.devicePixelRatio || 1;
        if (width !== innerWidth || height !== innerHeight) {
            canvas.width = width = innerWidth * dpr;
            canvas.height = height = innerHeight * dpr;
        }
    }
    function updatePoints() {
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var point = points_1[_i];
            point.tick();
        }
    }
    function drawPoints() {
        X.clearRect(0, 0, width, height);
        X.fillStyle = "#dddebc";
        X.strokeStyle = "#dddebc";
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            point.draw();
            for (var j = i + 1; j < points.length; j++) {
                var otherPoint = points[j];
                point.drawLineTo(otherPoint);
            }
        }
    }
    console.log(points);
}());
