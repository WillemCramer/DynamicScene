var createScene = function () {
    //========================================
    var scene = new BABYLON.Scene(engine);

    // Create a camera
    var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Create a light
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);



    const punchingBall = {
        name: "punching ball",
        mesh: new BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }), // Placeholder for the sphere mesh

        init: function () {
            this.animate(3000, -8, 25)
        },

        animate: function (startVal, endVal, frameRate) {
            var animation = new BABYLON.Animation("animation", "position.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_YOYO);
            var keys = [];
            keys.push({ frame: 0, value: startVal });
            keys.push({ frame: 100, value: endVal });
            animation.setKeys(keys);
            this.mesh.animations = [animation];
            scene.beginAnimation(this.mesh, 0, 100, true);
        }
    }

    punchingBall.init();

    return scene;
};
