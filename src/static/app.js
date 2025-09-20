let teacherCredentials = null;
let teacherEmail = null;

document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("loginBtn");
  const teacherInfo = document.getElementById("teacherInfo");
  const teacherName = document.getElementById("teacherName");

  // Function to handle login
  async function handleLogin() {
    const username = prompt("Teacher Username:");
    if (!username) return;
    
    const password = prompt("Password:");
    if (!password) return;

    // Create Basic Auth header
    const credentials = btoa(`${username}:${password}`);
    
    try {
      // Test credentials with a signup attempt (will be rejected if invalid)
      const testResponse = await fetch("/activities/Chess Club/signup?email=test@test.com", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`
        }
      });

      if (testResponse.ok) {
        teacherCredentials = credentials;
        teacherEmail = "test@test.com"; // Replace with actual email from backend response
        loginBtn.style.display = "none";
        teacherInfo.classList.remove("hidden");
        teacherName.textContent = username;
        messageDiv.textContent = "Logged in successfully";
        messageDiv.className = "success";
      } else {
        messageDiv.textContent = "Invalid credentials";
        messageDiv.className = "error";
      }
    } catch (error) {
      messageDiv.textContent = "Login failed";
      messageDiv.className = "error";
    }
    messageDiv.classList.remove("hidden");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const isJoined = details.participants.includes(teacherEmail);
        const activityCard = document.createElement("div");
        activityCard.classList.add("activity-card");
        activityCard.id = `activity-${name}`;
        
        const activityHTML = `
          <div class="activity-header">
            <h3>${name}</h3>
            ${teacherCredentials ? 
              `<button class="delete-activity-btn" data-activity="${name}">Delete Activity</button>` 
              : ''}
          </div>
          <p>${details.description}</p>
          <div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants.map(email => 
                `<li>
                  <span class="participant-email">${email}</span>
                  ${teacherCredentials ? 
                    `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` 
                    : ''}
                </li>`
              ).join("")}
            </ul>
          </div>
          <button class="join-btn ${isJoined ? 'joined' : ''}" data-activity="${name}">
            ${isJoined ? 'Leave' : 'Join'}
          </button>
        `;
        
        activityCard.innerHTML = activityHTML;
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to all buttons
      document.querySelectorAll(".delete-btn, .delete-activity-btn, .join-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          if (e.target.classList.contains("join-btn")) {
            const activityName = e.target.dataset.activity;
            const isJoined = e.target.classList.contains("joined");

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/${isJoined ? 'unregister' : 'signup'}?email=${encodeURIComponent(teacherEmail)}`,
                {
                  method: isJoined ? "DELETE" : "POST",
                }
              );
              
              if (response.ok) {
                fetchActivities();
              } else {
                const result = await response.json();
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (error) {
              console.error("Error:", error);
              messageDiv.textContent = "An error occurred. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          } else if (e.target.classList.contains("delete-btn")) {
            const activityName = e.target.dataset.activity;
            const email = e.target.dataset.email;
            
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                {
                  method: "DELETE",
                  headers: {
                    'Authorization': `Basic ${teacherCredentials}`
                  }
                }
              );
              
              if (response.ok) {
                fetchActivities();
              } else {
                const result = await response.json();
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (error) {
              console.error("Error:", error);
              messageDiv.textContent = "An error occurred while removing the participant.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          } else if (e.target.classList.contains("delete-activity-btn")) {
            const activityName = e.target.dataset.activity;
            
            if (confirm(`Are you sure you want to delete the activity "${activityName}"?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activityName)}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Basic ${teacherCredentials}`
                  }
                });
                
                if (response.ok) {
                  fetchActivities();
                } else {
                  const result = await response.json();
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (error) {
                console.error("Error:", error);
                messageDiv.textContent = "An error occurred while deleting the activity.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            }
          }
          
          // Hide error messages after 5 seconds
          if (messageDiv.classList.contains("error")) {
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
