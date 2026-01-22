(function() {
    let devMode = false;
    let isDevModeAuthorized = false;

    let controls, moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let konamiIndex = 0;
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
        }, options)
        
        this.effects = {};
        this.paused = false; 
        
        this.events = {
          resize: this.onResize.bind(this)
        };
        
        window.addEventListener("resize", this.events.resize, false);
        
        this.render();
      }
      
      setVisibility(visible) {
        this.paused = !visible;
        if (visible) {
          if (this.effects.snow && this.effects.snow.enabled) this.startSnow();
          if (this.effects.vcr && this.effects.vcr.enabled) this.generateVCRNoise();
        } else {
          if (this.snowframe) cancelAnimationFrame(this.snowframe);
          if (this.vcrInterval) {
            cancelAnimationFrame(this.vcrInterval);
            clearInterval(this.vcrInterval);
          }
        }
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
        if (this.rect.width === 0 || this.rect.height === 0) {
            this.rect = { width: 1920, height: 1080 }; 
        }
        if ( this.effects.vcr && !!this.effects.vcr.enabled ) {
          this.generateVCRNoise();
        }
      }
      
      add(type, options) {
        this.onResize();
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
          

          const imgData = ctx.createImageData(canvas.width, canvas.height);
          const buffer = new Uint32Array(imgData.data.buffer);
          
          this.effects[type] = {
            wrapper: this.nodes.wrapper2,
            node: canvas,
            ctx, imgData, buffer,
            enabled: true,
            config
          };
          this.startSnow();
          return this;
        }
        if ( type === "roll" ) {
          return this.enableRoll();
        }
        if ( type === "vcr" ) {
          const canvas = document.createElement("canvas");
          canvas.classList.add(type);
          this.nodes.wrapper2.appendChild(canvas);
          canvas.width = this.rect.width / 2;
          canvas.height = this.rect.height / 2;
          canvas.style.filter = `blur(${config.blur}px)`;
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
                node.crossOrigin = "anonymous";
                node.src = config.src;
                console.log("Adding image to screen:", config.src);
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
      
      startSnow() {
        const effect = this.effects.snow;
        if (!effect || this.paused) return;

        const canvas = effect.node;
        let targetOpacity = 0.15;
        let currentOpacity = 0.15;

        const animate = () => {
          if (this.paused) return;
          this.generateSnow(effect.ctx, effect.imgData, effect.buffer);
          
          const isPagesEvent = typeof eventManager !== 'undefined' && eventManager && eventManager.activeEvent === "Pages Event";
          
          if (isPagesEvent) {
            targetOpacity = 0.6 + Math.random() * 0.35;
          } else if (Math.random() > 0.97) {
            targetOpacity = 0.05 + Math.random() * 0.4; 
          }  
          
          currentOpacity += (targetOpacity - currentOpacity) * (isPagesEvent ? 0.15 : 0.05);
          canvas.style.opacity = currentOpacity;
          this.snowframe = requestAnimationFrame(animate);
        };
        animate();
      }

      remove(type) {
        const obj = this.effects[type];
        if ( type in this.effects && !!obj.enabled ) {
          obj.enabled = false;
          if ( type === "roll" && obj.original ) {
            this.parent.appendChild(obj.original);
          }     
          if ( type === "vcr" ) {
            cancelAnimationFrame(this.vcrInterval);
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
        if (this.paused) return;
        const canvas = this.effects.vcr.node;
        const config = this.effects.vcr.config;
        if ( config.fps >= 60 ) {
          cancelAnimationFrame(this.vcrInterval);
          const animate = () => {
            if (this.paused) return;
            this.renderTrackingNoise();
            this.vcrInterval = requestAnimationFrame(animate);
          };
          animate();
        } else {
          clearInterval(this.vcrInterval);
          this.vcrInterval = setInterval(() => {
            if (this.paused) return;
            this.renderTrackingNoise();
          }, 1000 / config.fps);
        }
      }
      
      generateSnow(ctx, d, b) {
        var len = b.length;
        for (var i = 0; i < len; i++) {
          const val = (Math.random() * 255) | 0;
          b[i] = (255 << 24) | (val << 16) | (val << 8) | val;
        }
        ctx.putImageData(d, 0, 0);
      }
      
      renderTrackingNoise(radius = 2, xmax, ymax) {
        const canvas = this.effects.vcr.node;
        const ctx = this.effects.vcr.ctx;
        const config = this.effects.vcr.config;

        const isPagesEvent = typeof eventManager !== 'undefined' && eventManager && eventManager.activeEvent === "Pages Event";
        
        let currentNum = config.num || 20;
        if (isPagesEvent) {
            currentNum = 80 + Math.random() * 100;
        } else if (Math.random() > 0.98) {
            currentNum = currentNum * (0.5 + Math.random() * 1.5);
        }

        let posy1 = config.miny || 0;
        let posy2 = config.maxy || canvas.height;
        let posy3 = config.miny2 || 0;
        
        if (isPagesEvent) {
            posy1 = 0;
            posy2 = canvas.height;
            posy3 = canvas.height;
            ctx.fillStyle = Math.random() > 0.9 ? "#f00" : "#fff";
        }

        if ( xmax === undefined ) xmax = canvas.width;
        if ( ymax === undefined ) ymax = canvas.height;     
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `#fff`;
        
        for (var i = 0; i <= currentNum; i++) {
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
        const isPagesEvent = typeof eventManager !== 'undefined' && eventManager && eventManager.activeEvent === "Pages Event";
        const n = isPagesEvent ? getRandomInt(50, 150) : getRandomInt(1, 50);
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

    window.addEventListener('keydown', (event) => {
        if (!devMode) return;

        switch (event.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyD': moveRight = true; break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    class Events {
      constructor() {
        this.activeEvent = null;
        this.eventTimer = 0;

        this.eventChances = {
          "Pages Event": 0.02,
          "Game Boy Appearance": 0.05,
          "Normal State": 0.30,
          "Lunar Tear": 0.05,
          "Lamps Blackout": 0.04,      
          "Sign Blackout": 0.04,
          "Complete Blackout": 0.04,
          "Marys Letter": 0.05,
          "Maria Appearance": 0.02,
          "Ashley Appearance": 0.02,
          "Ada Appearance": 0.02,
          "Fukuro Event": 0.02,
          "SH1 Case": 0.04,
          "SH3 Case": 0.04,
          "Simon Phone": 0.04,
          "Doge Appearance": 0.02,
          "Mirror Event": 0.04,
          "Devilz Event": 0.02,
          "Pyramid Head": 0.02,
          "Tyrant Appearance": 0.02,
          "Grimoires Appearance": 0.05,
          "Divergence Meter Appearance": 0.05,
          "Yellow King Appearance": 0.05,
          "Parking Appearance": 0.005,
          "Cafe Appearance": 0.005
        };

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
    let tvModel, barModel, parkingModel, parkingSkybox, parkingGroundPlane, cafeModel, cafeGroundPlane, cafeDustModel, cafeFogVolume, screenEffect, screenUI, screenLight, signLight, signHalo, nightHalo, stripperLight, paradiseLight, meterLight, parkingFillLight1, parkingFillLight2, parkingFillLight3, parkingSkyLight, cafeFillLight1, cafeFillLight2, cafeFillLight3, cafeSkyLight;
    let parkingSkyboxRotationSpeed = 0.05;
    let cafeFogDensityTime = 0;
    let lastImageColorUpdate = 0;
    let extractedImageColor = { r: 0.8, g: 0.8, b: 1.0 };
    let ambientLight, hemisphereLight, directionalLight;
    let eventManager, marysLetter, mariaModel, mariaMixer, ashleyModel, ashleyMixer, adaModel, adaMixer, lunarModel, sh1Model, sh3Model, sh1Mixer, sh3Mixer, simonPhoneModel, simonPhoneMixer, dogeModel, dogeMixer, mirrorModel, mirrorMixer, fukuroModel, fukuroMixer, devilzModel, devilzMixer, pyramidHeadModel, pyramidHeadMixer, tyrantModel, tyrantMixer, gbModel, gbMixer,gbCartridgeModel,grimoiresModel,grimoiresMixer,pagesModel,pagesMixer,tallmanModel,tallmanMixer,dmeterModel,dmeterMixer,ylwkingModel,ylwkingMixer,cafeDustMixer; 
    let pagesList = [];let signFlickerTimer = 0;
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const konamiSequence = [
            ['ArrowUp', 'Up'], 
            ['ArrowUp', 'Up'], 
            ['ArrowDown', 'Down'], 
            ['ArrowDown', 'Down'], 
            ['ArrowLeft', 'Left'], 
            ['ArrowRight', 'Right'], 
            ['ArrowLeft', 'Left'], 
            ['ArrowRight', 'Right'], 
            ['b', 'KeyB'], 
            ['a', 'KeyA']
        ];

        const pressedKey = e.key;
        const pressedCode = e.code;
        const targets = konamiSequence[konamiIndex];
        
        const keyMatch = targets.some(t => {
            const targetLower = t.toLowerCase();
            const pressedKeyLower = pressedKey ? pressedKey.toLowerCase() : '';
            const pressedCodeLower = pressedCode ? pressedCode.toLowerCase() : '';
            
            return pressedKeyLower === targetLower || 
                   pressedCodeLower === targetLower ||
                   pressedCodeLower === 'key' + targetLower;
        });
        
        if (keyMatch) {
            konamiIndex++;
            
            if (pressedKey && pressedKey.includes('Arrow')) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (konamiIndex === konamiSequence.length) {
                console.log("Konami Code Successfully Triggered!");
                alert("There was developer mode here. Its gone now.\nsilentwave2@0xNC(https://github.com/FullmetalNeverCore),EternalXero");
                
                isDevModeAuthorized = true; 

                
                if (controls) controls.lock();




                
                if (screenEffect) {
                    screenEffect.remove('image');
                    screenEffect.add('image', { src: 'https://i.imgur.com/LS1FPPH.gif', blur: 1.2 });
                }
                
                konamiIndex = 0;
            }
        } else {
            if (konamiIndex > 0) {
                konamiIndex = 0;
            }
        }

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

        if (devMode && controls && !controls.isLocked) {
            controls.lock();
            return;
        }

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

    function initSpatialAudio() {
    }

    window.initSpatialAudio = initSpatialAudio;

    function extractImageColor() {
        if (!screenEffect || !screenEffect.effects || !screenEffect.effects.image || !screenEffect.effects.image.node) {
            return null;
        }
        
        const img = screenEffect.effects.image.node;
        if (!img.complete || img.naturalWidth === 0) {
            return null;
        }
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(img.naturalWidth, 100);
            canvas.height = Math.min(img.naturalHeight, 100);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < data.length; i += 16) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            
            if (count > 0) {
                return {
                    r: (r / count) / 255,
                    g: (g / count) / 255,
                    b: (b / count) / 255
                };
            }
        } catch (e) {
            console.warn('Failed to extract image color:', e);
        }
        
        return null;
    }

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, -1.2, 16); 

        const barManager = new THREE.LoadingManager();
        const barLoader = new THREE.GLTFLoader(barManager);
        const gltfLoader = new THREE.GLTFLoader();
        const tvLoader = new THREE.FBXLoader(); 

        controls = new THREE.PointerLockControls(camera, document.body);
        scene.add(controls.getObject());

        eventManager = new Events();


        if (eventManager && eventManager.activeEvent === "Cafe Appearance") {
            camera.position.set(0, -1.25, 8);
        }

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
        cssRenderer.domElement.style.pointerEvents = 'none'; 
        cssRenderer.domElement.style.zIndex = '10';
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

        screenLight = new THREE.PointLight(0x5555ff, 25, 20); 
        screenLight.position.set(0, 30, 20); 
        screenLight.castShadow = true;
        screenLight.shadow.bias = -0.001;

        let modelsToLoad = 2;
        let modelsLoadedCount = 0;
        
        const onModelLoaded = () => {
            modelsLoadedCount++;
            if (modelsLoadedCount >= modelsToLoad) {
                modelsLoaded = true;
                checkIntroDone();
            }
        };

        if (eventManager && eventManager.activeEvent === "Parking Appearance") {

            scene.fog = new THREE.FogExp2(0xcccccc, 0.001);
            

            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(window.ASSETS.parking_skybox, (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                texture.mapping = THREE.EquirectangularReflectionMapping;
                

                const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
                const skyMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                });
                parkingSkybox = new THREE.Mesh(skyGeometry, skyMaterial);
                parkingSkybox.scale.set(1.9, 1.9, 1.9);
                parkingSkybox.rotation.y = 0;
                scene.add(parkingSkybox);
            });
            

            if (ambientLight) {
                ambientLight.color.setHex(0xffffff);
                ambientLight.intensity = 0.6;
            }
            if (hemisphereLight) {
                hemisphereLight.color.setHex(0xffffff);
                hemisphereLight.groundColor.setHex(0xdddddd);
                hemisphereLight.intensity = 0.8;
            }
            if (directionalLight) {
                directionalLight.color.setHex(0xffffff);
                directionalLight.intensity = 1.2;
                directionalLight.position.set(10, 20, 10);

                directionalLight.castShadow = true;
                directionalLight.shadow.camera.left = -200;
                directionalLight.shadow.camera.right = 200;
                directionalLight.shadow.camera.top = 200;
                directionalLight.shadow.camera.bottom = -200;
                directionalLight.shadow.camera.near = 0.5;
                directionalLight.shadow.camera.far = 500;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                directionalLight.shadow.bias = -0.0001;
            }
            

            parkingFillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
            parkingFillLight1.position.set(-20, 15, 20);
            parkingFillLight1.castShadow = false;
            scene.add(parkingFillLight1);
            
            parkingFillLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
            parkingFillLight2.position.set(0, 25, 30);
            parkingFillLight2.castShadow = false;
            scene.add(parkingFillLight2);
            
            parkingFillLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
            parkingFillLight3.position.set(20, 10, 15);
            parkingFillLight3.castShadow = false;
            scene.add(parkingFillLight3);
            

            parkingSkyLight = new THREE.DirectionalLight(0xffffff, 0.6);
            parkingSkyLight.position.set(0, 50, 0);
            parkingSkyLight.castShadow = true;
            parkingSkyLight.shadow.camera.left = -300;
            parkingSkyLight.shadow.camera.right = 300;
            parkingSkyLight.shadow.camera.top = 300;
            parkingSkyLight.shadow.camera.bottom = -300;
            parkingSkyLight.shadow.camera.near = 0.5;
            parkingSkyLight.shadow.camera.far = 500;
            parkingSkyLight.shadow.mapSize.width = 2048;
            parkingSkyLight.shadow.mapSize.height = 2048;
            parkingSkyLight.shadow.bias = -0.0001;
            scene.add(parkingSkyLight);
            
            barLoader.load(window.ASSETS.parking_model, (gltf) => {
                parkingModel = gltf.scene;
                parkingModel.scale.set(31.53, 31.53, 31.53); 
                parkingModel.position.set(73.04, -68.95, -17.42); 
                parkingModel.rotation.set(0.05, -1.30, 0.05);
                scene.add(parkingModel);
                

                const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
                const groundMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    roughness: 0.9,
                    metalness: 0.0
                });
                parkingGroundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
                parkingGroundPlane.rotation.x = -Math.PI / 2;

                parkingGroundPlane.position.set(
                    parkingModel.position.x,
                    parkingModel.position.y - 5,
                    parkingModel.position.z
                );
                parkingGroundPlane.receiveShadow = true;
                parkingGroundPlane.castShadow = false;
                scene.add(parkingGroundPlane);
                

                if (directionalLight) {
                    directionalLight.shadow.camera.left = -300;
                    directionalLight.shadow.camera.right = 300;
                    directionalLight.shadow.camera.top = 300;
                    directionalLight.shadow.camera.bottom = -300;
                    directionalLight.shadow.camera.updateProjectionMatrix();
                }
                
                if (parkingSkyLight) {
                    parkingSkyLight.shadow.camera.left = -300;
                    parkingSkyLight.shadow.camera.right = 300;
                    parkingSkyLight.shadow.camera.top = 300;
                    parkingSkyLight.shadow.camera.bottom = -300;
                    parkingSkyLight.shadow.camera.updateProjectionMatrix();
                }
                
                parkingModel.traverse((child) => {
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
                onModelLoaded();
            });
        } else if (eventManager && eventManager.activeEvent === "Cafe Appearance") {

            scene.fog = null;
            if (renderer) renderer.setClearColor(0xcccccc, 1);
            

            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(window.ASSETS.parking_skybox, (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                texture.mapping = THREE.EquirectangularReflectionMapping;
                const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
                const skyMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                });
                parkingSkybox = new THREE.Mesh(skyGeometry, skyMaterial);
                parkingSkybox.scale.set(1.9, 1.9, 1.9);
                scene.add(parkingSkybox);
            });


            if (ambientLight) {
                ambientLight.color.setHex(0xffffff);
                ambientLight.intensity = 0.05;
            }
            if (hemisphereLight) {
                hemisphereLight.color.setHex(0xffffff);
                hemisphereLight.groundColor.setHex(0x111111);
                hemisphereLight.intensity = 0.08;
            }
            if (directionalLight) {
                directionalLight.color.setHex(0xffffff);
                directionalLight.intensity = 0.2;
                directionalLight.position.set(10, 20, 10);
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.left = -300;
                directionalLight.shadow.camera.right = 300;
                directionalLight.shadow.camera.top = 300;
                directionalLight.shadow.camera.bottom = -300;
                directionalLight.shadow.camera.updateProjectionMatrix();
            }
            

            cafeFillLight1 = new THREE.DirectionalLight(0xffffff, 0.05);
            cafeFillLight1.position.set(-20, 15, 20);
            scene.add(cafeFillLight1);
            
            cafeFillLight2 = new THREE.DirectionalLight(0xffffff, 0.03);
            cafeFillLight2.position.set(0, 25, 30);
            scene.add(cafeFillLight2);
            
            cafeFillLight3 = new THREE.DirectionalLight(0xffffff, 0.02);
            cafeFillLight3.position.set(20, 10, 15);
            scene.add(cafeFillLight3);
            
            cafeSkyLight = new THREE.DirectionalLight(0xffffff, 0.08);
            cafeSkyLight.position.set(0, 50, 0);
            cafeSkyLight.castShadow = true;
            scene.add(cafeSkyLight);
            
            barLoader.load(
                window.ASSETS.cafe_model,
                (gltf) => {
                    cafeModel = gltf.scene;
                    cafeModel.scale.set(1.41, 1.41, 1.41); 
                    cafeModel.position.set(-5.09, -2.84, -0.49); 
                    cafeModel.rotation.set(0, 0.89, 0);
                    cafeModel.visible = true;
                    scene.add(cafeModel);
                    
                    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
                    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
                    cafeGroundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
                    cafeGroundPlane.rotation.x = -Math.PI / 2;
                    cafeGroundPlane.position.set(-5.09, -2.9, -0.49);
                    cafeGroundPlane.receiveShadow = true;
                    scene.add(cafeGroundPlane);
                    
                    cafeModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material && child.material.map) child.material.map.encoding = THREE.sRGBEncoding;
                        }
                    });

                    onModelLoaded();
                },
                undefined,
                (error) => {
                    console.error('Failed to load cafe model:', error);
                    onModelLoaded();
                }
            );
            

            const fogGeometry = new THREE.SphereGeometry(15, 32, 32);
            const fogMaterial = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                fog: false
            });
            cafeFogVolume = new THREE.Mesh(fogGeometry, fogMaterial);
            cafeFogVolume.position.set(0.04, -1.40, 4.85);
            cafeFogVolume.scale.set(1, 1.5, 1);
            cafeFogVolume.visible = true;
            cafeFogVolume.renderOrder = -1;
            scene.add(cafeFogVolume);
            

            if (window.ASSETS.cafe_dust) {
                barLoader.load(
                    window.ASSETS.cafe_dust,
                    (gltf) => {
                        cafeDustModel = gltf.scene;

                        cafeDustModel.position.set(0.04, -1.40, 4.85);
                        cafeDustModel.rotation.set(0, 0, 0);
                        cafeDustModel.scale.set(1.41, 1.41, 1.41);
                        cafeDustModel.visible = true;
                        scene.add(cafeDustModel);
                        

                        cafeDustModel.traverse((child) => {
                            if (child.isMesh) {
                                child.frustumCulled = false;
                                child.castShadow = false;
                                child.receiveShadow = false;

                                if (child.material) {
                                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                                    materials.forEach(mat => {
                                        if (mat) {
                                            if (mat.transparent === undefined) mat.transparent = true;
                                            if (mat.opacity === undefined) mat.opacity = 0.5;
                                        }
                                    });
                                }
                            }
                        });
                        

                        if (gltf.animations && gltf.animations.length > 0) {
                            cafeDustMixer = new THREE.AnimationMixer(cafeDustModel);
                            gltf.animations.forEach(clip => {
                                cafeDustMixer.clipAction(clip).play();
                            });
                        }
                    },
                    undefined,
                    (error) => {
                        console.warn('Failed to load cafe dust effect:', error);
                    }
                );
            }
        } else {
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
                onModelLoaded();
            });
        }

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

            if (eventManager && eventManager.activeEvent === "Cafe Appearance") {
                tvModel.position.set(0.04, -1.40, 4.85); 
                tvModel.rotation.set(0, 0, 0); 
                tvModel.scale.set(0.006, 0.006, 0.006);

                if (screenLight) {
                    screenLight.castShadow = false;
                }
            } else {
                tvModel.position.set(0.3, -3, 0); 
                tvModel.rotation.y = 0; 
                tvModel.scale.set(0.05, 0.05, 0.05);

                if (screenLight) {
                    screenLight.castShadow = true;
                }
            }
            scene.add(tvModel);
            tvModel.add(screenLight); 

            screenUI = setupCSSContent(screenMesh);
            screenUI.scale.set(0.075, 0.075, 0.075);
            screenUI.position.z = -15; 

            const eventsToLoad = ["Marys Letter", "Maria Appearance", "Ashley Appearance", "Ada Appearance", "Lunar Tear", "SH1 Case", "SH3 Case", "Simon Phone", "Doge Appearance", "Mirror Event", "Fukuro Event", "Devilz Event", "Pyramid Head", "Tyrant Appearance", "Game Boy Appearance", "Grimoires Appearance", "Pages Event", "Yellow King Appearance"];
            if (eventManager && eventsToLoad.includes(eventManager.activeEvent)) {
                if (eventManager.activeEvent === "Game Boy Appearance") modelsToLoad += 2;
                else modelsToLoad++;
            }

            onModelLoaded();

            if (eventManager && eventManager.activeEvent === "Game Boy Appearance") {
                gltfLoader.load(window.ASSETS.gb_model, (gltf) => {
                    gbModel = gltf.scene;
                    gbModel.position.set(-2.8110, -2.3530, -0.4820);
                    gbModel.rotation.set(-0.3190, -0.0440, -0.0080);
                    gbModel.scale.set(9.3774, 9.3774, 9.3774);

                    gbModel.traverse((child) => { 
                        if (child.isMesh) { 
                            child.frustumCulled = false;
                            child.castShadow = true; 
                            child.receiveShadow = true; 
                            
                            if (child.material) {
                                const mats = Array.isArray(child.material) ? child.material : [child.material];
                                mats.forEach(m => {
                                    m.transparent = false; 
                                    m.depthWrite = true;
                                    m.depthTest = true;

                                    m.side = THREE.DoubleSide; 
                                    if (m.map) {
                                        m.map.encoding = THREE.sRGBEncoding;
                                        m.map.anisotropy = 16;
                                    }
                                    m.roughness =  0.7;
                                    m.metalness =  0.2;
                                });
                            }
                        } 
                    });

                    if (gltf.animations && gltf.animations.length > 0) {
                        gbMixer = new THREE.AnimationMixer(gbModel);
                        gbMixer.clipAction(gltf.animations[0]).play();
                    }

                    gbModel.visible = true; 
                    scene.add(gbModel);
                    onModelLoaded();

                    const texLoader = new THREE.TextureLoader();

                    const cartBase = texLoader.load(window.ASSETS.gb_cart_base);
                    const cartMetal = texLoader.load(window.ASSETS.gb_cart_metal);
                    const cartRough = texLoader.load(window.ASSETS.gb_cart_rough);
                    const cartAO = texLoader.load(window.ASSETS.gb_cart_ao);

                    cartBase.encoding = THREE.sRGBEncoding;

                    tvLoader.load(window.ASSETS.gb_cartridge, (object) => {
                        gbCartridgeModel = object;
                        gbCartridgeModel.position.set(-0.215, -3.002, 1.617);
                        gbCartridgeModel.rotation.set(0.08, 0, 0);
                        gbCartridgeModel.scale.set(0.0023, 0.0023, 0.0023);

                        const cartMaterial = new THREE.MeshStandardMaterial({
                            map: cartBase,
                            metalnessMap: cartMetal,
                            roughnessMap: cartRough,
                            aoMap: cartAO,
                            aoMapIntensity: 1.0,
                            metalness: 1.0,
                            roughness: 1.0,
                            side: THREE.DoubleSide
                        });
                
                        gbCartridgeModel.traverse((child) => {
                            if (child.isMesh) {
                                child.frustumCulled = false;
                                child.castShadow = true;
                                child.receiveShadow = true;

                                child.material = cartMaterial;

                                if (child.geometry.attributes.uv && !child.geometry.attributes.uv2) {
                                    child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                                }
                            }
                        });
                        scene.add(gbCartridgeModel);
                        onModelLoaded();
                    });
                });
            }

            if (eventManager && eventManager.activeEvent === "Marys Letter") {
                textureLoader.load(window.ASSETS.mary_letter, (tex) => {
                    tex.encoding = THREE.sRGBEncoding;
                    tex.anisotropy = 16;
                    const aspect = tex.image.width / tex.image.height;
                    const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
                    const material = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, roughness: 0.7, metalness: 0.1 });
                    marysLetter = new THREE.Mesh(geometry, material);
                    marysLetter.position.set(-0.4, -3.0, 2.2); 
                    marysLetter.rotation.x = -1.52;
                    marysLetter.rotation.y = -0.01;
                    marysLetter.scale.set(0.7, 0.7, 0.7);
                    marysLetter.visible = false; 
                    scene.add(marysLetter);
                    onModelLoaded();
                });
            }

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

            if (eventManager && eventManager.activeEvent === "Grimoires Appearance") {
                gltfLoader.load(window.ASSETS.grimoires, (gltf) => {
                    grimoiresModel = gltf.scene;
                    grimoiresModel.position.set(20.70, 15.00, -41.10); 
                    grimoiresModel.rotation.set(0.00, 0.14, 0);
                    grimoiresModel.scale.set(0.05, 0.05, 0.05); 
                    grimoiresModel.traverse((child) => {
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
                        grimoiresMixer = new THREE.AnimationMixer(grimoiresModel);
                        const action = grimoiresMixer.clipAction(gltf.animations[0]);
                        action.setLoop(THREE.LoopPingPong);
                        action.play();
                    }
                    grimoiresModel.visible = true; 
                    scene.add(grimoiresModel);
                    onModelLoaded();
                });
            }

            if (eventManager && eventManager.activeEvent === "Divergence Meter Appearance") {
                gltfLoader.load(window.ASSETS.dmeter_model, (gltf) => {
                    dmeterModel = gltf.scene;
                    dmeterModel.position.set(0.00, -0.50, 0.70);
                    dmeterModel.rotation.set(0, 0, 0);
                    dmeterModel.scale.set(5.64, 5.64, 5.64);

                    dmeterModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            materials.forEach(mat => {
                                if (!mat) return;
                                const matName = mat.name ? mat.name.toLowerCase() : "";
                                if (matName.includes("number") || matName.includes("glow") || matName.includes("orange") || matName.includes("emissive") || matName.includes("filament")) {
                                    mat.color.setHex(0x221100); 
                                    mat.emissive.setHex(0xff4400);
                                    mat.emissiveIntensity = 300.0; 
                                    mat.toneMapped = false;
                                }
                            });
                        }
                    });

                    scene.add(dmeterModel);
                    onModelLoaded();
                });
            }

            if (eventManager && eventManager.activeEvent === "Yellow King Appearance") {
                gltfLoader.load(window.ASSETS.ylwking_model, (gltf) => {
                    ylwkingModel = gltf.scene;
                    ylwkingModel.position.set(-2.15, -3.05, 2.05); 
                    ylwkingModel.rotation.set(0.05, -0.55, 0);
                    ylwkingModel.scale.set(36.39, 36.39, 36.39);
                    
                    ylwkingModel.traverse((child) => {
                        if (child.isMesh || child.isSkinnedMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => {
                                    if (mat.map) {
                                        mat.map.encoding = THREE.sRGBEncoding;
                                        mat.map.anisotropy = 16;
                                    }
                                });
                            }
                        }
                    });

                    if (gltf.animations && gltf.animations.length > 0) {
                        ylwkingMixer = new THREE.AnimationMixer(ylwkingModel);
                        ylwkingMixer.clipAction(gltf.animations[0]).play();
                    }
                    
                    scene.add(ylwkingModel);
                    onModelLoaded();
                });
            }

            if (eventManager && eventManager.activeEvent === "Pages Event") {
                gltfLoader.load(window.ASSETS.pages_model, (gltf) => {
                    pagesModel = gltf.scene;
                    
                    pagesModel.position.set(13.12, 9.68, -51.77);
                    pagesModel.rotation.set(0.02, 0.11, 0);
                    pagesModel.scale.set(51.291, 51.291, 51.291);
                    
                    pagesList = [];
                    pagesModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            pagesList.push(child);
                        }
                    });

                    pagesList.forEach((page, index) => {
                        if (index === 0) {
                            page.position.set(0, -3.16, 0);
                            page.rotation.set(0, 0.03, 0.63);
                            page.scale.set(1.138, 1.138, 1.138);
                        } else if (index === 1) {
                            page.position.set(-0.48, 3.73, 0.29);
                            page.rotation.set(0, 0, 0);
                            page.scale.set(1.52, 1.52, 1.52);
                        } else if (index === 2) {
                            page.position.set(0, -1.24, 0);
                            page.rotation.set(0, 0, -0.63);
                            page.scale.set(1.5, 1.5, 1.5);
                        } else if (index === 3) {
                            page.position.set(-6.99, 0, 0);
                            page.rotation.set(0, 0, 0);
                            page.scale.set(1.5, 1.5, 1.5);
                        } else if (index === 4) {
                            page.position.set(-2.78, 4.12, 0);
                            page.rotation.set(0, 0, -0.56);
                            page.scale.set(1.52, 1.52, 1.52);
                        } else if (index === 5) {
                            page.position.set(2.2, 0, 0);
                            page.rotation.set(0, 0, 0);
                            page.scale.set(1.5, 1.5, 1.5);
                        } else if (index === 6) {
                            page.position.set(-1.63, -3.16, 0);
                            page.rotation.set(0, 0, 0.6);
                            page.scale.set(1.5, 1.5, 1.5);
                        } else if (index === 7) {
                            page.position.set(0, 1.44, 0);
                            page.rotation.set(0, 0, 0.17);
                            page.scale.set(1.5, 1.5, 1.5);
                        }
                    });
                    
                    if (gltf.animations && gltf.animations.length > 0) {
                        pagesMixer = new THREE.AnimationMixer(pagesModel);
                        gltf.animations.forEach(clip => {
                            pagesMixer.clipAction(clip).play();
                        });
                    }
                    
                    scene.add(pagesModel);
                    onModelLoaded();
                });
                gltfLoader.load(window.ASSETS.tallman_model, (gltf) => {
                    tallmanModel = gltf.scene;
                    
                    tallmanModel.position.set(57.00, -19.30, -52.50);
                    tallmanModel.rotation.set(-0.01, -0.66, 0);
                    tallmanModel.scale.set(10.35, 10.35, 10.35);
                    tallmanModel.visible = false; 
                    tallmanModel.userData.hasFlickeredOnce = false; 
                    
                    if (gltf.animations && gltf.animations.length > 0) {
                        tallmanMixer = new THREE.AnimationMixer(tallmanModel);
                        tallmanMixer.clipAction(gltf.animations[0]).play();
                    }
                    
                    scene.add(tallmanModel);
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
            vcr: { enabled: true, options: { opacity: 0.4 + Math.random() * 0.6, miny: 220, miny2: 220, num: 15 + Math.random() * 60, fps: 24 } },
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

        if (devMode && controls && controls.isLocked) {
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); 

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        }

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
        if (gbMixer) gbMixer.update(delta);
        if (grimoiresMixer) grimoiresMixer.update(delta);
        if (pagesMixer) pagesMixer.update(delta);
        if (tallmanMixer) tallmanMixer.update(delta);
        if (ylwkingMixer) ylwkingMixer.update(delta);
        if (cafeDustMixer) cafeDustMixer.update(delta);

        camera.updateMatrixWorld();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        if (screenUI) {
            screenUI.getWorldPosition(screenWorldPos);
            const isVisible = frustum.containsPoint(screenWorldPos);
            
            const isPagesEvent = typeof eventManager !== 'undefined' && eventManager && eventManager.activeEvent === "Pages Event";
            const element = screenUI.element; 

            if (isPagesEvent) {
                if (Math.random() > 0.9) {
                    element.style.left = `${(Math.random()-0.5)*10}px`;
                    element.style.top = `${(Math.random()-0.5)*10}px`;
                    if (Math.random() > 0.95) element.style.filter = `hue-rotate(${Math.random()*360}deg) brightness(2)`;
                } else {
                    element.style.left = '0';
                    element.style.top = '0';
                    element.style.filter = '';
                }
            } else {
                element.style.left = '0';
                element.style.top = '0';
                element.style.filter = '';
            }

            if (!isVisible) {
                if (screenUI.element.style.display !== 'none') {
                    screenUI.element.style.display = 'none';
                    if (screenEffect) screenEffect.setVisibility(false);
                }
            } else {
                if (screenUI.element.style.display === 'none') {
                    screenUI.element.style.display = 'block';
                    if (screenEffect) screenEffect.setVisibility(true);
                }
            }
        }
        
        const isParkingEvent = eventManager && eventManager.activeEvent === "Parking Appearance";
        const isCafeEvent = eventManager && eventManager.activeEvent === "Cafe Appearance";
        const isSpecialEvent = eventManager && (eventManager.activeEvent === "Pyramid Head" || eventManager.activeEvent === "Tyrant Appearance" || eventManager.activeEvent === "Complete Blackout" || eventManager.activeEvent === "Pages Event");

        if (isParkingEvent) {

            if (!scene.fog) {
                scene.fog = new THREE.FogExp2(0xcccccc, 0.015);
            }
            if (ambientLight && ambientLight.intensity < 0.6) {
                ambientLight.color.setHex(0xffffff);
                ambientLight.intensity = 0.6;
            }
            if (hemisphereLight && hemisphereLight.intensity < 0.8) {
                hemisphereLight.color.setHex(0xffffff);
                hemisphereLight.groundColor.setHex(0xdddddd);
                hemisphereLight.intensity = 0.8;
            }
            if (directionalLight && directionalLight.intensity < 1.2) {
                directionalLight.color.setHex(0xffffff);
                directionalLight.intensity = 1.2;
            }

            if (parkingFillLight1 && parkingFillLight1.intensity < 0.5) {
                parkingFillLight1.intensity = 0.5;
            }
            if (parkingFillLight2 && parkingFillLight2.intensity < 0.4) {
                parkingFillLight2.intensity = 0.4;
            }
            if (parkingFillLight3 && parkingFillLight3.intensity < 0.3) {
                parkingFillLight3.intensity = 0.3;
            }

            if (parkingSkybox) {
                parkingSkybox.rotation.y += delta * parkingSkyboxRotationSpeed;
            }
        } else if (isCafeEvent) {

            

            if (cafeFogVolume && cafeFogVolume.material) {
                cafeFogDensityTime += delta;
                const baseOpacity = 0.2;
                const opacityVariation = 0.15;
                const fogOpacity = baseOpacity + (Math.sin(cafeFogDensityTime * 0.3) * 0.5 + 0.5) * opacityVariation;
                cafeFogVolume.material.opacity = fogOpacity;
            }
            

            if (ambientLight && ambientLight.intensity > 0.05) {
                ambientLight.color.setHex(0xffffff);
                ambientLight.intensity = 0.05;
            }
            if (hemisphereLight && hemisphereLight.intensity > 0.08) {
                hemisphereLight.color.setHex(0xffffff);
                hemisphereLight.groundColor.setHex(0x111111);
                hemisphereLight.intensity = 0.08;
            }
            if (directionalLight && directionalLight.intensity > 0.2) {
                directionalLight.color.setHex(0xffffff);
                directionalLight.intensity = 0.2;
            }

            if (cafeFillLight1 && cafeFillLight1.intensity > 0.05) {
                cafeFillLight1.intensity = 0.05;
            }
            if (cafeFillLight2 && cafeFillLight2.intensity > 0.03) {
                cafeFillLight2.intensity = 0.03;
            }
            if (cafeFillLight3 && cafeFillLight3.intensity > 0.02) {
                cafeFillLight3.intensity = 0.02;
            }
            if (cafeSkyLight && cafeSkyLight.intensity > 0.08) {
                cafeSkyLight.intensity = 0.08;
            }
        } else if (isSpecialEvent) {
            if (ambientLight) ambientLight.intensity = 0;
            if (hemisphereLight) hemisphereLight.intensity = 0;
            if (directionalLight) directionalLight.intensity = 0;
            if (stripperLight) stripperLight.intensity = 0;
            if (paradiseLight) paradiseLight.intensity = 0;

            if (signLight && nightHalo) {
                if (signFlickerTimer > 0) {
                    signFlickerTimer--;
                    
                    let currentIntensity = 72;
                    if (signFlickerTimer < 60) {
                        if (Math.random() > 0.7) {
                            currentIntensity = 0;
                        } else {
                            currentIntensity = 30 + Math.random() * 42;
                        }
                    }
                    
                    signLight.intensity = currentIntensity;
                    nightHalo.intensity = currentIntensity;

                    if (eventManager.activeEvent === "Pages Event" && tallmanModel && tallmanModel.userData.isChosenToBeVisible) {
                        tallmanModel.visible = currentIntensity > 0;
                    }
                    
                    if (signFlickerTimer <= 0) {
                        signDarknessTimer = 180 + Math.random() * 120;
                        if (tallmanModel) {
                            tallmanModel.visible = false; 
                            tallmanModel.userData.isChosenToBeVisible = false;
                        }
                    }
                } else if (signDarknessTimer > 0) {
                    signDarknessTimer--;
                    signLight.intensity = 0;
                    nightHalo.intensity = 0;
                    if (tallmanModel) {
                        tallmanModel.visible = false;
                        tallmanModel.userData.isChosenToBeVisible = false;
                    }
                } else if (Math.random() > 0.995) { 
                    signFlickerTimer = 120 + Math.random() * 60;
                    
                    if (eventManager.activeEvent === "Pages Event" && tallmanModel) {
                        if (tallmanModel.userData.hasFlickeredOnce) {
                            tallmanModel.userData.isChosenToBeVisible = Math.random() < 0.15;
                        } else {
                            tallmanModel.userData.hasFlickeredOnce = true;
                            tallmanModel.userData.isChosenToBeVisible = false;
                        }
                        tallmanModel.visible = tallmanModel.userData.isChosenToBeVisible;
                    }
                } else {
                    signLight.intensity = 0;
                    nightHalo.intensity = 0;
                    if (tallmanModel) {
                        tallmanModel.visible = false;
                        tallmanModel.userData.isChosenToBeVisible = false;
                    }
                }
            }
        } else {
            if (tallmanModel) tallmanModel.visible = false; 
            

            if (!isParkingEvent && !isCafeEvent) {

                if (scene.fog) scene.fog = null;
                

                if (parkingFillLight1 && scene.children.includes(parkingFillLight1)) {
                    scene.remove(parkingFillLight1);
                    parkingFillLight1 = null;
                }
                if (parkingFillLight2 && scene.children.includes(parkingFillLight2)) {
                    scene.remove(parkingFillLight2);
                    parkingFillLight2 = null;
                }
                if (parkingFillLight3 && scene.children.includes(parkingFillLight3)) {
                    scene.remove(parkingFillLight3);
                    parkingFillLight3 = null;
                }

                if (parkingSkyLight && scene.children.includes(parkingSkyLight)) {
                    scene.remove(parkingSkyLight);
                    parkingSkyLight = null;
                }

                if (parkingGroundPlane && scene.children.includes(parkingGroundPlane)) {
                    scene.remove(parkingGroundPlane);
                    parkingGroundPlane = null;
                }
                

                if (cafeFillLight1 && scene.children.includes(cafeFillLight1)) {
                    scene.remove(cafeFillLight1);
                    cafeFillLight1 = null;
                }
                if (cafeFillLight2 && scene.children.includes(cafeFillLight2)) {
                    scene.remove(cafeFillLight2);
                    cafeFillLight2 = null;
                }
                if (cafeFillLight3 && scene.children.includes(cafeFillLight3)) {
                    scene.remove(cafeFillLight3);
                    cafeFillLight3 = null;
                }

                if (cafeSkyLight && scene.children.includes(cafeSkyLight)) {
                    scene.remove(cafeSkyLight);
                    cafeSkyLight = null;
                }

                if (cafeGroundPlane && scene.children.includes(cafeGroundPlane)) {
                    scene.remove(cafeGroundPlane);
                    cafeGroundPlane = null;
                }

                if (cafeDustModel && scene.children.includes(cafeDustModel)) {
                    scene.remove(cafeDustModel);
                    cafeDustModel = null;
                }

                if (cafeFogVolume && scene.children.includes(cafeFogVolume)) {
                    scene.remove(cafeFogVolume);
                    cafeFogVolume = null;
                }
                

                cafeFogDensityTime = 0;
                
                if (ambientLight && ambientLight.intensity === 0) ambientLight.intensity = 0.01;
                if (hemisphereLight && hemisphereLight.intensity === 0) hemisphereLight.intensity = 0.02;
                if (directionalLight && directionalLight.intensity === 0) directionalLight.intensity = 0.2;
            }

        if (screenLight && screenLight.color) {
            try {
                const baseIntensity = 5;
                screenLight.intensity = (baseIntensity * 0.8) + Math.random() * baseIntensity;
                

                const now = performance.now();
                if (now - lastImageColorUpdate > 500) {
                    const extractedColor = extractImageColor();
                    if (extractedColor) {
                        extractedImageColor = extractedColor;
                        lastImageColorUpdate = now;
                    }
                }
                

                const colorVariation = 0.1;
                const r = Math.max(0, Math.min(1, extractedImageColor.r + (Math.random() - 0.5) * colorVariation));
                const g = Math.max(0, Math.min(1, extractedImageColor.g + (Math.random() - 0.5) * colorVariation));
                const b = Math.max(0, Math.min(1, extractedImageColor.b + (Math.random() - 0.5) * colorVariation));
                screenLight.color.setRGB(r, g, b);
                
                if (Math.random() > 0.99) screenLight.intensity = baseIntensity * 0.2;
            } catch (e) {}
        }

        if (dmeterModel && eventManager.activeEvent === "Divergence Meter Appearance") {
            let flickerFactor = Math.random();
            let baseScale = 1.0;

            if (flickerFactor > 0.98) baseScale = 0.05;
            else if (flickerFactor > 0.9) baseScale = 0.4 + Math.random() * 0.6;
            else baseScale = 0.85 + Math.random() * 0.3;
            
            dmeterModel.traverse((child) => {
                if (child.isMesh) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat && mat.emissive && !mat.toneMapped) {
                            let localFlicker = baseScale * 35.0; 
                            if (Math.random() > 0.85) localFlicker *= (0.3 + Math.random() * 0.7);
                            mat.emissiveIntensity = localFlicker;
                        }
                    });
                }
            });
        }

            if (signLight && nightHalo) {
                if (eventManager && (eventManager.activeEvent === "Sign Blackout" || eventManager.activeEvent === "Complete Blackout" || eventManager.activeEvent === "Ada Appearance")) {
                    signLight.intensity = 0; nightHalo.intensity = 0;
                } else if (eventManager && eventManager.activeEvent === "Mirror Event") {
                    signLight.color.setHex(0xff0000); nightHalo.color.setHex(0x880000);
                    if (Math.random() < 0.95) { signLight.intensity = 72; nightHalo.intensity = 72; }
                    else { signLight.intensity = 0; nightHalo.intensity = 0; }
                } else {
                    if (signLight.color.getHex() !== 0xff00ff) signLight.color.setHex(0xff00ff);
                    if (nightHalo.color.getHex() !== 0x8000FF) nightHalo.color.setHex(0x8000FF);
                    const neonChance = Math.random();
                    if (neonChance < 0.95) { signLight.intensity = 72; nightHalo.intensity = 72; }
                    else if (neonChance < 0.98) { signLight.intensity = 20 + Math.random() * 20; nightHalo.intensity = 20 + Math.random() * 20; }
                    else { signLight.intensity = 0; nightHalo.intensity = 0; }
                }
            }

            if (stripperLight || paradiseLight) {
                if (eventManager && (eventManager.activeEvent === "Lamps Blackout" || eventManager.activeEvent === "Complete Blackout")) {
                    if (stripperLight) stripperLight.intensity = 0;
                    if (paradiseLight) paradiseLight.intensity = 0;
                } else if (eventManager && eventManager.activeEvent === "Divergence Meter Appearance") {
                    if (stripperLight) stripperLight.intensity = 0;
                    if (paradiseLight) paradiseLight.intensity = 15;
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
        if (ylwkingModel) ylwkingModel.visible = (eventManager && eventManager.activeEvent === "Yellow King Appearance");
        if (cafeDustModel) cafeDustModel.visible = (eventManager && eventManager.activeEvent === "Cafe Appearance");
        if (cafeFogVolume) cafeFogVolume.visible = (eventManager && eventManager.activeEvent === "Cafe Appearance");
        if (gbModel) {
            const isGBActive = (eventManager && eventManager.activeEvent === "Game Boy Appearance");
            gbModel.visible = isGBActive;
            if (gbCartridgeModel) gbCartridgeModel.visible = isGBActive;
        }

        try {
            if (renderer && scene && camera) renderer.render(scene, camera);
            
            const now = performance.now();
            if (!window._lastCSSRender) window._lastCSSRender = 0;
            
            if (cssRenderer && scene && camera && screenUI && screenUI.element.style.display !== 'none') {
                if (now - window._lastCSSRender > 32) {
                    cssRenderer.render(scene, camera);
                    window._lastCSSRender = now;
                }
            }
        } catch (e) {}
    }

    function setupGUI() {
        if (typeof dat === 'undefined') return;
        
        try {
            const existing = document.querySelector('.dg.main');
            if (existing) existing.parentElement.removeChild(existing);
            
            const gui = new dat.GUI();
            if (gui.domElement) {
                gui.domElement.style.zIndex = "10005";
            }

            const addFolderDefensive = (name, model, isTV = false) => {
                if (!model || !model.position || !model.rotation || !model.scale) return;
                
                try {
                    const folder = gui.addFolder(name);
                    const params = {
                        posX: model.position.x,
                        posY: model.position.y,
                        posZ: model.position.z,
                        rotX: model.rotation.x,
                        rotY: model.rotation.y,
                        rotZ: model.rotation.z || 0,
                        scale: model.scale.x,
                        print: () => {
                            console.log(`${name} Position: [${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)}]`);
                            console.log(`${name} Rotation: [${model.rotation.x.toFixed(2)}, ${model.rotation.y.toFixed(2)}, ${model.rotation.z.toFixed(2)}]`);
                            console.log(`${name} Scale: ${model.scale.x.toFixed(4)}`);
                            alert(`${name} Pos: ${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)}\nRot: [${model.rotation.x.toFixed(2)}, ${model.rotation.y.toFixed(2)}, ${model.rotation.z.toFixed(2)}]\nScale: ${model.scale.x.toFixed(4)}`);
                        }
                    };

                    folder.add(params, 'posX', -200, 200).step(0.01).onChange(v => model.position.x = v);
                    folder.add(params, 'posY', -200, 200).step(0.01).onChange(v => model.position.y = v);
                    folder.add(params, 'posZ', -200, 200).step(0.01).onChange(v => model.position.z = v);
                    folder.add(params, 'rotX', -Math.PI, Math.PI).step(0.01).onChange(v => model.rotation.x = v);
                    folder.add(params, 'rotY', -Math.PI, Math.PI).step(0.01).onChange(v => model.rotation.y = v);
                    folder.add(params, 'rotZ', -Math.PI, Math.PI).step(0.01).onChange(v => model.rotation.z = v);
                    
                    const minScale = isTV ? 0.001 : 0.01;
                    const maxScale = isTV ? 1 : 100;
                    folder.add(params, 'scale', minScale, maxScale).step(isTV ? 0.001 : 0.01).onChange(v => model.scale.set(v, v, v));
                    folder.add(params, 'print').name('PRINT POSITION');
                } catch (e) {
                    console.warn(`Could not add GUI folder for ${name}:`, e);
                }
            };

            addFolderDefensive('Ada Wong', adaModel);
            addFolderDefensive('Grimoires', grimoiresModel);
            addFolderDefensive('Tallman', tallmanModel);
            addFolderDefensive('Yellow King', ylwkingModel);
            addFolderDefensive('Parking', parkingModel);
            addFolderDefensive('Cafe', cafeModel);
            addFolderDefensive('TV', tvModel, true);


            if (cafeDustModel) {
                try {
                    const dustFolder = gui.addFolder('Dust Effect');
                    const dustParams = {
                        posX: cafeDustModel.position.x,
                        posY: cafeDustModel.position.y,
                        posZ: cafeDustModel.position.z,
                        rotX: cafeDustModel.rotation.x,
                        rotY: cafeDustModel.rotation.y,
                        rotZ: cafeDustModel.rotation.z || 0,
                        scale: cafeDustModel.scale.x,
                        opacity: 0.8,
                        print: () => {
                            console.log(`Dust Position: [${cafeDustModel.position.x.toFixed(2)}, ${cafeDustModel.position.y.toFixed(2)}, ${cafeDustModel.position.z.toFixed(2)}]`);
                            console.log(`Dust Rotation: [${cafeDustModel.rotation.x.toFixed(2)}, ${cafeDustModel.rotation.y.toFixed(2)}, ${cafeDustModel.rotation.z.toFixed(2)}]`);
                            console.log(`Dust Scale: ${cafeDustModel.scale.x.toFixed(4)}`);
                            alert(`Dust Pos: ${cafeDustModel.position.x.toFixed(2)}, ${cafeDustModel.position.y.toFixed(2)}, ${cafeDustModel.position.z.toFixed(2)}\nRot: [${cafeDustModel.rotation.x.toFixed(2)}, ${cafeDustModel.rotation.y.toFixed(2)}, ${cafeDustModel.rotation.z.toFixed(2)}]\nScale: ${cafeDustModel.scale.x.toFixed(4)}`);
                        }
                    };
                    dustFolder.add(dustParams, 'posX', -200, 200).step(0.01).onChange(v => cafeDustModel.position.x = v);
                    dustFolder.add(dustParams, 'posY', -200, 200).step(0.01).onChange(v => cafeDustModel.position.y = v);
                    dustFolder.add(dustParams, 'posZ', -200, 200).step(0.01).onChange(v => cafeDustModel.position.z = v);
                    dustFolder.add(dustParams, 'rotX', -Math.PI, Math.PI).step(0.01).onChange(v => cafeDustModel.rotation.x = v);
                    dustFolder.add(dustParams, 'rotY', -Math.PI, Math.PI).step(0.01).onChange(v => cafeDustModel.rotation.y = v);
                    dustFolder.add(dustParams, 'rotZ', -Math.PI, Math.PI).step(0.01).onChange(v => cafeDustModel.rotation.z = v);
                    dustFolder.add(dustParams, 'scale', 0.01, 100).step(0.01).onChange(v => cafeDustModel.scale.set(v, v, v));
                    dustFolder.add(dustParams, 'opacity', 0, 1).step(0.01).onChange(v => {
                        dustParams.opacity = v;
                        cafeDustModel.traverse((child) => {
                            if (child.isMesh && child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => {
                                    if (mat) {
                                        mat.opacity = v;
                                        mat.transparent = v < 1;
                                    }
                                });
                            }
                        });
                    });
                    dustFolder.add(dustParams, 'print').name('PRINT POSITION');
                } catch (e) {
                    console.warn("Could not add Dust GUI:", e);
                }
            }


            if (scene.fog && scene.fog instanceof THREE.FogExp2) {
                try {
                    const fogFolder = gui.addFolder('Fog Settings');
                    const fogParams = {
                        density: scene.fog.density,
                        colorR: (scene.fog.color.r * 255),
                        colorG: (scene.fog.color.g * 255),
                        colorB: (scene.fog.color.b * 255),
                        print: () => {
                            console.log(`Fog Density: ${scene.fog.density.toFixed(4)}`);
                            console.log(`Fog Color: [${scene.fog.color.r.toFixed(2)}, ${scene.fog.color.g.toFixed(2)}, ${scene.fog.color.b.toFixed(2)}]`);
                            alert(`Fog Density: ${scene.fog.density.toFixed(4)}\nFog Color RGB: [${(scene.fog.color.r * 255).toFixed(0)}, ${(scene.fog.color.g * 255).toFixed(0)}, ${(scene.fog.color.b * 255).toFixed(0)}]`);
                        }
                    };
                    fogFolder.add(fogParams, 'density', 0, 0.1).step(0.001).onChange(v => scene.fog.density = v);
                    fogFolder.add(fogParams, 'colorR', 0, 255).step(1).onChange(v => scene.fog.color.r = v / 255);
                    fogFolder.add(fogParams, 'colorG', 0, 255).step(1).onChange(v => scene.fog.color.g = v / 255);
                    fogFolder.add(fogParams, 'colorB', 0, 255).step(1).onChange(v => scene.fog.color.b = v / 255);
                    fogFolder.add(fogParams, 'print').name('PRINT FOG SETTINGS');
                } catch (e) {
                    console.warn("Could not add Fog GUI:", e);
                }
            }
            

            if (cafeFogVolume) {
                try {
                    const fogVolumeFolder = gui.addFolder('Fog Volume Settings');
                    const fogVolumeParams = {
                        posX: cafeFogVolume.position.x,
                        posY: cafeFogVolume.position.y,
                        posZ: cafeFogVolume.position.z,
                        scaleX: cafeFogVolume.scale.x,
                        scaleY: cafeFogVolume.scale.y,
                        scaleZ: cafeFogVolume.scale.z,
                        opacity: cafeFogVolume.material.opacity,
                        colorR: (cafeFogVolume.material.color.r * 255),
                        colorG: (cafeFogVolume.material.color.g * 255),
                        colorB: (cafeFogVolume.material.color.b * 255),
                        print: () => {
                            console.log(`Fog Volume Position: [${cafeFogVolume.position.x.toFixed(2)}, ${cafeFogVolume.position.y.toFixed(2)}, ${cafeFogVolume.position.z.toFixed(2)}]`);
                            console.log(`Fog Volume Scale: [${cafeFogVolume.scale.x.toFixed(2)}, ${cafeFogVolume.scale.y.toFixed(2)}, ${cafeFogVolume.scale.z.toFixed(2)}]`);
                            console.log(`Fog Volume Opacity: ${cafeFogVolume.material.opacity.toFixed(2)}`);
                            alert(`Fog Volume Pos: ${cafeFogVolume.position.x.toFixed(2)}, ${cafeFogVolume.position.y.toFixed(2)}, ${cafeFogVolume.position.z.toFixed(2)}\nScale: [${cafeFogVolume.scale.x.toFixed(2)}, ${cafeFogVolume.scale.y.toFixed(2)}, ${cafeFogVolume.scale.z.toFixed(2)}]\nOpacity: ${cafeFogVolume.material.opacity.toFixed(2)}`);
                        }
                    };
                    fogVolumeFolder.add(fogVolumeParams, 'posX', -200, 200).step(0.01).onChange(v => cafeFogVolume.position.x = v);
                    fogVolumeFolder.add(fogVolumeParams, 'posY', -200, 200).step(0.01).onChange(v => cafeFogVolume.position.y = v);
                    fogVolumeFolder.add(fogVolumeParams, 'posZ', -200, 200).step(0.01).onChange(v => cafeFogVolume.position.z = v);
                    fogVolumeFolder.add(fogVolumeParams, 'scaleX', 0.1, 10).step(0.1).onChange(v => cafeFogVolume.scale.x = v);
                    fogVolumeFolder.add(fogVolumeParams, 'scaleY', 0.1, 10).step(0.1).onChange(v => cafeFogVolume.scale.y = v);
                    fogVolumeFolder.add(fogVolumeParams, 'scaleZ', 0.1, 10).step(0.1).onChange(v => cafeFogVolume.scale.z = v);
                    fogVolumeFolder.add(fogVolumeParams, 'opacity', 0, 1).step(0.01).onChange(v => {
                        fogVolumeParams.opacity = v;
                        cafeFogVolume.material.opacity = v;
                    });
                    fogVolumeFolder.add(fogVolumeParams, 'colorR', 0, 255).step(1).onChange(v => cafeFogVolume.material.color.r = v / 255);
                    fogVolumeFolder.add(fogVolumeParams, 'colorG', 0, 255).step(1).onChange(v => cafeFogVolume.material.color.g = v / 255);
                    fogVolumeFolder.add(fogVolumeParams, 'colorB', 0, 255).step(1).onChange(v => cafeFogVolume.material.color.b = v / 255);
                    fogVolumeFolder.add(fogVolumeParams, 'print').name('PRINT FOG VOLUME SETTINGS');
                    fogVolumeFolder.open();
                } catch (e) {
                    console.warn("Could not add Fog Volume GUI:", e);
                }
            }


            if (parkingSkybox) {
                try {
                    const skyboxFolder = gui.addFolder('Skybox Settings');
                    const skyboxParams = {
                        scale: parkingSkybox.scale.x,
                        rotationSpeed: parkingSkyboxRotationSpeed,
                        print: () => {
                            console.log(`Skybox Scale: ${parkingSkybox.scale.x.toFixed(2)}`);
                            console.log(`Skybox Rotation Speed: ${parkingSkyboxRotationSpeed.toFixed(4)}`);
                            alert(`Skybox Scale: ${parkingSkybox.scale.x.toFixed(2)}\nRotation Speed: ${parkingSkyboxRotationSpeed.toFixed(4)}`);
                        }
                    };
                    skyboxFolder.add(skyboxParams, 'scale', 0.1, 10).step(0.1).onChange(v => parkingSkybox.scale.set(v, v, v));
                    skyboxFolder.add(skyboxParams, 'rotationSpeed', -0.5, 0.5).step(0.01).onChange(v => parkingSkyboxRotationSpeed = v);
                    skyboxFolder.add(skyboxParams, 'print').name('PRINT SKYBOX SETTINGS');
                } catch (e) {
                    console.warn("Could not add Skybox GUI:", e);
                }
            }


            if (camera) {
                try {
                    const cameraFolder = gui.addFolder('Camera Position');
                    const cameraParams = {
                        posX: camera.position.x,
                        posY: camera.position.y,
                        posZ: camera.position.z,
                        print: () => {
                            console.log(`Camera Position: [${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]`);
                            alert(`Camera Pos: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`);
                        }
                    };
                    cameraFolder.add(cameraParams, 'posX', -100, 100).step(0.01).onChange(v => camera.position.x = v);
                    cameraFolder.add(cameraParams, 'posY', -100, 100).step(0.01).onChange(v => camera.position.y = v);
                    cameraFolder.add(cameraParams, 'posZ', -100, 100).step(0.01).onChange(v => camera.position.z = v);
                    cameraFolder.add(cameraParams, 'print').name('PRINT POSITION');
                    cameraFolder.open();
                } catch (e) {
                    console.warn("Could not add Camera GUI:", e);
                }
            }
        } catch (e) {
            console.error("GUI error:", e);
        }
    }

    init();

    Object.defineProperty(window, 'devMode', {
        get: function() {
            return devMode;
        },
        set: function(value) {
            if (isDevModeAuthorized) {
                devMode = value;
                console.log('Alright alright,little code reader');
            } else {
                console.warn('%c⚠️ Developer mode is locked!', 'color: red; font-size: 16px; font-weight: bold;');
            }
        },
        configurable: false,
        enumerable: true
    });

    window.screenEffect = screenEffect;
    window.eventManager = eventManager;
    window.setupGUI = setupGUI;

})();
