const slots = document.querySelectorAll(".slot-item");
const spinButton = document.querySelector(".spin-button");
const rewardsList = document.querySelector(".rewards-list");
const spinsCounter = document.getElementById("spins-counter");
const totalPointsDisplay = document.getElementById("total-points");

const rewards = [
  { emoji: "🎁", points: 20 },
  { emoji: "🚚", points: 20 },
  { emoji: "💲", points: 20 },
  { emoji: "🛒", points: 20 },
  { emoji: "🎉", points: 100 },
  { emoji: "🍀", points: 20 },
  { emoji: "🌟", points: 20 },
  { emoji: "🎈", points: 20 },
];

const noReward = { emoji: "❌", text: "No Rewards", points: 5 };

let spinsSinceLastMatch = 0;
let totalSpins = 5;
let totalPoints = 0;

function spinSlots() {
  if (totalSpins <= 0) {
    alert("No more spins left!");
    // Save points to localStorage when spins run out
    localStorage.setItem("totalPoints", totalPoints);
    window.location.href = "spend-points.html"; // Redirect to spend-points.html when spins are 0
    return;
  }

  spinButton.disabled = true;
  let spins = 0;
  const intermediateSpins = 30;
  const spinDuration = 3000;

  spinsCounter.textContent = `Spins left: ${totalSpins}`;

  slots.forEach(slot => slot.classList.add('spinning'));

  const spin = () => {
    spinsCounter.textContent = `Spins left: ${totalSpins}`;

    slots.forEach((slot) => {
      if (spinsSinceLastMatch >= 2) {
        const guaranteedReward = rewards[Math.floor(Math.random() * rewards.length)];
        slot.textContent = guaranteedReward.emoji;
      } else {
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        slot.textContent = randomReward.emoji;
      }
    });

    spins++;

    if (spins < intermediateSpins) {
      setTimeout(spin, spinDuration / intermediateSpins);
    } else {
      setTimeout(() => {
        const slotResults = Array.from(slots).map(slot => slot.textContent);
        const rewardCount = {};

        slotResults.forEach(result => {
          rewardCount[result] = (rewardCount[result] || 0) + 1;
        });

        let earnedPoints = 0;
        let rareMatch = false;

        for (const reward of rewards) {
          if (rewardCount[reward.emoji] === 3) {
            earnedPoints = 500;
            rareMatch = true;
            break;
          } else if (rewardCount[reward.emoji] === 2) {
            earnedPoints += 20;
          }
        }

        if (!rareMatch) {
          if (slotResults.every(result => result === slotResults[0])) {
            earnedPoints = 100;
          } else {
            earnedPoints += 5;
          }
        }

        totalPoints += earnedPoints;
        totalPointsDisplay.textContent = `Total Points: ${totalPoints}`;

        addReward(`You earned ${earnedPoints} points!`);

        if (spinsSinceLastMatch >= 2) {
          spinsSinceLastMatch = 0;
        } else {
          spinsSinceLastMatch++;
        }

        totalSpins--;
        spinsCounter.textContent = `Spins left: ${totalSpins}`;

        slots.forEach(slot => slot.classList.remove('spinning'));
        spinButton.disabled = false;
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
