(function () {

    const NUMBER_OF_POINTS = 25;

    class Connection {
        protected static globalOpacity: number = 0.7;
        public opacity: number;
        public colorHue: number;

        constructor(
            public from: Point,
            public to: Point
        ) {
            this.opacity = 0;
            this.colorHue = this.getColorHue();
        }

        protected getColorHue(): number {
            return this.from.getConnectionColorHue() || this.to.getConnectionColorHue() || this.from.getPersonalColorHue();
        }

        public increase() {
            this.opacity += 0.1;

            if (this.opacity > 1) {
                this.opacity = 1;
            }
        }

        public decrease() {
            this.opacity -= 0.1;

            if (this.opacity < 0) {
                this.opacity = 0;
            }
        }

        public isNone() {
            return this.opacity === 0;
        }

        public draw() {
            X.save();
            X.globalAlpha = this.opacity * Connection.globalOpacity;
            X.strokeStyle = `hsl(${this.colorHue}, 100%, 50%)`;

            X.beginPath();
            X.moveTo(this.from.x * width, this.from.y * height);
            X.lineTo(this.to.x * width, this.to.y * height);
            X.stroke();

            X.restore();
        }
    }

    class Point {
        protected static minDistLine = 0.2;
        protected static personalSpace = Point.minDistLine - 0.0075;

        public x: number;
        public y: number;

        protected colorHue: number;

        protected vx: number;
        protected vy: number;

        protected connections: Connection[];
        protected unownedConnections: Connection[];

        constructor() {
            this.x = Math.random();
            this.y = Math.random();

            this.vx = 0;
            this.vy = 0;

            this.colorHue = Math.random() * 360;

            this.connections = [];
            this.unownedConnections = [];
        }

        public addConnection(newConnection: Connection) {
            for (const connection of this.unownedConnections) {
                connection.colorHue = newConnection.colorHue;
            }
            for (const connection of this.connections) {
                connection.colorHue = newConnection.colorHue;
            }

            this.unownedConnections.push(newConnection);
        }

        protected getFirstConnection(): Connection {
            return this.connections[0] || this.unownedConnections[0];
        }

        public getConnectionColorHue() {
            const connection = this.getFirstConnection();

            if (connection) {
                return connection.colorHue;
            } else {
                return null;
            }
        }

        public getPersonalColorHue() {
            return this.colorHue;
        }

        public tick() {
            this.physic();
            this.changeDirIfOutOfBounds();
            this.updateVelocityByConnection();
            this.updateUnownedConnections();
        }

        protected physic() {
            this.vx *= 0.995;
            this.vy *= 0.995;

            this.x += this.vx;
            this.y += this.vy;
        }

        protected getFirstConnectionPoint() {
            const connection = this.getFirstConnection();
            if (!connection) { return; }

            if (connection.from === this) {
                return connection.to;
            } else {
                return connection.from;
            }
        }

        protected updateVelocityByConnection() {
            const point = this.getFirstConnectionPoint();
            if (point) {
                const dx = point.x - this.x;
                const dy = point.y - this.y;
                const ang = Math.atan2(dy, dx);
                const dist = this.distanceTo(point);

                if (dist < Point.personalSpace) {
                    this.vx -= Math.cos(ang) * 0.001 * (Point.personalSpace - dist);
                    this.vy -= Math.sin(ang) * 0.001 * (Point.personalSpace - dist);
                } else {
                    this.vx += Math.cos(ang) * 0.00004;
                    this.vy += Math.sin(ang) * 0.00004;
                }
            } else {
                this.vx /= 0.995;
                this.vy /= 0.995;
            }
        }

        protected updateUnownedConnections() {
            for (let i = this.unownedConnections.length - 1; i >= 0; i--) {
                const connection = this.unownedConnections[i];

                if (connection.isNone()) {
                    this.unownedConnections.splice(i, 1);
                }
            }
        }

        protected changeDirIfOutOfBounds() {
            if (this.x < 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx);
            } else if (this.x > 1) {
                this.x = 1;
                this.vx = -Math.abs(this.vx);
            }

            if (this.y < 0) {
                this.y = 0;
                this.vy = Math.abs(this.vy);
            } else if (this.y > 1) {
                this.y = 1;
                this.vy = -Math.abs(this.vy);
            }
        }

        public draw() {
            X.beginPath();
            X.arc(this.x * width, this.y * height, 4, 0, Math.PI * 2);
            X.fill();
        }

        public drawLineTo(point: Point): void {
            if (this.distanceTo(point) < Point.minDistLine) {
                this.increaseConnectionAndDraw(point);
            } else {
                this.reduceConnectionAndDraw(point);
            }
        }

        protected distanceTo(point: Point): number {
            const dx = this.x - point.x;
            const dy = this.y - point.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        protected increaseConnectionAndDraw(point: Point) {
            const connection = this.getConnectionWith(point) || this.createConnectionWith(point);
            connection.increase();
            connection.draw();
        }

        protected reduceConnectionAndDraw(point: Point) {
            const connection = this.getConnectionWith(point);
            if (connection) {
                connection.decrease();
                connection.draw();

                if (connection.isNone()) {
                    this.removeConnection(connection);
                }
            }
        }

        protected createConnectionWith(point: Point): Connection {
            const connection = new Connection(this, point);
            this.connections.push(connection);
            point.addConnection(connection);
            return connection;
        }

        protected removeConnection(connection: Connection) {
            this.connections.splice(this.connections.indexOf(connection), 1);
        }

        protected getConnectionWith(point: Point): Connection | null {
            for (const connection of this.connections) {
                if (connection.to === point) {
                    return connection;
                }
            }

            return null;
        }
    }

    class Cursor extends Point {
        constructor() {
            super();
        }

        draw() { return; }
        tick() {
            this.physic();
            this.changeDirIfOutOfBounds();
            this.updateUnownedConnections();
        }
    }

    const canvas = document.getElementById("backgroundCanvas") as HTMLCanvasElement;
    const X = canvas.getContext("2d") as CanvasRenderingContext2D;

    if (!X) { return; }

    let width = canvas.width = innerWidth;
    let height = canvas.height = innerHeight;

    const points: Point[] = [];

    initPoints();
    addCursor();
    reqanf();

    function initPoints() {
        for (let i = 0; i < NUMBER_OF_POINTS; i++) {
            points.push(new Point());
        }
    }

    function addCursor() {
        const cursor = new Cursor();
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
        const dpr = window.devicePixelRatio || 1;

        if (width !== innerWidth || height !== innerHeight) {
            canvas.width = innerWidth * dpr;
            canvas.height = innerHeight * dpr;
        }
    }

    function updatePoints() {
        for (const point of points) {
            point.tick();
        }
    }

    function drawPoints() {
        X.clearRect(0, 0, width, height);

        X.fillStyle = "#dddebc";
        X.strokeStyle = "#dddebc";

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            point.draw();

            for (let j = i + 1; j < points.length; j++) {
                const otherPoint = points[j];
                point.drawLineTo(otherPoint);
            }
        }
    }

    console.log(points);

}());