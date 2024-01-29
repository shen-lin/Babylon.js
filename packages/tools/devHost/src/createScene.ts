/* eslint-disable-next-line import/no-internal-modules */
import { engine, canvas } from "./index";
import "@dev/loaders";
import "@tools/node-editor";
import "@tools/node-geometry-editor";
import * as GUIEditor from "@tools/gui-editor";
import { Inspector, InjectGUIEditor } from "@dev/inspector";
import { 
    Scene,
    ArcRotateCamera, 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3, 
    SpotLight,
    ShadowGenerator,
    ShaderMaterial, 
    Texture, 
    ShadowDepthWrapper,
    ShaderLanguage,
}  from "@dev/core";
import { loadShader } from "./shaderLoader";

let time = 0;
const shaderLanguage = ShaderLanguage.WGSL;

export const createScene = async function () {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("Camera", 0, 0.8, 90, Vector3.Zero(), scene);
	camera.lowerBetaLimit = 0.1;
	camera.upperBetaLimit = (Math.PI / 2) * 0.9;
	camera.lowerRadiusLimit = 1;
	camera.upperRadiusLimit = 150;
	camera.attachControl(canvas, true);
    camera.setPosition(new Vector3(-20, 11, -20));

    const light = new SpotLight("spotLight", new Vector3(-40, 40, -40), new Vector3(1, -1, 1), Math.PI / 5, 30, scene);
	light.position = new Vector3(-40, 40, -40);
	const shadowGenerator = new ShadowGenerator(1024, light);


    const ground = MeshBuilder.CreateGround("ground", {width: 200, height: 200, subdivisions:100}, scene);
    const groundMaterial = new StandardMaterial("ground", scene);	
	groundMaterial.specularColor = new Color3(0, 0, 0);
	ground.material = groundMaterial;


    const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 3}, scene);
	sphere.position.y = 5;
	sphere.position.x = -7;
	sphere.position.z = -1;

    shadowGenerator.addShadowCaster(sphere);
    sphere.receiveShadows = true;
    ground.receiveShadows = true;


    loadShader(shaderLanguage);
    
    const shaderMaterial = new ShaderMaterial("shader", scene, {
    vertex: "floatingBox",
    fragment: "floatingBox",
    },
    {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "view", "projection", "viewProjection", "time"],
        samplers: ["textureSampler"],
        uniformBuffers: ["Mesh", "Scene"],
        shaderLanguage
    });

    shaderMaterial.setTexture("textureSampler", new Texture("https://playground.babylonjs.com/textures/crate.png", scene));

    shaderMaterial.shadowDepthWrapper = new ShadowDepthWrapper(shaderMaterial, scene, {
        remappedVariables: ["worldPos", "p", "vNormalW", "normalW", "alpha", "1."],
        doNotInjectCode: true
    });
    shaderMaterial.onBindObservable.add((m) => { 
        shaderMaterial.getEffect().setFloat("time", time);
    });
    sphere.material = shaderMaterial;


    scene.onBeforeRenderObservable.add(() => {
        time += 1 / 60 / 2;
    });

    InjectGUIEditor(GUIEditor);
    Inspector.Show(scene, {});
    return scene;
};
