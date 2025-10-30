// Backend API base URL
const apiUrl = "http://localhost:3000/api";

// Retrieve logged-in trainer from sessionStorage
const currentTrainer = JSON.parse(sessionStorage.getItem("loggedInUser"));

if (!currentTrainer || currentTrainer.role !== "Trainer") {
  alert("Unauthorized access");
  window.location.href = "../index.html";
} else {
  // Display trainer's name
  document.getElementById("trainerName").textContent = `Welcome, ${currentTrainer.name}`;

  // DOM elements
  const departmentSelect = document.getElementById("department");
  const classSelect = document.getElementById("classSelect");
  const unitSelect = document.getElementById("unitSelect");
  const attendanceTable = document.getElementById("attendanceTable");

  // Fetch departments and populate dropdown
  async function fetchDepartments() {
    try {
      const response = await fetch(`${apiUrl}/departments`);
      const departments = await response.json();
      departmentSelect.innerHTML = '<option value="">Select Department</option>';
      departments.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }

  // Fetch classes for the selected department
  departmentSelect.addEventListener("change", async () => {
    const departmentId = departmentSelect.value;
    if (!departmentId) {
      classSelect.innerHTML = '<option value="">Select Class</option>';
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/classes?department=${departmentId}`);
      const classes = await response.json();
      classSelect.innerHTML = '<option value="">Select Class</option>';
      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.name;
        option.textContent = cls.name;
        classSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  });

  // Fetch units for the trainer and selected class
  classSelect.addEventListener("change", async () => {
    const selectedClass = classSelect.value;
    if (!selectedClass) {
      unitSelect.innerHTML = '<option value="">Select Unit</option>';
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/units?trainer=${currentTrainer.username}&class=${selectedClass}`);
      const units = await response.json();
      unitSelect.innerHTML = '<option value="">Select Unit</option>';
      units.forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit.code;
        option.textContent = `${unit.name} (${unit.code})`;
        unitSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  });

  // Fetch students for the selected class
  async function fetchStudents() {
    const selectedClass = classSelect.value;
    if (!selectedClass) {
      attendanceTable.innerHTML = "";
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/students?class=${selectedClass}`);
      const students = await response.json();
      attendanceTable.innerHTML = "";
      students.forEach((student) => {
        const row = `<tr>
          <td>${student.name}</td>
          <td>${student.registrationNumber}</td>
          <td><input type="checkbox" data-regNo="${student.registrationNumber}" /></td>
        </tr>`;
        attendanceTable.insertAdjacentHTML("beforeend", row);
      });
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }

  // Save attendance to the database
  async function saveAttendance() {
    const unitCode = unitSelect.value;
    if (!unitCode) {
      alert("Please select a unit.");
      return;
    }

    const attendanceRecords = Array.from(document.querySelectorAll("[data-regNo]")).map((input) => ({
      regNo: input.dataset.regNo,
      unitCode,
      status: input.checked ? "Present" : "Absent",
      date: new Date().toISOString().split("T")[0],
    }));

    try {
      const response = await fetch(`${apiUrl}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceRecords),
      });

      if (response.ok) {
        alert("Attendance saved successfully!");
      } else {
        alert("Failed to save attendance.");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  }

  // Initialize the dashboard
  fetchDepartments();
  classSelect.addEventListener("change", fetchStudents);

  // Attach event listener to save attendance button
  document.getElementById("saveAttendanceBtn").addEventListener("click", saveAttendance);
}
