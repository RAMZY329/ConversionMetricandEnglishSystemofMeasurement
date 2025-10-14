document.addEventListener("DOMContentLoaded", () => {
  const topicSection = document.getElementById("topic-section");
  const practiceSection = document.getElementById("practice-section");
  const competitionSection = document.getElementById("competition-section");
  const leaderboardSection = document.getElementById("leaderboard-section");

  const hideAll = () => {
    topicSection.classList.add("hidden");
    practiceSection.classList.add("hidden");
    competitionSection.classList.add("hidden");
  };

  document.getElementById("btn-topic").addEventListener("click", () => {
    hideAll();
    topicSection.classList.remove("hidden");
    loadTopic();
  });

  document.getElementById("btn-practice").addEventListener("click", () => {
    hideAll();
    practiceSection.classList.remove("hidden");
    initPractice();
  });

  document.getElementById("btn-competition").addEventListener("click", () => {
    hideAll();
    competitionSection.classList.remove("hidden");
    initCompetition();
  });

  document.getElementById("btn-leaderboard").addEventListener("click", () => {
    hideAll();
    leaderboardSection.classList.remove("hidden");
    if (typeof loadLeaderboard === 'function') loadLeaderboard();
  });
});
