class ScreenEffect {
  constructor(parent, options) {
    this.parent = parent;
    if (typeof parent === "string") {
      this.parent = document.querySelector(parent);
    }

    this.config = Object.assign({}, {}, options);
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

  onResize() {
    this.rect = this.parent.getBoundingClientRect();
    if (this.rect.width === 0 || this.rect.height === 0) {
      this.rect = { width: 1920, height: 1080 };
    }
    if (this.effects.vcr && !!this.effects.vcr.enabled) {
      this.generateVCRNoise();
    }
  }

  add(type, options) {
    this.onResize();
    const config = Object.assign({}, { fps: 30, blur: 1 }, options);
    if (Array.isArray(type)) {
      for (const t of type) {
        this.add(t);
      }
      return this;
    }
    const that = this;
    if (type === "snow") {
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
        ctx,
        imgData,
        buffer,
        enabled: true,
        config
      };
      this.startSnow();
      return this;
    }
    if (type === "roll") {
      return this.enableRoll();
    }
    if (type === "vcr") {
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
    switch (type) {
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
    if (type in this.effects && !!obj.enabled) {
      obj.enabled = false;
      if (type === "roll" && obj.original) {
        this.parent.appendChild(obj.original);
      }
      if (type === "vcr") {
        cancelAnimationFrame(this.vcrInterval);
        clearInterval(this.vcrInterval);
      }
      if (type === "snow") {
        cancelAnimationFrame(this.snowframe);
      }
      if (obj.node) {
        obj.wrapper.removeChild(obj.node);
      } else {
        obj.wrapper.classList.remove(type);
      }
    }
    return this;
  }

  enableRoll() {
    const el = this.parent.firstElementChild;
    if (el) {
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
    if (config.fps >= 60) {
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

    if (xmax === undefined) xmax = canvas.width;
    if (ymax === undefined) ymax = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `#fff`;

    for (var i = 0; i <= currentNum; i++) {
      var x = Math.random(i) * xmax;
      var y1 = getRandomInt(posy1 += 3, posy2);
      var y2 = getRandomInt(0, posy3 -= 3);
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
