// "Liquid ball" by Avin Lambrero
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Email:avin.github@gmail.com Twitter:@lambrero

var createScene = function () {

    const {
        Scene, HemisphericLight, DirectionalLight, Vector3, Color3,
        ArcRotateCamera, MeshBuilder, PBRCustomMaterial
    } = BABYLON;

    const initTime = +new Date();

    //
    // Main scene ===============================
    //

    const scene = new Scene(engine);
    scene.clearColor = Color3.FromHexString('#10161A');

    // const camera = new ArcRotateCamera('camera', 0, 0, 20.0, new Vector3(0, 0, 0), scene);
    const camera = new ArcRotateCamera('camera', -1, 0.5, 20.0, new Vector3(0, 0, 0), scene);
    camera.wheelPrecision = 50;
    camera.minZ = 0.2;
    camera.attachControl(canvas, true);

    const baseLight = new HemisphericLight('hemiLight', new Vector3(-1, 1, 0), scene);
    baseLight.diffuse = new Color3(1, 1, 1);
    baseLight.groundColor = new Color3(0.5, 0.5, 0.5);
    baseLight.intensity = 0.25;

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, 1), scene);
    dirLight.position = new Vector3(20, 40, -20);

    const radius = 5;

    const sphere = MeshBuilder.CreateSphere('sphere', {
        diameter: radius * 2,
        segments: 512,
    });

    const mainMaterial = new PBRCustomMaterial('sphereMaterial', scene);

    mainMaterial.metallic = 0.1;
    mainMaterial.roughness = 0.075;
    mainMaterial.emissiveColor = new Color3.FromHexString('#293742');

    sphere.material = mainMaterial;

    //
    // Shaders
    //

    mainMaterial.Vertex_Definitions(main_vertexDefinitions);
    mainMaterial.Vertex_Before_PositionUpdated(main_vertexBeforePositionUpdated);

    //
    // Attributes
    //

    mainMaterial.AddUniform('iTime', 'float');
    mainMaterial.AddUniform('radius', 'float');
    mainMaterial.AddUniform('radiusVariationAmplitude', 'float');
    mainMaterial.AddUniform('radiusNoiseFrequency', 'float');
    mainMaterial.onBind = () => {
        const time = (+new Date() - initTime) * 0.001;
        mainMaterial.getEffect().setFloat('iTime', time);

        mainMaterial.getEffect().setFloat('radius', radius);
        mainMaterial.getEffect().setFloat('radiusVariationAmplitude', 1.2);
        mainMaterial.getEffect().setFloat('radiusNoiseFrequency', 0.33);
    };

    // ------------------------------

    return scene;
};

var main_vertexDefinitions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float noise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x +
                   vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 distortFunct(vec3 transformed) {
  float rv = -noise(transformed * radiusNoiseFrequency + iTime + 100.) * radiusVariationAmplitude;

  return normalize(transformed) * (rv + radius);
}

vec3 orthogonal(vec3 v) { return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y)); }

vec3 distortNormal(vec3 position, vec3 distortedPosition, vec3 normal) {
  vec3 tangent1 = normalize(orthogonal(normal));
  vec3 tangent2 = normalize(cross(normal, tangent1));
  vec3 nearby1 = position + tangent1 * 0.013;
  vec3 nearby2 = position + tangent2 * 0.013;
  vec3 distorted1 = distortFunct(nearby1);
  vec3 distorted2 = distortFunct(nearby2);
  return normalize(cross(distorted1 - distortedPosition, distorted2 - distortedPosition));
}
`

var main_vertexBeforePositionUpdated = `
float updateTime = iTime * .1;
positionUpdated = distortFunct(positionUpdated);
vec3 distortedNormal = distortNormal(position, positionUpdated, normalUpdated);
normalUpdated = distortedNormal;
`