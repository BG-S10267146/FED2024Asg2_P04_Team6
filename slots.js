const slots = document.querySelectorAll(".slot-item");
const spinButton = document.querySelector(".spin-button");
const rewardsList = document.querySelector(".rewards-list");
const spinsCounter = document.getElementById("spins-counter");

const rewards = [
  { emoji: "🎁", text: "10% Off Your Next Purchase" },
  { emoji: "🚚", text: "Free Shipping on Your Order" },
  { emoji: "💲", text: "$5 Discount Coupon" },
  { emoji: "🛒", text: "Buy One, Get One Free" },
  { emoji: "🎉", text: "Spin Again for Free" },
  { emoji: "🍀", text: "Lucky Discount: 20% Off" },
  { emoji: "🌟", text: "Exclusive Member Offer" },
  { emoji: "🎈", text: "Birthday Special: 15% Off" },
];

const noReward = { emoji: "❌", text: "No Rewards" };

let spinsRemaining = 3; // Initialize the pity system counter

function spinSlots() {
  spinButton.disabled = true; // Disable button during spin
  let spins = 0;
  const totalSpins = 30; // Number of intermediate spins for animation
  const spinDuration = 3000; // Total duration of the spin in milliseconds

  slots.forEach(slot => slot.classList.add('spinning'));

  const spin = () => {
    slots.forEach((slot) => {
      if (spinsRemaining === 1) {
        // If it's the pity spin, ensure all slots display the same reward
        const guaranteedReward = rewards[Math.floor(Math.random() * rewards.length)];
        slot.textContent = guaranteedReward.emoji;
      } else {
        // Normal random selection
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        slot.textContent = randomReward.emoji;
      }
    });

    spins++;

    if (spins < totalSpins) {
      setTimeout(spin, spinDuration / totalSpins); // Use setTimeout for smoother animation
    } else {
      setTimeout(() => {
        const slotResults = Array.from(slots).map(slot => slot.textContent);
        const requiredElements = ["🎁", "🚚", "💲"];
        const allElementsPresent = requiredElements.every(element => slotResults.includes(element));

        // Pity system logic
        spinsRemaining--;
        spinsCounter.textContent = spinsRemaining;

        if (allElementsPresent || spinsRemaining === 0) {
          const result = rewards[Math.floor(Math.random() * rewards.length)];
          
          if (spinsRemaining === 0) {
            // On pity spin, ensure all three slots display the same reward
            const guaranteedReward = rewards[Math.floor(Math.random() * rewards.length)];
            slots.forEach(slot => slot.textContent = guaranteedReward.emoji);
            addReward(guaranteedReward.text);
          } else {
            addReward(result.text);
          }

          spinsRemaining = 3; // Reset the pity counter
          spinsCounter.textContent = spinsRemaining;
        } else {
          addReward(noReward.text);
        }

        slots.forEach(slot => slot.classList.remove('spinning'));
        spinButton.disabled = false; // Re-enable button after spin
      }, 500);
    }
  };

  spin();
}

function addReward(rewardText) {
  const rewardItem = document.createElement("li");
  rewardItem.textContent = rewardText;
  rewardsList.appendChild(rewardItem);
}

spinButton.addEventListener("click", spinSlots);
