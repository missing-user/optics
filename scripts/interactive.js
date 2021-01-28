var isDrawStart = false;
var drawMode = 'lasers'
var activeObject

const getClientOffset = (event) => {
    var rect = canvas.getBoundingClientRect()
    if (event.touches) {
        return {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        }
    } else {
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }
}

const mouseDownListener = (event) => {
    switch (drawMode) {
        case 'mirrors':
            activeObject = new Mirror([getClientOffset(event).x, getClientOffset(event).y])
            mirrors.push(activeObject)
            break
        default:
        case 'lasers':
            activeObject = new Laser([getClientOffset(event).x, getClientOffset(event).y])
            lights.push(activeObject)
            break
        case 'lenses':
            activeObject = new Lens([getClientOffset(event).x, getClientOffset(event).y])
            mirrors.push(activeObject)
            break
        case 'parabolas':
            activeObject = new ParabolicMirror([getClientOffset(event).x, getClientOffset(event).y])
            mirrors.push(activeObject)
            break
        case 'blockers':
            activeObject = new Block([getClientOffset(event).x, getClientOffset(event).y])
            mirrors.push(activeObject)
            break
    }
    isDrawStart = true
}

const mouseMoveListener = (event) => {
    //event.preventDefault();
    if (!isDrawStart) return
    lineCoordinates = getClientOffset(event)
    if (event.shiftKey) {
        //activate snapping
        diffx = Math.abs(activeObject.p1[0] - lineCoordinates.x)
        diffy = Math.abs(activeObject.p1[1] - lineCoordinates.y)
        diffDiag = Math.abs(diffx - diffy)
        if (diffDiag < diffx && diffDiag < diffy) {
            activeObject.p2[0] = lineCoordinates.x
            activeObject.p2[1] = activeObject.p1[1] + diffx * Math.sign(lineCoordinates.y - activeObject.p1[1])
        } else if (diffx < diffy) {
            activeObject.p2[0] = activeObject.p1[0]
            activeObject.p2[1] = lineCoordinates.y
        } else {
            activeObject.p2[0] = lineCoordinates.x
            activeObject.p2[1] = activeObject.p1[1]
        }
    } else {
        activeObject.p2[0] = lineCoordinates.x
        activeObject.p2[1] = lineCoordinates.y
    }
    activeObject.valid = true
    if (activeObject instanceof Lens || activeObject instanceof ParabolicMirror) {
        activeObject.focalpoint = document.getElementById("focalDistance").value
    }
    updateLights()
    updateSim()
}

const mouseupListener = (event) => {
    if (lights.length > 0)
        if (!lights[lights.length - 1].valid)
            lights.pop()
    if (mirrors.length > 0)
        if (!mirrors[mirrors.length - 1].valid)
            mirrors.pop()
    isDrawStart = false
}


window.addEventListener('resize', function (event) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    updateLights()
    updateSim()
})

canvas.width = window.innerWidth
canvas.height = window.innerHeight

document.addEventListener('mousedown', mouseDownListener)
document.addEventListener('mousemove', mouseMoveListener)
document.addEventListener('mouseup', mouseupListener)

document.addEventListener('touchstart', mouseDownListener)
document.addEventListener('touchmove', mouseMoveListener)
document.addEventListener('touchend', mouseupListener)

document.getElementById('safeZone').addEventListener('mousedown', stopProp)
document.getElementById('safeZone').addEventListener('touchstart', stopProp)

function stopProp(ev) {
    ev.stopPropagation()
}