// Base API URL
const apiUrl = "http://localhost:3000/api";

// DOM Elements
const userForm = document.getElementById("userForm");
const roleField = document.getElementById("role");
const commonFields = document.getElementById("commonFields");
const studentFields = document.getElementById("studentFields");
const classRepFields = document.getElementById("classRepFields");
const trainerHODFields = document.getElementById("trainerHODFields");
const successMessage = document.getElementById("successMessage");
const userListSection = document.getElementById("userList").getElementsByTagName("tbody")[0];

// Function to toggle the visibility of sections
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = section.style.display === "none" ? "block" : "none";
  }
}


// Toggle fields based on role
function showFields() {
  if (!roleField) return;
  const role = roleField.value;

  // Toggle specific fields
  if (commonFields) commonFields.style.display = role ? "block" : "none";
  if (studentFields) studentFields.style.display = role === "Student" ? "block" : "none";
  if (classRepFields) classRepFields.style.display = role === "ClassRep" ? "block" : "none";
  if (trainerHODFields)
    trainerHODFields.style.display = ["Trainer", "HOD"].includes(role) ? "block" : "none";

  // Dynamically toggle required attributes
  toggleRequiredFields(role);
}

function toggleRequiredFields(role) {
  const allFields = [studentFields, classRepFields, trainerHODFields];
  allFields.forEach((field) => {
    if (field) {
      const inputs = field.querySelectorAll("input, select");
      inputs.forEach((input) => (input.required = field.style.display === "block"));
    }
  });
}


// Register new user
async function registerUser(event) {
  event.preventDefault();
  resetSuccessMessage();

  const role = roleField?.value;
  const name = document.getElementById("name")?.value;
  const password = document.getElementById("password")?.value;

  if (!role || !name || !password) {
    alert("Please fill out all required fields.");
    return;
  }

  // Validate password strength
  if (!/[!@#$%^&*]/.test(password)) {
    alert("Password must include at least one special character (!@#$%^&*).");
    return;
  }

  // Validate and collect role-specific fields
  if (!validateRoleSpecificFields(role)) return;

  const userData = {
    role,
    name,
    password,
  };

  // Append role-specific fields
  if (role === "Student") {
    userData.registrationNumber = document.getElementById("studentRegistrationNumber")?.value;
    userData.departmentId = document.getElementById("department")?.value;
    userData.courseId = document.getElementById("course")?.value;
    userData.classId = document.getElementById("class")?.value;
  } else if (role === "ClassRep") {
    userData.registrationNumber = document.getElementById("classRepRegistrationNumber")?.value;
    userData.departmentId = document.getElementById("classRepDepartment")?.value;
    userData.courseId = document.getElementById("classRepCourse")?.value;
    userData.classId = document.getElementById("classRepClass")?.value;
  }
   else if (["Trainer", "HOD"].includes(role)) {
    userData.id_number = document.getElementById("id_number")?.value;
  }

  console.log("User Data:", userData);

  if (!validateUserData(userData)) {
    alert("Please ensure all required fields are completed.");
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    await handleUserCreationResponse(response);
  } catch (error) {
    handleUserCreationError(error);
  } finally {
    hideLoading();
  }
}

function validateRoleSpecificFields(role) {
  let fieldId;
  if (role === "Student") {
    fieldId = "studentFields";
  } else if (role === "ClassRep") {
    fieldId = "classRepFields";
  } else {
    fieldId = "trainerHODFields";
  }

  const fieldContainer = document.getElementById(fieldId);
  if (!fieldContainer || fieldContainer.style.display === "none") return true;

  const inputs = fieldContainer.querySelectorAll("input, select");
  for (let input of inputs) {
    if (input.offsetParent !== null && !input.value) {
      alert(`Please fill out the ${input.name || input.id} field.`);
      return false;
    }
  }

  // Additional validation for Trainer/HOD
  if (["Trainer", "HOD"].includes(role) && !document.getElementById("id_number")?.value) {
    alert("ID Number is required for Trainer/HOD.");
    return false;
  }

  return true;
}

function validateUserData(data) {
  if (["Student", "ClassRep"].includes(data.role)) {
    return (
      data.registrationNumber &&
      data.departmentId &&
      data.courseId &&
      data.classId
    );
  } else if (["Trainer", "HOD"].includes(data.role)) {
    return data.id_number;
  }
  return true;
}

function resetSuccessMessage() {
  if (successMessage) {
    successMessage.style.display = "none";
    successMessage.innerText = "";
    successMessage.classList.remove("green", "red");
  }
}

function showLoading() {
  const loading = document.createElement("div");
  loading.innerText = "Adding user...";
  loading.classList.add("loading");
  userForm?.appendChild(loading);
}

function hideLoading() {
  const loading = document.querySelector(".loading");
  if (loading) loading.remove();
}

async function handleUserCreationResponse(response) {
  if (response.ok) {
    successMessage.innerText = "User added successfully!";
    successMessage.classList.add("green");
    successMessage.style.display = "block";
    userForm?.reset();
    showFields();
    fetchUsers();
  } else {
    const error = await response.json();
    successMessage.innerText = `Failed to add user: ${error.error}`;
    successMessage.classList.add("red");
    successMessage.style.display = "block";
  }
}

function handleUserCreationError(error) {
  console.error("Error adding user:", error);
  if (successMessage) {
    successMessage.innerText = "Error adding user.";
    successMessage.classList.add("red");
    successMessage.style.display = "block";
  }
}

async function fetchUsers() {
  try {
    const response = await fetch(`${apiUrl}/users`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const users = await response.json();

    userListSection.innerHTML = "";
    users.forEach((user) => {
      const row = `<tr>
        <td>${user.name}</td>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td><button onclick="deleteUser('${user.id}')">Delete</button></td>
      </tr>`;
      userListSection.insertAdjacentHTML("beforeend", row);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return; // Confirm deletion

  try {
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user.");
    }

    alert("User deleted successfully.");
    fetchUsers(); // Refresh the user list after deletion
  } catch (error) {
    console.error("Error deleting user:", error.message);
    alert("Error deleting user: " + error.message);
  }
}


// Add Department
async function addDepartment(event) {
  event.preventDefault();
  const departmentName = document.getElementById("newDepartment")?.value.trim();
  if (!departmentName) {
    alert("Please enter a department name.");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: departmentName }),
    });

    if (response.ok) {
      alert("Department added successfully!");
      document.getElementById("departmentForm").reset();
      await fetchDepartments();
    } else {
      const error = await response.json();
      alert(`Failed to add department: ${error.error}`);
    }
  } catch (error) {
    console.error("Error adding department:", error);
    alert("An error occurred while adding the department.");
  }
}

// Add Course
async function addCourse(event) {
  event.preventDefault();

  const departmentId = document.getElementById("courseDepartment")?.value;
  const courseName = document.getElementById("newCourse")?.value.trim();

  if (!departmentId || !courseName) {
    alert("Please select a department and enter a course name.");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/departments/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: courseName, department_id: departmentId }),
    });

    if (response.ok) {
      alert("Course added successfully!");
      document.getElementById("courseForm").reset();
      await fetchCourses(departmentId); // Refresh the course dropdown
    } else {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { error: "Unknown error occurred" };
      }
      alert(`Failed to add course: ${error.error}`);
    }
  } catch (error) {
    console.error("Error adding course:", error);
    alert("An error occurred while adding the course.");
  }
}



// Add Class
async function addClass(event) {
  event.preventDefault();
  const departmentId = document.getElementById("classDepartment")?.value;
  const courseId = document.getElementById("classCourse")?.value;
  const className = document.getElementById("newClass")?.value.trim();

  if (!departmentId || !courseId || !className) {
    alert("Please select a department, course, and enter a class name.");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/departments/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className, courseId, departmentId }),
    });

    if (response.ok) {
      alert("Class added successfully!");
      document.getElementById("classForm").reset();
    } else {
      try {
        const error = await response.json();
        alert(`Failed to add class: ${error.error}`);
      } catch {
        alert("Failed to add class: Unexpected response from the server.");
      }
    }
  } catch (error) {
    console.error("Error adding class:", error);
    alert("An error occurred while adding the class.");
  }
}


// Add Unit
async function addUnit(event) {
  event.preventDefault();
  const departmentId = document.getElementById("unitDepartment")?.value;
  const courseId = document.getElementById("unitCourse")?.value;
  const unitName = document.getElementById("unitName")?.value.trim();
  const unitCode = document.getElementById("unitCode")?.value.trim();

  if (!departmentId || !courseId || !unitName || !unitCode) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/departments/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: unitName,
        code: unitCode,
        departmentId, // Include departmentId
        courseId,     // Include courseId
      }),
    });

    if (response.ok) {
      alert("Unit added successfully!");
      document.getElementById("unitForm").reset();
    } else {
      const error = await response.json();
      alert(`Failed to add unit: ${error.error}`);
    }
  } catch (error) {
    console.error("Error adding unit:", error);
    alert("An error occurred while adding the unit.");
  }
}



// Fetch and populate departments
async function fetchDepartments() {
  try {
    const response = await fetch(`${apiUrl}/departments`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const departments = await response.json();

    const departmentFields = document.querySelectorAll(
      "#courseDepartment, #classDepartment, #unitDepartment, #department, #classRepDepartment"
    );

    departmentFields.forEach((field) => {
      field.innerHTML = '<option value="">Select Department</option>';
      departments.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.id;
        option.textContent = dept.name;
        field.appendChild(option);
      });
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
  }
}

// Fetch and populate courses based on department
async function fetchCourses(departmentId, selectIds = []) {
  if (!departmentId.trim()) {
    console.warn("No department selected, skipping course fetch.");
    return;
  }

  try {
    console.log(`Fetching courses for department ID: ${departmentId}`);
    const response = await fetch(`${apiUrl}/departments/courses?department=${departmentId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const courses = await response.json();
    console.log(`Courses fetched for department ${departmentId}:`, courses);
    
    selectIds.forEach((selectId) => {
      const field = document.querySelector(selectId);
      if (field) {
        field.innerHTML = '<option value="">Select Course</option>'; // Clear old values
        courses.forEach((course) => {
          const option = document.createElement("option");
          option.value = course.id;
          option.textContent = course.name;
          field.appendChild(option);
        });
        console.log(`Dropdown ${selectId} populated with courses.`);
      }
    });

    return courses; // Return the fetched courses for debugging
  } catch (error) {
    console.error("Error fetching courses:", error);
    return []; // Ensure a return value in case of failure
  }
}



// Add event listeners for course dropdowns to fetch classes dynamically
document.querySelectorAll("#course, #classRepCourse").forEach((courseDropdown) => {
  courseDropdown.addEventListener("change", (e) => {
    const courseId = e.target.value;
    console.log(`Course selected: ${courseId}`);
    if (courseId) {
      const targetSelectId = e.target.id === "course" ? ["#class"] : ["#classRepClass"];
      fetchClasses(courseId, targetSelectId);
    }
  });
});



// Fetch classes based on course selection
async function fetchClasses(courseId, selectIds = []) {
  if (!courseId.trim()) {
    console.warn("No course selected, skipping class fetch.");
    return;
  }

  try {
    console.log(`Fetching classes for course ID: ${courseId}`);
    const response = await fetch(`${apiUrl}/courses/classes?course=${courseId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const classes = await response.json();

    selectIds.forEach((selectId) => {
      const field = document.querySelector(selectId);
      if (field) {
        field.innerHTML = '<option value="">Select Class</option>';
        classes.forEach((cls) => {
          const option = document.createElement("option");
          option.value = cls.id;
          option.textContent = cls.name;
          field.appendChild(option);
        });
      }
    });

    console.log(`Fetched classes for Course ${courseId}:`, classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
  }
}

// Ensure department dropdown updates correctly
document.getElementById("department")?.addEventListener("change", (e) => {
  console.log("User selected department (onchange event):", e.target.value);
  fetchCourses(e.target.value, ["#course"]);
});

// Event listeners for dynamic fetching
document.getElementById("classDepartment")?.addEventListener("change", (event) => {
  const departmentId = event.target.value;
  if (departmentId) fetchCourses(departmentId);
});

document.getElementById("unitDepartment")?.addEventListener("change", (event) => {
  const departmentId = event.target.value;
  if (departmentId) fetchCourses(departmentId);
});


// Initialize the page
async function initializeDropdowns(departmentSelectId, courseSelectIds, classSelectIds) {
  const departmentSelect = document.getElementById(departmentSelectId);

  if (!departmentSelect) {
    console.warn(`Dropdown (${departmentSelectId}) not found.`);
    return;
  }

  console.log(`Dropdown (${departmentSelectId}) options:`, departmentSelect.options);
  console.log(`User selected department: ${departmentSelect.value}`);

  const selectedDepartmentId = departmentSelect.value.trim();
  if (!selectedDepartmentId) {
    console.warn("No department selected, skipping course fetch.");
    return;
  }

  console.log(`Initializing dropdowns for Department: ${selectedDepartmentId}`);

  const courses = await fetchCourses(selectedDepartmentId, courseSelectIds);
  console.log(`Fetched courses for Department ${selectedDepartmentId}:`, courses);

  const courseSelect = document.querySelector(courseSelectIds[0]);
  if (courseSelect?.options.length > 1) {
    console.log(`Course dropdown options:`, courseSelect.options);
    
    const firstCourseId = courseSelect.value.trim();
    console.log(`First course ID for ${courseSelectIds[0]}: ${firstCourseId}`);

    if (firstCourseId) {
      await fetchClasses(firstCourseId, classSelectIds);
    } else {
      console.warn(`No courses found for department ID: ${selectedDepartmentId}`);
    }
  }
}

async function initializePage() {
  await fetchDepartments();
  await fetchUsers();

  // Initialize dropdowns for students
  await initializeDropdowns("department", ["#course"], ["#class"]);

  // Initialize dropdowns for class reps
  await initializeDropdowns("classRepDepartment", ["#classRepCourse"], ["#classRepClass"]);
}

initializePage();
