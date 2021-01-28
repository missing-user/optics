var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


function Ray(source, direction = [1, 1]) {
    this.source = source
    this.direction = direction
    this.bounces = []
}

function Laser(p1, p2 = [0, 0]) {
    this.p1 = p1
    this.p2 = p2
    Object.defineProperty(this, 'normal', {
        get: function () {
            v = [this.p1[0] - this.p2[0], this.p1[1] - this.p2[1]]
            if (v[1] == 0)
                if (v[0] < 0)
                    return [0, -1]
                else
                    return [0, 1]
            if (v[1] > 0)
                return [-1, v[0] / v[1]]

            return [1, -v[0] / v[1]]
        }
    })
    this.createRays = function (density) {
        v = [p1[0] - p2[0], p1[1] - p2[1]]
        vLength = Math.sqrt(v[0] ** 2 + v[1] ** 2)
        v[0] /= vLength
        v[1] /= vLength
        for (let n = 0; n < vLength / density; n++) {
            rays.push(new Ray([
                this.p1[0] - n * v[0] * density / vLength,
                this.p1[1] - n * v[1] * density / vLength],
                this.normal))
        }

    }
}

function Mirror(p1, p2 = [0, 0]) {
    this.p1 = p1
    this.p2 = p2
}

function Lens(p1, p2 = [0, 0], focalpoint = 300) {
    Mirror.call(this, p1, p2) //inherits from mirror
    this.focalpoint = focalpoint
    Object.defineProperty(this, 'rotation', {
        get: () => {
            return Math.atan2(this.p1[1] - this.p2[1], this.p1[0] - this.p2[0])
        }
    })
    Object.defineProperty(this, 'radius', {
        get: () => {
            return Math.sqrt((this.p1[0] - this.p2[0]) ** 2 + (this.p1[1] - this.p2[1]) ** 2) / 4
        }
    })
    Object.defineProperty(this, 'midpoint', {
        get: () => {
            return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
        }
    })
}

var mirrors = []
var lights = []
var rays = []

function updateSim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    traceAll()
    drawRays()
    drawLights()
    drawMirrors()
}

function drawRays() {
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = primaryColor
    for (ray of rays) {
        ctx.moveTo(ray.source[0], ray.source[1])
        for (bounce of ray.bounces) {
            ctx.lineTo(bounce[0], bounce[1])
        }
    }
    ctx.stroke()
}


function drawMirrors() {
    ctx.lineWidth = 3
    ctx.strokeStyle = secondaryColor
    ctx.fillStyle = primaryColor
    for (mirror of mirrors) {
        if (mirror instanceof Lens) {
            ctx.save()
            ctx.beginPath()

            ctx.globalAlpha = 0.4
            ctx.ellipse(mirror.midpoint[0], mirror.midpoint[1],
                2 * mirror.radius, mirror.radius / 10,
                mirror.rotation, 0, 2 * Math.PI)

            ctx.fill()
            ctx.restore()
            ctx.stroke()
        } else {
            ctx.beginPath()
            ctx.moveTo(mirror.p1[0], mirror.p1[1])
            ctx.lineTo(mirror.p2[0], mirror.p2[1])
            ctx.stroke()
        }
    }
}

function drawLights() {
    ctx.beginPath()
    ctx.lineWidth = 3
    ctx.strokeStyle = primaryColor
    for (light of lights) {
        ctx.moveTo(light.p1[0], light.p1[1])
        ctx.lineTo(light.p2[0], light.p2[1])
    }
    ctx.stroke()
}

function updateLights() {
    rays = []
    density = Math.sqrt(document.getElementById("densityslider").value)
    density = Math.max(0.5, density)
    for (light of lights) {
        light.createRays(density)
    }
}

function traceAll() {
    for (const ray of rays) {
        ray.bounces = recursiveRaytrace(ray.source, ray.direction, 1024)
    }
}


function recursiveRaytrace(position, direction, remainingBounces, bounces = []) {
    if (remainingBounces > 0) {
        var intersection = {}
        intersection.dist = Infinity
        intersection.dir = direction
        for (mirror of mirrors) {
            const res = lineIntersects(position, direction, mirror)
            if (res.dist < intersection.dist && res.dist > 1e-2) {
                intersection = res
            }
        }
        if (intersection.dist < Infinity) {
            bounces.push(intersection.p)
            return recursiveRaytrace(intersection.p, intersection.dir, remainingBounces - 1, bounces)
        }
    } else {
        return bounces
    }
    bounces.push([position[0] + direction[0] * 1e6, position[1] + direction[1] * 1e6])
    return bounces
}

function lineIntersects(rayOrigin, direction, mirror) {
    //transform the light ray to be at the origin
    s1 = vSub(mirror.p1, rayOrigin)
    s2 = vSub(mirror.p2, rayOrigin)
    a = direction[1] / direction[0] //slope of the ray
    b = (s2[1] - s1[1]) / (s2[0] - s1[0]) //slope of the mirror

    //TODO: slopes may be infinite, fix this
    if (a == b) //parallel lines
        return { p: false, dist: Infinity, dir: direction }
    c = s1[1] - b * s1[0] //y offset of the mirror line

    xres = c / (a - b)
    yres = a * xres

    if (!isFinite(b)) { //vertical mirror
        xres = s1[0]
        yres = a * s1[0]
    }
    if (direction[0] == 0) { //vertical ray
        xres = 0
        yres = c
    }
    //check if line is within mirror bounds
    if (xres <= Math.max(s1[0], s2[0]) && xres >= Math.min(s1[0], s2[0]))
        if (yres <= Math.max(s1[1], s2[1]) && yres >= Math.min(s1[1], s2[1]))
            if (Math.sign(xres) == Math.sign(direction[0]) && Math.sign(yres) == Math.sign(direction[1])) {
                normal = (b == 0) ? [0, 1] : [1, -1 / b]
                intersectionPoint = [xres + rayOrigin[0], yres + rayOrigin[1]]
                return {
                    p: intersectionPoint, //intersection point
                    dist: (xres ** 2 + yres ** 2), //squared distance
                    dir: mirror instanceof Lens ?
                        transmissionDirection(direction, vSub(rayOrigin, [-xres, -yres]), mirror) :
                        linearReflection(direction, normal)
                }
            }

    return { p: false, dist: Infinity, dir: direction }
}

function transmissionDirection(direction, intersection, lens) {
    v = vSub(lens.midpoint, intersection)
    v2 = vSub(lens.p2, intersection)
    r = length(v)

    gamma = Math.PI / 2 - Math.atan2(v2[1], v2[0])
    alpha = Math.atan2(direction[1], direction[0]) - gamma
    alpha = alpha % (2 * Math.PI)

    if (Math.sign(v[0] * v2[0]) > 0 || Math.sign(v[1] * v2[1]) >= 0)
        r = -r
    //ctx.fillStyle = secondaryColor
    //ctx.font = "20px Arial"
    //ctx.fillText(Math.round(alpha * 180 / Math.PI), intersection[0], intersection[1])
    return [Math.cos(alpha + gamma - r / lens.focalpoint), Math.sin(alpha + gamma - r / lens.focalpoint)]
}

function sphericReflection(direction, intersection, lens) {
    v = [lens.midpoint[0] - intersection[0], lens.midpoint[1] - intersection[1]]
    return [-direction[0] + v[1] / lens.focalpoint, -direction[1] + v[0] / lens.focalpoint]
}

function linearReflection(direction, normal) {
    normalSquared = normal[0] ** 2 + normal[1] ** 2
    dot = direction[0] * normal[0] + direction[1] * normal[1]
    dot /= normalSquared
    return [direction[0] - 2 * dot * normal[0], direction[1] - 2 * dot * normal[1]]
}

function clearAll() {
    lights = []
    rays = []
    mirrors = []
    updateSim()
}

function vSub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]]
}

function length(vector) {
    return Math.sqrt(vector[0] ** 2 + vector[1] ** 2)
}