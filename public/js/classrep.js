const apiUrl = 'http://localhost:3000/api'; // Base API URL

document.addEventListener('DOMContentLoaded', async () => {
  await initializeClassRepDashboard();
});

async function initializeClassRepDashboard() {
  const repNameElement = document.getElementById('repName');
  const markAttendanceButton = document.getElementById('markAttendanceButton');

  // Retrieve logged-in user from sessionStorage
  const currentRep = JSON.parse(sessionStorage.getItem('loggedInUser'));

  if (!currentRep || currentRep.role !== 'ClassRep') {
    console.error('Unauthorized: No valid class rep found in sessionStorage:', currentRep);
    alert('Unauthorized access');
    window.location.href = '../index.html';
    return;
  }

  // Display class representative's name
  if (repNameElement) {
    repNameElement.textContent = `Welcome, ${currentRep.name}`;
  } else {
    console.error("Element with ID 'repName' not found.");
  }

  updateDateAndWeek();
  await populateClassRepDetails();

  if (markAttendanceButton) {
    markAttendanceButton.addEventListener('click', markAttendance);
  } else {
    console.error("Element with ID 'markAttendanceButton' not found.");
  }
}

// Fetch Class Rep's details from the backend
async function fetchClassRepDetails() {
  const currentRep = JSON.parse(sessionStorage.getItem('loggedInUser'));

  if (!currentRep?.registrationNumber) {
    console.error('Error: Missing or invalid logged-in user details.');
    alert('Unauthorized access');
    window.location.href = '../index.html';
    return;
  }

  const registrationNumber = currentRep.registrationNumber || currentRep.username;

  try {
    const response = await fetch(`${apiUrl}/users/${registrationNumber}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch class rep details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Class Rep details:', error);
  }
}

// Populate UI with Class Rep's details
async function populateClassRepDetails() {
  const classRepDetails = await fetchClassRepDetails(`${apiUrl}/users`);

  if (classRepDetails) {
    document.getElementById('classRepDepartment').textContent = classRepDetails.departmentName || 'N/A';
    document.getElementById('classRepCourse').textContent = classRepDetails.courseName || 'N/A';
    document.getElementById('classRepClass').textContent = classRepDetails.className || 'N/A';

    await populateUnitsAndTrainers(classRepDetails.classId);
    await fetchStudents(classRepDetails.classId);
  }
}

// Fetch and populate units and trainers
async function populateUnitsAndTrainers(classId) {
  try {
    const unitsResponse = await fetch(`${apiUrl}/departments/classes/${classId}/units`);
    const trainersResponse = await fetch(`${apiUrl}/users/${classId}/trainers`);

    const units = await unitsResponse.json();
    const trainers = await trainersResponse.json();

    const unitSelect = document.getElementById('unitName');
    const trainerSelect = document.getElementById('trainer');

    if (unitSelect) {
      unitSelect.innerHTML = '<option value="">Select Unit</option>';
      units.forEach((unit) => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = unit.name;
        unitSelect.appendChild(option);
      });
    }

    if (trainerSelect) {
      trainerSelect.innerHTML = '<option value="">Select Trainer</option>';
      trainers.forEach((trainer) => {
        const option = document.createElement('option');
        option.value = trainer.id;
        option.textContent = trainer.name;
        trainerSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error populating units and trainers:', error);
  }
}
