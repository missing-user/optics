var isDrawStart = false;
var drawMode = Laser;
var activeObject;

const getClientOffset = (event) => {
  var rect = canvas.getBoundingClientRect();
  if (event.touches) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top,
    };
  } else {
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
};

const mouseDownListener = (event) => {
  activeObject = new drawMode([
    getClientOffset(event).x,
    getClientOffset(event).y,
  ]);
  if (drawMode == Laser) lights.push(activeObject);
  else mirrors.push(activeObject);
  opticsHistory.push(activeObject);
  isDrawStart = true;
};

const mouseMoveListener = (event) => {
  //event.preventDefault();
  if (!isDrawStart) return;
  lineCoordinates = getClientOffset(event);
  if (event.shiftKey) {
    //activate snapping
    diffx = Math.abs(activeObject.p1[0] - lineCoordinates.x);
    diffy = Math.abs(activeObject.p1[1] - lineCoordinates.y);
    diffDiag = Math.abs(diffx - diffy);
    if (diffDiag < diffx && diffDiag < diffy) {
      activeObject.p2[0] = lineCoordinates.x;
      activeObject.p2[1] =
        activeObject.p1[1] +
        diffx * Math.sign(lineCoordinates.y - activeObject.p1[1]);
    } else if (diffx < diffy) {
      activeObject.p2[0] = activeObject.p1[0];
      activeObject.p2[1] = lineCoordinates.y;
    } else {
      activeObject.p2[0] = lineCoordinates.x;
      activeObject.p2[1] = activeObject.p1[1];
    }
  } else {
    activeObject.p2[0] = lineCoordinates.x;
    activeObject.p2[1] = lineCoordinates.y;
  }
  activeObject.valid = true;
  updateFocal();
  updateSim();
};

function updateFocal() {
  if ("focalpoint" in activeObject)
    activeObject.focalpoint = document.getElementById("focalDistance").value;
}

const mouseupListener = (event) => {
  if (lights.length > 0) if (!lights[lights.length - 1].valid) lights.pop();
  if (mirrors.length > 0) if (!mirrors[mirrors.length - 1].valid) mirrors.pop();
  isDrawStart = false;
};

window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateSim();
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.addEventListener("mousedown", mouseDownListener);
document.addEventListener("mousemove", mouseMoveListener);
document.addEventListener("mouseup", mouseupListener);

document.addEventListener("touchstart", mouseDownListener);
document.addEventListener("touchmove", mouseMoveListener);
document.addEventListener("touchend", mouseupListener);

document.getElementById("safeZone").addEventListener("mousedown", stopProp);
document.getElementById("safeZone").addEventListener("touchstart", stopProp);

function stopProp(ev) {
  ev.stopPropagation();
}

lights = [new Laser([100, 300], [100, 700])];
lights[0].valid = true;
mirrors = [
  new Mirror([350, 300], [150, 500]),
  new Lens([135, 250], [365, 250], 200),
];
mirrors[0].valid = true;

updateSim();
