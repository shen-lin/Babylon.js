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
    ShaderMaterial, 
    Texture, 
    ShadowDepthWrapper, 
    ShaderLanguage, 
    ShaderStore
}  from "@dev/core";
import {  Scene } from "@dev/core";

let time = 0;

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


    ShaderStore.ShadersStoreWGSL["floatingBoxVertexShader"] = `
    #include<sceneUboDeclaration>
    #include<meshUboDeclaration>
    #include<instancesDeclaration>

    attribute position: vec3<f32>;
    attribute uv: vec2<f32>;
    attribute normal: vec3<f32>;
    
    uniform time: f32;

    varying vUV: vec2<f32>;

    @vertex
    fn main(input: VertexInputs) -> FragmentInputs {
        #include<instancesVertex>
        vertexOutputs.vUV = input.uv;
    
        var p : vec4<f32> = vec4<f32>(input.position, 1.0);
    
        var m : f32 = (p.x + p.z + p.y) / 3.0;
    
        m = m * p.y;
    
        p.x = p.x + m * sin(2.0 * uniforms.time);
        p.y = p.y + m * sin(-3.0 * uniforms.time);
        p.z = p.z + m * cos(5.0 * uniforms.time);
    
        p = mesh.world * p;
    
        vertexOutputs.position = scene.viewProjection * p;
    }`;

    ShaderStore.ShadersStoreWGSL["floatingBoxFragmentShader"] = `
    varying vUV: vec2<f32>;
    var textureSampler: texture_2d<f32>;
    
    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
        fragmentOutputs.color = vec4(0.5, 0.4, 0.8, 1.0); // = textureSample(textureSampler, input.vUV);
    }`;

    const shaderMaterial = new ShaderMaterial("shader", scene, {
    vertex: "floatingBox",
    fragment: "floatingBox",
    },
    {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "view", "projection", "viewProjection", "time"],
        samplers: ["textureSampler"],
        uniformBuffers: ["Mesh", "Scene"],
        shaderLanguage: ShaderLanguage.WGSL
    });

    shaderMaterial.setTexture("textureSampler", new Texture("https://playground.babylonjs.com/textures/crate.png", scene));

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
