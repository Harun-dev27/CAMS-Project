// Fetch logged-in user
const currentHOD = JSON.parse(sessionStorage.getItem("loggedInUser"));
if (!currentHOD || currentHOD.role !== "HOD") {
  alert("Unauthorized access");
  window.location.href = "login.html";
} else {
  document.getElementById("hodName").textContent = currentHOD.name;

  // Populate classes
  fetch(`/api/hod/classes?department=${currentHOD.department}`)
    .then((res) => res.json())
    .then((classes) => {
      const classSelect = document.getElementById("classSelect");
      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.name;
        option.textContent = cls.name;
        classSelect.appendChild(option);
      });
    })
    .catch((err) => console.error("Error fetching classes:", err));

  // View attendance summary
  function viewAttendanceSummary(period) {
    const selectedClass = document.getElementById("classSelect").value;

    fetch(`/api/hod/attendance-summary?class=${selectedClass}&period=${period}`)
      .then((res) => res.json())
      .then((summary) => {
        const summaryContainer = document.getElementById("attendanceSummary");
        summaryContainer.innerHTML = "";

        summary.forEach((item) => {
          const div = document.createElement("div");
          div.textContent = `${item.name}: ${item.attendance}% attendance`;
          summaryContainer.appendChild(div);
        });
      })
      .catch((err) => console.error("Error fetching attendance summary:", err));
  }

  // Generate PDF Report
  function generateReport() {
    const selectedClass = document.getElementById("classSelect").value;
     // Suppress the rule for jsPDF constructor
    // eslint-disable-next-line new-cap
    const doc = new jsPDF();

    fetch(`/api/hod/attendance-summary?class=${selectedClass}&period=semester`)
      .then((res) => res.json())
      .then((summary) => {
        doc.text(`Attendance Report for ${selectedClass}`, 10, 10);

        let y = 20;
        summary.forEach((item) => {
          doc.text(`${item.name}: ${item.attendance}% attendance`, 10, y);
          y += 10;
        });

        doc.save(`${selectedClass}_Attendance_Report.pdf`);
      })
      .catch((err) => console.error("Error generating report:", err));
  }

  window.viewAttendanceSummary = viewAttendanceSummary;
  window.generateReport = generateReport;
}
