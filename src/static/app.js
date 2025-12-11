document.addEventListener("DOMContentLoaded", () => {
  loadActivities();
  setupSignupForm();
});

async function loadActivities() {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();
    displayActivities(activities);
    populateActivitySelect(activities);
  } catch (error) {
    document.getElementById("activities-list").innerHTML =
      '<p class="error">Failed to load activities. Please try again later.</p>';
  }
}

function displayActivities(activities) {
  const activitiesList = document.getElementById("activities-list");
  activitiesList.innerHTML = "";

  for (const [name, details] of Object.entries(activities)) {
    const card = document.createElement("div");
    card.className = "activity-card";

    const participantCount = details.participants.length;
    const spotsLeft = details.max_participants - participantCount;

    card.innerHTML = `
            <h4>${name}</h4>
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Capacity:</strong> ${participantCount}/${details.max_participants} (${spotsLeft} spots left)</p>
            <div class="participants-section">
                <p class="participants-title"><strong>Participants:</strong></p>
                ${details.participants.length > 0 
                    ? `<ul class="participants-list">
                        ${details.participants.map(email => `
                          <li>
                            <span class="participant-email">${email}</span>
                            <span class="delete-icon" onclick="deleteParticipant('${name}', '${email}')" title="Remove participant">🗑️</span>
                          </li>
                        `).join('')}
                       </ul>`
                    : '<p class="no-participants">No participants yet. Be the first to sign up!</p>'
                }
            </div>
        `;

    activitiesList.appendChild(card);
  }
}

function populateActivitySelect(activities) {
  const select = document.getElementById("activity");
  const defaultOption = select.querySelector('option[value=""]');
  select.innerHTML = "";
  select.appendChild(defaultOption);

  for (const name of Object.keys(activities)) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

function setupSignupForm() {
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const messageDiv = document.getElementById("message");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, "success");
        form.reset();
        // Reload activities to show updated participant list
        await loadActivities();
      } else {
        showMessage(data.detail || "Signup failed", "error");
      }
    } catch (error) {
      showMessage("An error occurred. Please try again.", "error");
    }
  });
}

function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.classList.remove("hidden");

  setTimeout(() => {
    messageDiv.classList.add("hidden");
  }, 5000);
}

async function deleteParticipant(activityName, email) {
  if (!confirm(`Are you sure you want to unregister ${email} from ${activityName}?`)) {
    return;
  }

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message, "success");
      // Reload activities to show updated participant list
      await loadActivities();
    } else {
      showMessage(data.detail || "Failed to unregister participant", "error");
    }
  } catch (error) {
    showMessage("An error occurred. Please try again.", "error");
  }
}
