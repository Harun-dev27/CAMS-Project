// Retrieve logged-in user from sessionStorage
const currentUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

if (!currentUser || currentUser.role !== "Student") {
  alert("Unauthorized access");
  window.location.href = "login.html"; // Redirect to login if not a student
} else {
  // Display student's name and registration number on the dashboard
  document.getElementById("studentName").textContent = currentUser.name;
  document.getElementById("studentRegNo").textContent = currentUser.registrationNumber;

  // Fetch and display the student's attendance records
  fetch(`http://localhost:3000/api/attendance/${currentUser.registrationNumber}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch attendance records");
      }
      return response.json();
    })
    .then(data => {
      const attendanceData = document.getElementById("attendanceData");

      // Populate the attendance table with the student's records
      data.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${record.date}</td><td>${record.status}</td>`;
        attendanceData.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Error fetching attendance records:", error);
      alert("An error occurred while fetching attendance records. Please try again later.");
    });
}
