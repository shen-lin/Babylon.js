import type { Scene } from "@dev/core";
import { WebGPUEngine } from "@dev/core"; // can also be @lts/core
import { createScene as createSceneTS } from "./createScene";
import { createScene as createSceneJS } from "./createSceneJS.js";

const useJavascript = false;

const createScene = useJavascript ? createSceneJS : createSceneTS;

export const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
// export const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine
export const engine = new WebGPUEngine(canvas);
engine.initAsync().then(() => {
    // avoid await on main level
    const createSceneResult = createScene();
    if (createSceneResult instanceof Promise) {
        createSceneResult.then(function (result) {
            scene = result;
        });
    } else {
        scene = createSceneResult;
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene && scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine && engine.resize();
    });
});
let scene: Scene;
