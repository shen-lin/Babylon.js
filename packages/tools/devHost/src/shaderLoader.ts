import { Effect, ShaderLanguage, ShaderStore } from "@dev/core";

export function loadShader(shaderLanguage: ShaderLanguage) {
    if (shaderLanguage === ShaderLanguage.GLSL) {
        loadGlslShader();
    } else {
        loadWgslShader();
    }
}

function loadGlslShader() {
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
}

function loadWgslShader() {
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
      #define SHADOWDEPTH_NORMALBIAS
      vertexOutputs.position = scene.viewProjection * p;
  }`;

    ShaderStore.ShadersStoreWGSL["floatingBoxFragmentShader"] = `
  varying vUV: vec2<f32>;
  var textureSampler: texture_2d<f32>;
  
  @fragment
  fn main(input: FragmentInputs) -> FragmentOutputs {

  }`;
}

