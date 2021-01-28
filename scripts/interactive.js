var isDrawStart = false;
var drawMode = 'lasers'
var activeObject

const getClientOffset = (event) => {
    var rect = canvas.getBoundingClientRect();
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
    }
    isDrawStart = true;
}

const mouseMoveListener = (event) => {
    event.preventDefault();
    if (!isDrawStart) return

    lineCoordinates = getClientOffset(event)
    activeObject.p2[0] = lineCoordinates.x
    activeObject.p2[1] = lineCoordinates.y

    if (drawMode == 'lasers')
        updateLights()
    updateSim()
}

const mouseupListener = (event) => {
    isDrawStart = false
}

canvas.addEventListener('mousedown', mouseDownListener)
canvas.addEventListener('mousemove', mouseMoveListener)
canvas.addEventListener('mouseup', mouseupListener)

canvas.addEventListener('touchstart', mouseDownListener)
canvas.addEventListener('touchmove', mouseMoveListener)
canvas.addEventListener('touchend', mouseupListener)