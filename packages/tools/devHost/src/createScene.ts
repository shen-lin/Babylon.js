/* eslint-disable-next-line import/no-internal-modules */
import { engine, canvas } from "./index";
import "@dev/loaders";
import "@tools/node-editor";
import "@tools/node-geometry-editor";
import * as GUIEditor from "@tools/gui-editor";
import { Inspector, InjectGUIEditor } from "@dev/inspector";
import { 
    ArcRotateCamera, 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3, 
    SpotLight,
    ShadowGenerator, 
    Effect, 
    ShaderMaterial, 
    Texture, 
    ShadowDepthWrapper, 
    // ShaderLanguage 
}  from "@dev/core";
import {  Scene,  } from "@dev/core";

let time = 0;

export const createScene = async function () {
    const scene = new Scene(engine);
    // scene.createDefaultCameraOrLight(true);

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


    Effect.ShadersStore["floatingBoxVertexShader"] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    #include<__decl__sceneVertex>
    #include<__decl__meshVertex>

    uniform float time;

    varying vec2 vUV;

    void main(void) {
        vUV = uv;

        vec4 p = vec4(position, 1.0);

        float m = (p.x + p.z + p.y) / 3.;

        m = m * p.y;

        p.x = p.x + m * sin(2.0 * time);
        p.y = p.y + m * sin(-3.0 * time);
        p.z = p.z + m * cos(5.0 * time);

        p = world * p;

        vec3 normalW = normalize(mat3(world) * normal);

        #define SHADOWDEPTH_NORMALBIAS

        gl_Position = projection * view * p;
    }`;

    Effect.ShadersStore["floatingBoxFragmentShader"] = `
    precision highp float;

    varying vec2 vUV;
    uniform sampler2D textureSampler;

    void main(void) {

    }`;

    const shaderMaterial = new ShaderMaterial("shader", scene, {
    vertex: "floatingBox",
    fragment: "floatingBox",
    },
    {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "view", "projection", "time"],
        samplers: ["textureSampler"],
        uniformBuffers: ["Mesh", "Scene"],
        // shaderLanguage: ShaderLanguage.WGSL
    });

    shaderMaterial.setTexture("textureSampler", new Texture("textures/crate.png", scene));

    shaderMaterial.shadowDepthWrapper = new ShadowDepthWrapper(shaderMaterial, scene, {
        remappedVariables: ["worldPos", "p", "vNormalW", "normalW", "alpha", "1."],
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
