// Login function
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        // Send login request to the backend
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const user = await response.json();
            console.log("Login successful:", user);

            // Store logged-in user in sessionStorage
            sessionStorage.setItem("loggedInUser", JSON.stringify(user));

            // Redirect based on role
            redirectUser(user.role);
        } else {
            const error = await response.json();
            document.getElementById("errorMessage").textContent = error.message || "Login failed.";
            console.error("Login failed:", error);
        }
    } catch (error) {
        document.getElementById("errorMessage").textContent = "An error occurred. Please try again.";
        console.error("Error during login:", error);
    }
});

// Function to toggle password visibility
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}

// Function to redirect users based on role
function redirectUser(role) {
    switch (role) {
        case "Admin":
            window.location.href = "admin.html";
            break;
        case "Student":
            window.location.href = "student.html";
            break;
        case "Trainer":
            window.location.href = "trainer.html";
            break;
        case "HOD":
            window.location.href = "hod.html";
            break;
        case "ClassRep":
            window.location.href = "classrep.html";
            break;
        default:
            document.getElementById("errorMessage").textContent = "Role not recognized.";
            console.error("Login failed: Role not recognized.");
    }
}
