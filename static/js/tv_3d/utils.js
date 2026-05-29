function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function typeWriter(text, elementId, speed) {
  let i = 0;
  const element = document.getElementById(elementId);
  if (!element) return;
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
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function typeWriter(text, elementId, speed) {
  let i = 0;
  const element = document.getElementById(elementId);
  if (!element) return;
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
