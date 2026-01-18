let screenMesh; 
let controls, moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let devMode = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class ScreenEffect {
  constructor(parent, options) {
    this.parent = parent;
    if ( typeof parent === "string" ) {
      this.parent = document.querySelector(parent);
    }
    
    this.config = Object.assign({}, {
      //
    }, options)
    
    this.effects = {};
    
    this.events = {
      resize: this.onResize.bind(this)
    };
    
    window.addEventListener("resize", this.events.resize, false);
    
    this.render();
  }
  
  render() {
    const container = document.createElement("div");
    container.classList.add("screen-container");
    const wrapper1 = document.createElement("div");
    wrapper1.classList.add("screen-wrapper");
    const wrapper2 = document.createElement("div");
    wrapper2.classList.add("screen-wrapper"); 
    const wrapper3 = document.createElement("div");
    wrapper3.classList.add("screen-wrapper");     
    wrapper1.appendChild(wrapper2);
    wrapper2.appendChild(wrapper3);
    container.appendChild(wrapper1);
    this.parent.parentNode.insertBefore(container, this.parent);
    wrapper3.appendChild(this.parent);
    this.nodes = { container, wrapper1, wrapper2, wrapper3 };
    this.onResize();
  }
  
  onResize(e) {
    this.rect = this.parent.getBoundingClientRect();
    if ( this.effects.vcr && !!this.effects.vcr.enabled ) {
      this.generateVCRNoise();
    }
  }
  
  add(type, options) {
    const config = Object.assign({}, {
      fps: 30,
      blur: 1
    }, options);
    if ( Array.isArray(type) ) {
      for ( const t of type ) {
        this.add(t);
      }
      return this;
    }
    const that = this;
    if ( type === "snow" ) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.classList.add(type);
      canvas.width = this.rect.width / 2;
      canvas.height = this.rect.height / 2;
      this.nodes.wrapper2.appendChild(canvas);
      
      // Memory optimization: Pre-allocate ImageData and buffer
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const buffer = new Uint32Array(imgData.data.buffer);
      
      animate();
      function animate() {
        that.generateSnow(ctx, imgData, buffer);
        that.snowframe = requestAnimationFrame(animate);
      }
      this.effects[type] = {
        wrapper: this.nodes.wrapper2,
        node: canvas,
        enabled: true,
        config
      };
      return this;
    }
    if ( type === "roll" ) {
      return this.enableRoll();
    }
    if ( type === "vcr" ) {
      const canvas = document.createElement("canvas");
      canvas.classList.add(type);
      this.nodes.wrapper2.appendChild(canvas);
      canvas.width = this.rect.width;
      canvas.height = this.rect.height;
      canvas.style.filter = `blur(${config.blur}px)`; // Set once here
      this.effects[type] = {
        wrapper: this.nodes.wrapper2,
        node: canvas,
        ctx: canvas.getContext("2d"),
        enabled: true,
        config
      };      
      this.generateVCRNoise();
      return this;
    }
    let node = false;
    let wrapper = this.nodes.wrapper2;
    switch(type) {
      case "wobblex":
      case "wobbley":
        wrapper.classList.add(type);
        break;
      case "scanlines":
        node = document.createElement("div");
        node.classList.add(type);
        wrapper.appendChild(node);
        break;
      case "vignette":
        wrapper = this.nodes.container;
        node = document.createElement("div");
        node.classList.add(type);
        wrapper.appendChild(node);
        break;
      case "image":
        wrapper = this.parent;
        node = document.createElement('img');
        node.classList.add(type);
        node.classList.add('image');
        node.src = config.src;
        wrapper.appendChild(node);
        break;        
    }
    this.effects[type] = {
      wrapper,
      node,
      enabled: true,
      config
    };
    return this;
  }
  
  remove(type) {
    const obj = this.effects[type];
    if ( type in this.effects && !!obj.enabled ) {
      obj.enabled = false;
      if ( type === "roll" && obj.original ) {
        this.parent.appendChild(obj.original);
      }     
      if ( type === "vcr" ) {
        clearInterval(this.vcrInterval);
      }
      if ( type === "snow" ) {
        cancelAnimationFrame(this.snowframe);
      }     
      if ( obj.node ) {
        obj.wrapper.removeChild(obj.node);
      } else {
        obj.wrapper.classList.remove(type);
      }
    }
    return this;
  }
  
  enableRoll() {
    const el = this.parent.firstElementChild;
    if ( el ) {
      const div = document.createElement("div");
      div.classList.add("roller");
      this.parent.appendChild(div);
      div.appendChild(el);
      div.appendChild(el.cloneNode(true));
      this.effects.roll = {
        enabled: true,
        wrapper: this.parent,
        node: div,
        original: el
      };
    }
  }
  
  generateVCRNoise() {
    const canvas = this.effects.vcr.node;
    const config = this.effects.vcr.config;
    if ( config.fps >= 60 ) {
      cancelAnimationFrame(this.vcrInterval);
      const animate = () => {
        this.renderTrackingNoise();
        this.vcrInterval = requestAnimationFrame(animate);
      };
      animate();
    } else {
      clearInterval(this.vcrInterval);
      this.vcrInterval = setInterval(() => {
        this.renderTrackingNoise();
      }, 1000 / config.fps);
    }
  }
  
  generateSnow(ctx, d, b) {
    var len = b.length;
    for (var i = 0; i < len; i++) {
      b[i] = ((255 * Math.random()) | 0) << 24;
    }
    ctx.putImageData(d, 0, 0);
  }
  
  renderTrackingNoise(radius = 2, xmax, ymax) {
    const canvas = this.effects.vcr.node;
    const ctx = this.effects.vcr.ctx;
    const config = this.effects.vcr.config;
    let posy1 = config.miny || 0;
    let posy2 = config.maxy || canvas.height;
    let posy3 = config.miny2 || 0;
    const num = config.num || 20;
    if ( xmax === undefined ) xmax = canvas.width;
    if ( ymax === undefined ) ymax = canvas.height;     
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `#fff`;
    
    for (var i = 0; i <= num; i++) {
      var x = Math.random(i) * xmax;
      var y1 = getRandomInt(posy1+=3, posy2);
      var y2 = getRandomInt(0, posy3-=3);
      ctx.fillRect(x, y1, radius, radius);
      ctx.fillRect(x, y2, radius, radius);
      
      this.renderTail(ctx, x, y1, radius);
      this.renderTail(ctx, x, y2, radius);
    }
  }

  renderTail(ctx, x, y, radius) {
    const n = getRandomInt(1, 50);
    const dirs = [1, -1];
    let rd = radius;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    for (let i = 0; i < n; i++) {
      const step = 0.01;
      let r = getRandomInt((rd -= step), radius);
      let dx = getRandomInt(1, 4);
      radius -= 0.1;
      dx *= dir;
      ctx.fillRect((x += dx), y, r, r);
    }
  } 
}

class Events {
  constructor() {
    this.activeEvent = null;
    this.eventTimer = 0;
    
    this.eventChances = {
      "Normal State": 0.20,
      "Lunar Tear": 0.05,
      "Lamps Blackout": 0.08,      
      "Sign Blackout": 0.08,
      "Complete Blackout": 0.08,
      "Marys Letter": 0.08,
      "Maria Appearance": 0.04,
      "Ashley Appearance": 0.04,
      "Ada Appearance": 0.04,
      "SH1 Case": 0.05,
      "SH3 Case": 0.05,
      "Simon Phone": 0.05,
      "Doge Appearance": 0.04,
      "Mirror Event": 0.05,
      "Devilz Event": 0.0233,
      "Pyramid Head": 0.0233,
      "Tyrant Appearance": 0.0234
    };

    // Trigger the check immediately on initialization
    this.tryTriggerEvent();
  }

  tryTriggerEvent() {
    const roll = Math.random();
    let cumulative = 0;
    let triggered = false;

    for (const [name, chance] of Object.entries(this.eventChances)) {
      cumulative += chance;
      if (roll < cumulative) {
        this.triggerEvent(name);
        triggered = true;
        break;
      }
    }
    
    if (!triggered) {
      console.log("No event triggered on this visit.");
    }
  }

  triggerEvent(name) {
    this.activeEvent = name;
    console.log(`EVENT TRIGGERED ON LOAD: ${name}`);
  } 
}

let scene, camera, renderer, cssRenderer;
let tvModel, barModel, screenEffect, screenUI, screenLight, signLight, signHalo, nightHalo, stripperLight, paradiseLight;
let ambientLight, hemisphereLight, directionalLight;
let eventManager, marysLetter, mariaModel, mariaMixer, ashleyModel, ashleyMixer, adaModel, adaMixer, lunarModel, sh1Model, sh3Model, sh1Mixer, sh3Mixer, simonPhoneModel, simonPhoneMixer, dogeModel, dogeMixer, mirrorModel, mirrorMixer, fukuroModel, fukuroMixer, devilzModel, devilzMixer, pyramidHeadModel, pyramidHeadMixer, tyrantModel, tyrantMixer;
let signFlickerTimer = 0;
let signDarknessTimer = 0;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const screenWorldPos = new THREE.Vector3(); 

let modelsLoaded = false;
let introFirstPhaseDone = false;

function checkIntroDone() {
    if (modelsLoaded && introFirstPhaseDone) {
        const introOverlay = document.getElementById('intro-overlay');
        const introImage = document.getElementById('intro-image');
        
        gsap.to(introImage, {
            opacity: 0,
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => {
                gsap.to(introOverlay, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        introOverlay.style.display = 'none';
                        startMainAnimation();
                        
                        if (!localStorage.getItem('hideWelcomeDialogue')) {
                            const dialogue = document.getElementById('dialogue-container');
                            dialogue.style.display = 'block';
                            
                            const text = "Welcome to Silentwave. Press PLAY to interact, click the TV REMOTE for history.";
                            typeWriter(text, "dialogue-text", 50);
                        }
                    }
                });
            }
        });
    }
}

function typeWriter(text, elementId, speed) {
    let i = 0;
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            gsap.to("#continue-prompt", { opacity: 1, duration: 1, delay: 0.5 });
        }
    }
    type();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const dialogue = document.getElementById('dialogue-container');
        if (dialogue && dialogue.style.display === 'block') {
            const sound = new Audio(window.ASSETS.interaction2);
            sound.play().catch(e => {});

            localStorage.setItem('hideWelcomeDialogue', 'true');
            
            gsap.to(dialogue, { 
                opacity: 0, 
                duration: 0.8, 
                ease: "power2.inOut",
                onComplete: () => {
                    dialogue.style.display = 'none';
                }
            });
        }
    }
});

function startMainAnimation() {
    if (!screenUI) return;
    
    const tl = gsap.timeline();
    tl.to(camera.position, {
        x: 0,
        y: -1.2,
        z: 5.5,
        duration: 8,
        ease: "power1.inOut",
        onUpdate: () => camera.lookAt(0, -1.2, 0)
    }, 0);

    tl.to(screenUI.position, {
        x: 1.1, 
        z: -0.5,
        duration: 8,
        ease: "power1.inOut"
    }, 0); 

    tl.to(screenUI.scale, {
        x: 0.080,
        y: 0.075,
        z: 0.075,
        duration: 8,
        ease: "power1.inOut"
    }, 0);
}

function runIntroSequence() {
    const introImage = document.getElementById('intro-image');
    const img1 = window.ASSETS.boot_img1;
    const img2 = window.ASSETS.boot_img2;

    setTimeout(() => {
        gsap.to(introImage, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                introImage.src = img2;
                gsap.to(introImage, {
                    opacity: 1,
                    duration: 1.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        gsap.to(introImage, {
                            opacity: 0,
                            duration: 1,
                            delay: 0.5,
                            ease: "power2.inOut",
                            onComplete: () => {
                                introImage.src = img1;
                                gsap.to(introImage, {
                                    opacity: 1,
                                    duration: 1,
                                    onComplete: () => {
                                        introFirstPhaseDone = true;
                                        checkIntroDone();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }, 1000);
}

function onMouseClick(event) {
    if (!introFirstPhaseDone || !modelsLoaded) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (!tvModel) return;

    const intersects = raycaster.intersectObject(tvModel, true);
    if (intersects.length > 0) {
        const clickedName = intersects[0].object.name.toLowerCase();
        if (clickedName.includes('remote')) {
            toggleCRTMenu();
        }
    }
}

function onMouseMove(event) {
    if (!introFirstPhaseDone || !modelsLoaded) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (raycaster && camera && tvModel) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(tvModel, true);
        
        if (intersects.length > 0) {
            const hoveredName = intersects[0].object.name.toLowerCase();
            if (hoveredName.includes('remote')) {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'default';
            }
        } else {
            document.body.style.cursor = 'default';
        }
    }
}

function toggleCRTMenu() {
    const menu = document.getElementById('crt-menu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
        updateCRTTracks();
        
        const sound = new Audio(window.ASSETS.interaction2);
        sound.play().catch(e => {});
    }
}

function updateCRTTracks() {
    $.get('/previous', function(data) {
        const list = document.getElementById('crt-track-list');
        list.innerHTML = '';
        
        const tracks = Object.entries(data.tracks).reverse();
        tracks.forEach(([time, track_name]) => {
            const li = document.createElement('li');
            li.className = 'crt-item';
            li.innerHTML = `<span class="crt-time">${time}</span><span class="crt-track">${track_name}</span>`;
            list.appendChild(li);
        });
    });
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -1.2, 16); 

    eventManager = new Events();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1); 
    renderer.outputEncoding = THREE.sRGBEncoding; 
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ReinhardToneMapping; 
    renderer.toneMappingExposure = 0.8;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('three-container').appendChild(renderer.domElement);

    runIntroSequence();

    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    document.getElementById('css-container').appendChild(cssRenderer.domElement);

    ambientLight = new THREE.AmbientLight(0x404040, 0.01); 
    scene.add(ambientLight);
    
    hemisphereLight = new THREE.HemisphereLight(0x0a0a15, 0x000000, 0.02);
    scene.add(hemisphereLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    screenLight = new THREE.PointLight(0x5555ff, 5, 15); 
    screenLight.position.set(6.4, 30, 15); 
    screenLight.castShadow = true;
    screenLight.shadow.bias = -0.001;

    const barManager = new THREE.LoadingManager();
    const barLoader = new THREE.GLTFLoader(barManager);
    const tvLoader = new THREE.FBXLoader(); 
    
    barLoader.load(window.ASSETS.bar_model, (gltf) => {
        barModel = gltf.scene;
        barModel.scale.set(15.0, 15.0, 15.0); 
        barModel.position.set(60, 14, 30); 
        barModel.rotation.y = -3;
        scene.add(barModel);
        
        barModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const oldMat = child.material;
                const materials = Array.isArray(oldMat) ? oldMat : [oldMat];
                
                const newMaterials = materials.map(mat => {
                    if (!mat) return mat;
                    const newMat = new THREE.MeshStandardMaterial({
                        map: mat.map,
                        color: mat.color,
                        side: THREE.DoubleSide,
                        roughness: 1.0,
                        metalness: 0.0
                    });
                    if (newMat.map) {
                        newMat.map.encoding = THREE.sRGBEncoding;
                        newMat.map.anisotropy = 16;
                    }
                    return newMat;
                });
                child.material = Array.isArray(oldMat) ? newMaterials : newMaterials[0];
            }
        });

        signLight = new THREE.PointLight(0xff00ff, 72, 50);
        signLight.position.set(29, 16, -50); 
        scene.add(signLight);

        nightHalo = new THREE.PointLight(0x8000FF, 72, 50);
        nightHalo.position.set(29, 13, -50); 
        scene.add(nightHalo);

        stripperLight= new THREE.PointLight(0xffcb00, 3000, 0); 
        stripperLight.decay = 1; 
        stripperLight.position.set(-2, 9, 23); 
        stripperLight.castShadow = true;
        stripperLight.shadow.bias = -0.001;
        scene.add(stripperLight);

        paradiseLight= new THREE.PointLight(0xff0000, 15, 100);
        paradiseLight.position.set(-9, 23, 19); 
        paradiseLight.castShadow = true;
        paradiseLight.shadow.bias = -0.001;
        scene.add(paradiseLight);
    });

    tvLoader.load(window.ASSETS.tv_model, (object) => {
        tvModel = object;
        const textureLoader = new THREE.TextureLoader();
        const tvTexture = textureLoader.load(window.ASSETS.tv_texture, 
            (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.anisotropy = 16;
                tex.flipY = true;
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            }
        );
        
        let screenMesh;
        tvModel.traverse((child) => {
            if (child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                const processedMaterials = materials.map((mat) => {
                    if (!mat) return mat;
                    if (child.name.toLowerCase().includes('crt') && !child.name.includes("TVCRT")) {
                        mat.visible = false;
                        return mat;
                    }
                    if (mat.map) {
                        const newMat = new THREE.MeshStandardMaterial({
                            map: mat.map,
                            roughness: 0.4,
                            metalness: 0.6,
                            side: THREE.DoubleSide
                        });
                        newMat.map.encoding = THREE.sRGBEncoding;
                        newMat.map.anisotropy = 16;
                        newMat.map.flipY = true;
                        newMat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
                        return newMat;
                    }
                    return new THREE.MeshStandardMaterial({
                        map: tvTexture,
                        roughness: 0.6,
                        metalness: 0.4,
                        side: THREE.DoubleSide
                    });
                });
                child.material = Array.isArray(child.material) ? processedMaterials : processedMaterials[0];
                if (child.name.toLowerCase().includes('crt') || child.name.toLowerCase().includes('screen') || child.name === "") {
                    if (child.name === "TVCRT" || child.name === "TVRemote") {
                        child.visible = true;
                    } else {
                        screenMesh = child;
                        child.visible = true;
                        child.position.z -= 0.05; 
                        child.scale.multiplyScalar(1.02);
                    }
                }
            }
        });

        tvModel.position.set(0.3, -3, 0); 
        tvModel.rotation.y = 0; 
        tvModel.scale.set(0.05, 0.05, 0.05); 
        scene.add(tvModel);
        tvModel.add(screenLight); 

        screenUI = setupCSSContent(screenMesh);
        screenUI.scale.set(0.075, 0.075, 0.075);
        screenUI.position.z = -15; 

        let modelsToLoad = 1;
        let modelsLoadedCount = 0;
        
        const onModelLoaded = () => {
            modelsLoadedCount++;
            if (modelsLoadedCount >= modelsToLoad) {
                modelsLoaded = true;
                checkIntroDone();
            }
        };

        const eventsToLoad = ["Marys Letter", "Maria Appearance", "Ashley Appearance", "Ada Appearance", "Lunar Tear", "SH1 Case", "SH3 Case", "Simon Phone", "Doge Appearance", "Mirror Event", "Fukuro Event", "Devilz Event", "Pyramid Head", "Tyrant Appearance"];
        if (eventManager && eventsToLoad.includes(eventManager.activeEvent)) modelsToLoad++;

        onModelLoaded();

        if (eventManager && eventManager.activeEvent === "Marys Letter") {
            textureLoader.load(window.ASSETS.mary_letter, (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.anisotropy = 16;
                const aspect = tex.image.width / tex.image.height;
                const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
                const material = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, roughness: 0.7, metalness: 0.1 });
                marysLetter = new THREE.Mesh(geometry, material);
                marysLetter.position.set(-0.4, -3.0, 2.6); 
                marysLetter.rotation.x = -1.52;
                marysLetter.rotation.y = -0.01;
                marysLetter.scale.set(0.7, 0.7, 0.7);
                marysLetter.visible = false; 
                scene.add(marysLetter);
                onModelLoaded();
            });
        }

        const gltfLoader = new THREE.GLTFLoader();

        if (eventManager && eventManager.activeEvent === "Maria Appearance") {
            gltfLoader.load(window.ASSETS.maria_model, (gltf) => {
                mariaModel = gltf.scene;
                mariaModel.position.set(16, -21, -38); 
                mariaModel.rotation.y = 0.81;
                mariaModel.scale.set(1.7, 1.7, 1.7);
                if (gltf.animations && gltf.animations.length > 0) {
                    mariaMixer = new THREE.AnimationMixer(mariaModel);
                    mariaMixer.clipAction(gltf.animations[0]).play();
                }
                mariaModel.visible = false; 
                scene.add(mariaModel);
                mariaModel.traverse((child) => {
                    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
                    if (child.isBone) {
                        if (child.name === "head_08") { child.rotation.set(-0.6, 0.9, 0); }
                        if (child.name === "arm_right_shoulder1_066" || child.name === "arm_left_shoulder1_047") { child.rotation.set(-1.39, -0.46, 1.69); }
                    }
                });
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Ashley Appearance") {
            gltfLoader.load(window.ASSETS.ashley_model, (gltf) => {
                ashleyModel = gltf.scene;
                ashleyModel.position.set(37.2, -19.3, -39.9); 
                ashleyModel.rotation.y = -1.63;
                ashleyModel.scale.set(15.7, 15.7, 15.7); 
                ashleyModel.traverse((child) => {
                    if (child.isMesh || child.isSkinnedMesh) {
                        child.visible = true;
                        child.frustumCulled = false; 
                        child.castShadow = true;
                        child.receiveShadow = true;
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            if (!mat) return;
                            const matName = mat.name ? mat.name.toLowerCase() : "";
                            const isTransparentPart = matName.includes("hair") || matName.includes("lash") || matName.includes("glass") || matName.includes("trans") || matName.includes("gloss");
                            mat.transparent = isTransparentPart;
                            mat.opacity = 1.0;
                            mat.side = THREE.DoubleSide;
                            mat.alphaTest = isTransparentPart ? 0.05 : 0.5;
                            mat.depthWrite = !isTransparentPart;
                            mat.depthTest = true;
                            if (mat.map) { mat.map.encoding = THREE.sRGBEncoding; mat.map.anisotropy = 16; }
                        });
                    }
                });
                if (gltf.animations && gltf.animations.length > 0) {
                    ashleyMixer = new THREE.AnimationMixer(ashleyModel);
                    const action = ashleyMixer.clipAction(gltf.animations[0]);
                    action.setLoop(THREE.LoopPingPong);
                    action.play();
                }
                ashleyModel.visible = false; 
                scene.add(ashleyModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Ada Appearance") {
            gltfLoader.load(window.ASSETS.ada_model, (gltf) => {
                adaModel = gltf.scene;
                adaModel.position.set(-13.2, -18.9, -18.9); 
                adaModel.rotation.y = 0.15;
                adaModel.scale.set(24.1, 24.1, 24.1); 
                adaModel.traverse((child) => {
                    if (child.isMesh || child.isSkinnedMesh) {
                        child.visible = true;
                        child.castShadow = true;
                        child.receiveShadow = true;
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => { if (mat && mat.map) { mat.map.encoding = THREE.sRGBEncoding; mat.map.anisotropy = 16; } });
                    }
                });
                if (gltf.animations && gltf.animations.length > 0) {
                    adaMixer = new THREE.AnimationMixer(adaModel);
                    adaMixer.clipAction(gltf.animations[0]).play();
                }
                adaModel.visible = false; 
                scene.add(adaModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Lunar Tear") {
            gltfLoader.load(window.ASSETS.lunar_model, (gltf) => {
                lunarModel = gltf.scene;
                lunarModel.position.set(-2.9, -2.9, 0.9); 
                lunarModel.rotation.set(1.12, 2.16, 0);
                lunarModel.scale.set(2.7, 2.7, 2.7); 
                lunarModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true; child.receiveShadow = true;
                        if (child.material && child.material.map) { child.material.map.encoding = THREE.sRGBEncoding; child.material.map.anisotropy = 16; }
                    }
                });
                lunarModel.visible = true; 
                scene.add(lunarModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "SH1 Case") {
            gltfLoader.load(window.ASSETS.sh1_model, (gltf) => {
                sh1Model = gltf.scene;
                sh1Model.position.set(-2.20, -2.20, 1.80); 
                sh1Model.rotation.set(-1.51, 0.44, 0);
                sh1Model.scale.set(0.05, 0.05, 0.05); 
                sh1Model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { sh1Mixer = new THREE.AnimationMixer(sh1Model); sh1Mixer.clipAction(gltf.animations[0]).play(); }
                sh1Model.visible = true; 
                scene.add(sh1Model);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "SH3 Case") {
            gltfLoader.load(window.ASSETS.sh3_model, (gltf) => {
                sh3Model = gltf.scene;
                sh3Model.position.set(-1.40, -2.50, 3.20); 
                sh3Model.rotation.set(-0.04, 0.15, 0);
                sh3Model.scale.set(0.41, 0.41, 0.41); 
                sh3Model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { sh3Mixer = new THREE.AnimationMixer(sh3Model); sh3Mixer.clipAction(gltf.animations[0]).play(); }
                sh3Model.visible = true; 
                scene.add(sh3Model);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Simon Phone") {
            gltfLoader.load(window.ASSETS.simon_model, (gltf) => {
                simonPhoneModel = gltf.scene;
                simonPhoneModel.position.set(-0.20, -2.90, 2.00); 
                simonPhoneModel.rotation.set(-1.51, 0.02, 0);
                simonPhoneModel.scale.set(0.0529, 0.0529, 0.0529); 
                simonPhoneModel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { simonPhoneMixer = new THREE.AnimationMixer(simonPhoneModel); simonPhoneMixer.clipAction(gltf.animations[0]).play(); }
                simonPhoneModel.visible = true; 
                scene.add(simonPhoneModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Doge Appearance") {
            gltfLoader.load(window.ASSETS.doge_model, (gltf) => {
                dogeModel = gltf.scene;
                dogeModel.position.set(24.60, -18.90, -35.70); 
                dogeModel.rotation.set(0.10, -0.85, 0);
                dogeModel.scale.set(12.3428, 12.3428, 12.3428); 
                dogeModel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { dogeMixer = new THREE.AnimationMixer(dogeModel); dogeMixer.clipAction(gltf.animations[0]).play(); }
                dogeModel.visible = true; 
                scene.add(dogeModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Mirror Event") {
            gltfLoader.load(window.ASSETS.mirror_model, (gltf) => {
                mirrorModel = gltf.scene;
                mirrorModel.position.set(25.70, 14.30, -53.70); 
                mirrorModel.rotation.y = 0.12;
                mirrorModel.scale.set(13.1062, 13.1062, 13.1062); 
                mirrorModel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { mirrorMixer = new THREE.AnimationMixer(mirrorModel); mirrorMixer.clipAction(gltf.animations[0]).play(); }
                mirrorModel.visible = true; 
                scene.add(mirrorModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Fukuro Event") {
            gltfLoader.load(window.ASSETS.fukuro_model, (gltf) => {
                fukuroModel = gltf.scene;
                fukuroModel.position.set(25.30, -22.00, -48.70); 
                fukuroModel.rotation.set(-0.21, 0.71, 0);
                fukuroModel.scale.set(5.1859, 5.1859, 5.1859); 
                fukuroModel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { fukuroMixer = new THREE.AnimationMixer(fukuroModel); fukuroMixer.clipAction(gltf.animations[0]).play(); }
                fukuroModel.visible = true; 
                scene.add(fukuroModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Devilz Event") {
            gltfLoader.load(window.ASSETS.devilz_model, (gltf) => {
                devilzModel = gltf.scene;
                devilzModel.position.set(-2.20, -3.00, 0.90); 
                devilzModel.rotation.set(0, 0.99, 0);
                devilzModel.scale.set(0.4146, 0.4146, 0.4146); 
                devilzModel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { devilzMixer = new THREE.AnimationMixer(devilzModel); devilzMixer.clipAction(gltf.animations[0]).play(); }
                devilzModel.visible = true; 
                scene.add(devilzModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Pyramid Head") {
            gltfLoader.load(window.ASSETS.pyramid_model, (gltf) => {
                pyramidHeadModel = gltf.scene;
                pyramidHeadModel.position.set(42.10, -19.30, -41.90); 
                pyramidHeadModel.rotation.set(0, 1.28, 0);
                pyramidHeadModel.scale.set(7.4761, 7.4761, 7.4761); 
                pyramidHeadModel.traverse((child) => { if (child.isMesh || child.isSkinnedMesh) { child.visible = true; child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                if (gltf.animations && gltf.animations.length > 0) { pyramidHeadMixer = new THREE.AnimationMixer(pyramidHeadModel); pyramidHeadMixer.clipAction(gltf.animations[0]).play(); }
                pyramidHeadModel.visible = true; 
                scene.add(pyramidHeadModel);
                onModelLoaded();
            });
        }

        if (eventManager && eventManager.activeEvent === "Tyrant Appearance") {
            gltfLoader.load(window.ASSETS.tyrant_model, (gltf) => {
                tyrantModel = gltf.scene;
                tyrantModel.position.set(28.80, -17.40, -17.00); 
                tyrantModel.rotation.set(-0.07, -0.70, 0);
                tyrantModel.scale.set(0.2238, 0.2238, 0.2238); 
                tyrantModel.traverse((child) => { if (child.isMesh || child.isSkinnedMesh) { child.visible = true; child.castShadow = true; child.receiveShadow = true; if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding; } });
                tyrantModel.visible = true; 
                scene.add(tyrantModel);
                onModelLoaded();
            });
        }
    });

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('mousemove', onMouseMove, false);
    
    animate();
}

function setupCSSContent(targetMesh) {
    const container = document.getElementById('tv-content-source');
    const element = container.querySelector('.tv-container');
    container.style.display = 'block'; 
    
    const cssObject = new THREE.CSS3DObject(element);
    cssObject.position.set(1.1, 29.5, -0.5); 
    cssObject.scale.set(0.080, 0.075, 0.075); 
    tvModel.add(cssObject);
    
    screenEffect = new ScreenEffect("#screen", {});
    const config = {
      effects: {
        image: { enabled: true, options: { src: window.CONFIG.bg_img, blur: 1.2 } },
        vignette: { enabled: true },
        scanlines: { enabled: true },
        vcr: { enabled: true, options: { opacity: 1, miny: 220, miny2: 220, num: 70, fps: 24 } },
        wobbley: { enabled: true },
        snow: { enabled: true, options: { opacity: 0.2 } },
      },
    };

    setTimeout(() => {
      for ( const prop in config.effects ) {
        if ( !!config.effects[prop].enabled ) {
          screenEffect.add(prop, config.effects[prop].options);
        }
      }
    }, 1000);
    
    window.vol = function() {
        const audio = document.querySelector('audio');
        const volumeControl = document.querySelector('#volume-control');
        if (audio && volumeControl) {
            audio.volume = volumeControl.value;
        }
    };
    document.querySelector('#volume-control').addEventListener('input', window.vol);

    return cssObject; 
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mariaMixer) mariaMixer.update(delta);
    if (ashleyMixer) ashleyMixer.update(delta);
    if (adaMixer) adaMixer.update(delta);
    if (sh1Mixer) sh1Mixer.update(delta);
    if (sh3Mixer) sh3Mixer.update(delta);
    if (simonPhoneMixer) simonPhoneMixer.update(delta);
    if (dogeMixer) dogeMixer.update(delta);
    if (pyramidHeadMixer) pyramidHeadMixer.update(delta);
    if (tyrantMixer) tyrantMixer.update(delta);
    if (mirrorMixer) mirrorMixer.update(delta);
    if (fukuroMixer) fukuroMixer.update(delta);
    if (devilzMixer) devilzMixer.update(delta);

    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    if (screenUI) {
        screenUI.getWorldPosition(screenWorldPos);
        if (!frustum.containsPoint(screenWorldPos)) {
            if (screenUI.element.style.display !== 'none') screenUI.element.style.display = 'none';
        } else {
            if (screenUI.element.style.display === 'none') screenUI.element.style.display = 'block';
        }
    }
    
    // --- LIGHTING LOGIC ---
    const isSpecialEvent = eventManager && (eventManager.activeEvent === "Pyramid Head" || eventManager.activeEvent === "Tyrant Appearance");

    if (isSpecialEvent) {
        // ROOM IN COMPLETE DARKNESS
        if (ambientLight) ambientLight.intensity = 0;
        if (hemisphereLight) hemisphereLight.intensity = 0;
        if (directionalLight) directionalLight.intensity = 0;
        if (stripperLight) stripperLight.intensity = 0;
        if (paradiseLight) paradiseLight.intensity = 0;

        // ONLY Heavens Night lamp rare flicker
        if (signLight && nightHalo) {
            if (signFlickerTimer > 0) {
                // LIGHT ON PHASE
                signFlickerTimer--;
                signLight.intensity = 72;
                nightHalo.intensity = 72;
                
                // When light ends, start mandatory darkness pause
                if (signFlickerTimer <= 0) {
                    signDarknessTimer = 180 + Math.random() * 120; // 3-5 seconds of darkness
                }
            } else if (signDarknessTimer > 0) {
                // DARKNESS PAUSE PHASE
                signDarknessTimer--;
                signLight.intensity = 0;
                nightHalo.intensity = 0;
            } else if (Math.random() > 0.995) { 
                // TRIGGER NEW FLICKER
                signFlickerTimer = 120 + Math.random() * 60; // Stay glowing for 2-3 seconds
            } else {
                signLight.intensity = 0;
                nightHalo.intensity = 0;
            }
        }
    } else {
        // --- NORMAL LIGHTING / OTHER EVENTS ---
        
        // Restore scene lights if they were off
        if (ambientLight && ambientLight.intensity === 0) ambientLight.intensity = 0.01;
        if (hemisphereLight && hemisphereLight.intensity === 0) hemisphereLight.intensity = 0.02;
        if (directionalLight && directionalLight.intensity === 0) directionalLight.intensity = 0.2;

        // TV Screen Flicker
        if (screenLight && screenLight.color) {
            try {
                const baseIntensity = 5;
                screenLight.intensity = (baseIntensity * 0.8) + Math.random() * baseIntensity;
                const colorVal = 0.8 + Math.random() * 0.2;
                screenLight.color.setRGB(colorVal * 0.8, colorVal * 0.8, colorVal);
                if (Math.random() > 0.99) screenLight.intensity = baseIntensity * 0.2;
            } catch (e) {}
        }

        // Neon Sign Logic
        if (signLight && nightHalo) {
            if (eventManager && (eventManager.activeEvent === "Sign Blackout" || eventManager.activeEvent === "Complete Blackout" || eventManager.activeEvent === "Ada Appearance")) {
                signLight.intensity = 0; nightHalo.intensity = 0;
            } else if (eventManager && eventManager.activeEvent === "Mirror Event") {
                signLight.color.setHex(0xff0000); nightHalo.color.setHex(0x880000);
                if (Math.random() < 0.95) { signLight.intensity = 72; nightHalo.intensity = 72; }
                else { signLight.intensity = 0; nightHalo.intensity = 0; }
            } else {
                // Reset to normal colors
                if (signLight.color.getHex() !== 0xff00ff) signLight.color.setHex(0xff00ff);
                if (nightHalo.color.getHex() !== 0x8000FF) nightHalo.color.setHex(0x8000FF);
                const neonChance = Math.random();
                if (neonChance < 0.95) { signLight.intensity = 72; nightHalo.intensity = 72; }
                else if (neonChance < 0.98) { signLight.intensity = 20 + Math.random() * 20; nightHalo.intensity = 20 + Math.random() * 20; }
                else { signLight.intensity = 0; nightHalo.intensity = 0; }
            }
        }

        // Room Lights Logic
        if (stripperLight || paradiseLight) {
            if (eventManager && (eventManager.activeEvent === "Lamps Blackout" || eventManager.activeEvent === "Complete_Blackout")) {
                if (stripperLight) stripperLight.intensity = 0;
                if (paradiseLight) paradiseLight.intensity = 0;
            } else {
                if (stripperLight) {
                    const bulbChance = Math.random();
                    if (bulbChance < 0.99) stripperLight.intensity = 23;
                    else if (bulbChance < 0.997) stripperLight.intensity = 10 + Math.random() * 5;
                    else stripperLight.intensity = 0;
                }
                if (paradiseLight) paradiseLight.intensity = 15;
            }
        }
    }

    if (marysLetter) marysLetter.visible = (eventManager && eventManager.activeEvent === "Marys Letter");
    if (mariaModel) mariaModel.visible = (eventManager && eventManager.activeEvent === "Maria Appearance");
    if (ashleyModel) ashleyModel.visible = (eventManager && eventManager.activeEvent === "Ashley Appearance");
    if (adaModel) {
        const isAdaActive = (eventManager && eventManager.activeEvent === "Ada Appearance");
        adaModel.visible = isAdaActive;
        const threeContainer = document.getElementById('three-container');
        if (threeContainer) threeContainer.style.filter = isAdaActive ? "contrast(1.9) brightness(0.9) saturate(1.9) sepia(0.2) blur(0.3px)" : "contrast(1.3) brightness(0.9) saturate(1.9) sepia(0.2) blur(0.3px)";
    }
    if (lunarModel) lunarModel.visible = (eventManager && eventManager.activeEvent === "Lunar Tear");
    if (sh1Model) sh1Model.visible = (eventManager && eventManager.activeEvent === "SH1 Case");
    if (sh3Model) sh3Model.visible = (eventManager && eventManager.activeEvent === "SH3 Case");
    if (simonPhoneModel) simonPhoneModel.visible = (eventManager && eventManager.activeEvent === "Simon Phone");
    if (dogeModel) dogeModel.visible = (eventManager && eventManager.activeEvent === "Doge Appearance");
    if (mirrorModel) mirrorModel.visible = (eventManager && eventManager.activeEvent === "Mirror Event");
    if (pyramidHeadModel) pyramidHeadModel.visible = (eventManager && eventManager.activeEvent === "Pyramid Head");
    if (tyrantModel) tyrantModel.visible = (eventManager && eventManager.activeEvent === "Tyrant Appearance");
    if (fukuroModel) fukuroModel.visible = (eventManager && eventManager.activeEvent === "Fukuro Event");
    if (devilzModel) devilzModel.visible = (eventManager && eventManager.activeEvent === "Devilz Event");

    try {
        if (renderer && scene && camera) renderer.render(scene, camera);
        if (cssRenderer && scene && camera && screenUI && screenUI.element.style.display !== 'none') cssRenderer.render(scene, camera);
    } catch (e) {}
}

init();

