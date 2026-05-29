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
      "Parking Appearance": 0.005
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
