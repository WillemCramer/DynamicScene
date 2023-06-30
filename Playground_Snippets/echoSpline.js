const createScene = () => {
    // =============== FUNCTIONS ===============
    const setNewPoints = function () {
        let myPoints = [];
        for (let i = 0; i < amount; i++) {
            myPoints.push(new BABYLON.Vector3.Random())
        }
        return myPoints;
    };
    const setDestination = function () {
        let pDest = [];
        for (let i = 0; i < amount; i++) {
            pDest.push(new BABYLON.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1));
        }
        return pDest
    }
    //-----------------------------------
    function createDestinationCurve() {
        var destPoints = setDestination();
        var destCurve = BABYLON.Curve3.CreateCatmullRomSpline(destPoints, sampling, true);
        var destSpline = BABYLON.MeshBuilder.CreateLines("destSpline", {
            points: destCurve.getPoints(),
            updatable: true
        }, scene);
        var destVertices = destSpline.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        destSpline.dispose();
        return destVertices;
    };
    //-----------------------------------
    function setColors(amount) {
        let tmp = [];
        let t = 0;
        for (let i = 0; i < amount; i++) {
            let hue = t;
            tmp[i] = new BABYLON.Color3.FromHSV(hue, 1, 1);
            tmp[i] = new BABYLON.Color4(tmp[i].r, tmp[i].g, tmp[i].b, 0); // Set alpha value to 0
            t += 360 / amount;
        }
        tmp.push(tmp[0]);
        return tmp;
    }
    //-----------------------------------
    const ease = new BABYLON.BezierCurveEase(.65, .39, .26, .54);
    function zLerp(start, end, value) {
        var tMod = ease.easeInCore(value);
        var result = start + (end - start) * tMod;
        return result;
    }
    //--------------------------------------
    class EchoBuffer {
        constructor(mesh, echoes) {
            this.mesh = mesh;
            this.clones = [];
            this.maxClones = echoes;
            this.alpha = Math.sin(2 * Math.PI / this.maxClones);
            // this.initClones(mesh);
            // this.clonesVisibility();
        }

        // initClones(mesh) {
        //     for (let i = 0; i < this.maxClones; i++) {
        //         this.clones[i] = this.createClone(mesh);
        //     }
        // }

        // clonesVisibility() {
        //     for (let i = 0; i < this.clones.length; i++) {
        //         const colors = this.clones[i].getVerticesData(BABYLON.VertexBuffer.ColorKind);

        //         for (let j = 0; j < colors.length; j += 4) {
        //             colors[j + 3] = this.alpha; // Update the alpha value
        //         }

        //         this.clones[i].setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        //     }
        // }

        update(mesh) {
            const clone = this.createClone(mesh);
            this.clones.unshift(clone);

            if (this.clones.length > this.maxClones) {
                const lastClone = this.clones.pop();
                lastClone.dispose();
            }
            // this.clonesVisibility();
        }

        createClone(mesh) {
            const clone = new BABYLON.MeshBuilder.CreateLines("echoSpline", {
                points: convertToVector3(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)),
                colors: convertToColor4setAlpha(mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind), this.alpha),
                updatable: false,
            });
            return clone;
        }
    }
    //======================================
    //======================================
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Vector4(0, 0, 0, 1);
    const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 4, BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 0));
    console.clear();

    var amount = 5;
    const sampling = 17;
    var points = [];
    points = setNewPoints();

    var curve = new BABYLON.Curve3.CreateCatmullRomSpline(points, sampling, true);
    const splineColors = setColors(amount * sampling);

    spline = new BABYLON.MeshBuilder.CreateLines("catmullSpline", {
        points: curve.getPoints(),
        colors: splineColors,
        updatable: true
    });

    var pStart = spline.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var pEnd = [];
    pEnd = createDestinationCurve();
    tPoints = [];
    //echoBuffer = [];
    const echoBuffer = new EchoBuffer(spline, 111);

    var step = 0;
    var max = 123;

    scene.registerBeforeRender(function () {
        //===== stuff
        if (step < max) {
            let t = step / max;
            for (let i = 0; i < pStart.length; i++) {
                tPoints[i] = zLerp(pStart[i], pEnd[i], t);
            }
            spline.setVerticesData(BABYLON.VertexBuffer.PositionKind, tPoints);
            // console.log(spline);
        } else {
            step = 0;
            pStart = pEnd;
            pEnd = createDestinationCurve();
        }
        step++;
        echoBuffer.update(spline);
    });

    return scene;
};
//====================================
//====================================
function convertToVector3(flatArray) {
    const vector3Array = [];
    for (let i = 0; i < flatArray.length; i += 3) {
        const x = flatArray[i];
        const y = flatArray[i + 1];
        const z = flatArray[i + 2];
        const vector3 = new BABYLON.Vector3(x, y, z);
        vector3Array.push(vector3);
    }
    return vector3Array;
}
// function convertToColor4(flatArray) {
//     const color4Array = [];
//     for (let i = 0; i < flatArray.length; i += 4) {
//         const r = flatArray[i];
//         const g = flatArray[i + 1];
//         const b = flatArray[i + 2];
//         const a = flatArray[i + 3];
//         const color4 = new BABYLON.Color4(r, g, b, a);
//         color4Array.push(color4);
//     }
//     return color4Array;
// }

function convertToColor4setAlpha(flatArray, alpha) {
    const color4Array = [];
    for (let i = 0; i < flatArray.length; i += 4) {
        const r = flatArray[i];
        const g = flatArray[i + 1];
        const b = flatArray[i + 2];
        const a = alpha;
        const color4 = new BABYLON.Color4(r, g, b, a);
        color4Array.push(color4);
    }
    return color4Array;
}
