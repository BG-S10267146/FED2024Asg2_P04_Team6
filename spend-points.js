document.addEventListener("DOMContentLoaded", () => {
    const pointsTotalDisplay = document.getElementById("sp-points-total");
  
    // Retrieve total points from localStorage
    let totalPoints = parseInt(localStorage.getItem("totalPoints")) || 0;
    pointsTotalDisplay.textContent = `Total Points: ${totalPoints}`;
  
    // Add event listener to each reward item
    document.querySelectorAll(".sp-reward-card").forEach((card) => {
        card.addEventListener("click", () => {
            const itemName = card.querySelector("h3").textContent.trim();
            const pointsText = card.querySelector(".sp-points").textContent.trim();
            const itemCost = parseInt(pointsText.replace(" Points", ""));
  
            if (totalPoints >= itemCost) {
                totalPoints -= itemCost;
                localStorage.setItem("sp-totalPoints", totalPoints);
                alert(`You have successfully purchased ${itemName} for ${itemCost} points!`);
                pointsTotalDisplay.textContent = `Total Points: ${totalPoints}`;
                window.location.href = "listing.html"; // Redirect after purchase
            } else {
                alert("You do not have enough points to buy this item.");
            }
        });
    });
  });
  