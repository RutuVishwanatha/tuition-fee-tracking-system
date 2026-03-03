document.addEventListener('DOMContentLoaded', () => {

    const updateDashboardStats = () => {
        const rows = document.querySelectorAll('#students-table-body tr');
        const studentStat = document.getElementById('stat-total-students');
        if (studentStat) studentStat.textContent = rows.length;

        // Calculate actual totals from students table
        let collected = 0;
        let pending = 0;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 5) {
                const amountPaid = parseFloat(cells[4].innerText.replace('₹', '').replace(/,/g, '')) || 0;
                const balance = parseFloat(cells[5].innerText.replace('₹', '').replace(/,/g, '')) || 0;

                collected += amountPaid;
                pending += balance;
            }
        });

        const collectedStat = document.getElementById('stat-collected');
        if (collectedStat) {
            collectedStat.textContent = `₹${collected.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        }

        const pendingStat = document.getElementById('stat-pending');
        if (pendingStat) {
            pendingStat.textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        }

        const revenueStat = document.getElementById('stat-revenue');
        if (revenueStat && collected > 0) {
            // Mock YTD revenue based off current collection assuming average monthly rate
            revenueStat.textContent = `₹${(42000 + collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
    };

    // --- Python API Data Loading ---
    const loadStudents = async () => {
        try {
            const response = await fetch('/api/students');
            const students = await response.json();
            const tbody = document.getElementById('students-table-body');
            tbody.innerHTML = ''; // Clear table

            students.forEach(student => {
                const balance = student.total_fee - student.paid_amount;
                let statusHtml = '';
                if (balance > 0) statusHtml = '<span class="badge-status warning">Pending</span>';
                else if (balance < 0) statusHtml = '<span class="badge-status danger">High Risk</span>';
                else statusHtml = '<span class="badge-status success">Paid</span>';

                const tr = document.createElement('tr');
                tr.dataset.id = student.id; // Store Python DB ID
                tr.innerHTML = `
                    <td>
                        <div class="user-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=e0e7ff&color=4f46e5" class="sm-avatar" alt="${student.name}">
                            <strong>${student.name}</strong>
                        </div>
                    </td>
                    <td>${student.email}</td>
                    <td>${student.subject}</td>
                    <td>₹${student.total_fee.toFixed(2)}</td>
                    <td>₹${student.paid_amount.toFixed(2)}</td>
                    <td><strong>₹${balance.toFixed(2)}</strong></td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-light action-receipt"><i class='bx bxs-file-pdf'></i> Receipt</button>
                        <button class="icon-btn action-delete danger" style="margin-left:5px" title="Delete"><i class='bx bx-trash'></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            updateDashboardStats();
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    // Load DB on boot
    loadStudents();

    // --- Delete Student Logic (Event Delegation) ---
    document.getElementById('students-table-body').addEventListener('click', async (e) => {
        if (e.target.closest('.action-delete')) {
            const row = e.target.closest('tr');
            const studentId = row.dataset.id;
            if (confirm('Are you sure you want to delete this student?')) {
                try {
                    const response = await fetch(`/api/students/${studentId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        alert('Student deleted successfully!');
                        loadStudents(); // Reload students after deletion
                    } else {
                        alert('Failed to delete student.');
                    }
                } catch (error) {
                    console.error('Error deleting student:', error);
                    alert('An error occurred while deleting the student.');
                }
            }
        }
    });

    // --- Dark Mode Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');

    // Check local storage for theme
    if (localStorage.getItem('theme') === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('bx-moon', 'bx-sun');
    }

    themeToggle.addEventListener('click', () => {
        if (html.getAttribute('data-theme') === 'dark') {
            html.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('bx-sun', 'bx-moon');
        } else {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('bx-moon', 'bx-sun');
        }
    });

    // --- Login & Forgot Password Logic ---
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-password-form');

    const loginScreen = document.getElementById('login-screen');
    const forgotScreen = document.getElementById('forgot-password-screen');
    const mainApp = document.getElementById('main-app');

    const showForgotBtn = document.getElementById('show-forgot-password');
    const backToLoginBtn = document.getElementById('back-to-login');
    const logoutBtn = document.getElementById('logout-btn');

    // Show Forgot Password
    showForgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginScreen.classList.remove('active');
        setTimeout(() => { forgotScreen.classList.add('active'); }, 300);
    });

    // Back to Login
    backToLoginBtn.addEventListener('click', () => {
        forgotScreen.classList.remove('active');
        setTimeout(() => { loginScreen.classList.add('active'); }, 300);
    });

    // Forgot Password Submit
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = forgotForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Sending...";

        setTimeout(() => {
            btn.innerHTML = originalText;
            const msg = document.getElementById('reset-message');
            msg.textContent = "Reset link sent to your email!";
            msg.className = "message success";
            msg.classList.remove('hidden');

            setTimeout(() => {
                msg.classList.add('hidden');
                // Auto switch back to login after sending email
                forgotScreen.classList.remove('active');
                setTimeout(() => { loginScreen.classList.add('active'); }, 300);
            }, 3000);
        }, 1200);
    });

    // Login Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button');
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Authenticating...";

        // Simulate network request
        setTimeout(() => {
            loginScreen.classList.remove('active');
            btn.innerHTML = "Sign In";
            // Show main app
            setTimeout(() => {
                mainApp.classList.add('active');
                // Trigger reflow for animations
                window.dispatchEvent(new Event('resize'));
            }, 300);
        }, 800);
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        mainApp.classList.remove('active');
        setTimeout(() => { loginScreen.classList.add('active'); }, 300);
    });

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(n => n.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');

            // Hide all views
            views.forEach(v => v.classList.remove('active'));

            // Show target view
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Modals Logic ---
    const modalAddClass = document.getElementById('modal-add-class');
    const modalAddStudent = document.getElementById('modal-add-student');

    const btnAddClass = document.getElementById('add-class-btn');
    const btnAddStudent = document.getElementById('add-student-btn');

    const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

    // Open Modals
    if (btnAddClass) btnAddClass.addEventListener('click', () => modalAddClass.classList.add('active'));
    if (btnAddStudent) btnAddStudent.addEventListener('click', () => modalAddStudent.classList.add('active'));

    // Close Modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modalAddClass.classList.remove('active');
            modalAddStudent.classList.remove('active');
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // --- Auto Calculate Balance in Student Modal ---
    const calcTotal = document.getElementById('calc-total');
    const calcPaid = document.getElementById('calc-paid');
    const calcBalance = document.getElementById('calc-balance');

    // --- Form Submissions (Add Class / Add Student) ---
    const formAddClass = document.getElementById('form-add-class');
    const formAddStudent = document.getElementById('form-add-student');

    if (formAddClass) {
        formAddClass.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('class-name-input').value;
            const subject = document.getElementById('class-subject-input').value;
            const start = document.getElementById('class-start-input').value;
            const end = document.getElementById('class-end-input').value;
            const time = document.getElementById('class-time-input').value;

            const tbody = document.getElementById('classes-table-body');
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${subject}</td>
                <td>${time}</td>
                <td>${start}</td>
                <td>${end}</td>
                <td>0 / 30</td>
                <td class="table-actions">
                    <button class="icon-btn action-edit" title="Edit"><i class='bx bx-edit-alt'></i></button>
                    <button class="icon-btn action-delete danger" title="Delete"><i class='bx bx-trash'></i></button>
                </td>
            `;
            tbody.appendChild(newRow);

            // Re-bind listeners for new buttons
            bindRowActions(newRow);

            modalAddClass.classList.remove('active');
            formAddClass.reset();
            alert("Class successfully added!");
        });
    }

    if (formAddStudent) {
        formAddStudent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formAddStudent.querySelector('button[type="submit"]');
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Saving...";

            const payload = {
                name: document.getElementById('student-name-input').value,
                email: document.getElementById('student-email-input').value,
                subject: document.getElementById('student-class-input').value,
                total_fee: parseFloat(document.getElementById('calc-total').value) || 0,
                paid_amount: parseFloat(document.getElementById('calc-paid').value) || 0
            };

            try {
                const response = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    await loadStudents(); // Reload from Python DB
                    modalAddStudent.classList.remove('active');
                    formAddStudent.reset();
                    calcBalance.textContent = "₹0.00";
                    calcBalance.className = "text-success";
                    alert("Student saved to SQLite database!");
                }
            } catch (error) {
                console.error("Failed to add student", error);
                alert("Server Error. Make sure Flask back-end is running.");
            } finally {
                btn.innerHTML = "Register Student";
            }
        });
    }

    const updateBalance = () => {
        const total = parseFloat(calcTotal.value) || 0;
        const paid = parseFloat(calcPaid.value) || 0;
        const balance = total - paid;

        calcBalance.textContent = `₹${balance.toFixed(2)}`;
        if (balance > 0) {
            calcBalance.className = 'text-warning';
        } else if (balance < 0) {
            calcBalance.className = 'text-danger';
        } else {
            calcBalance.className = 'text-success';
        }
    };

    if (calcTotal && calcPaid) {
        calcTotal.addEventListener('input', updateBalance);
        calcPaid.addEventListener('input', updateBalance);
    }

    // --- Profile Dropdown Logic ---
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });
    }

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.classList.contains('open')) {
            profileDropdown.classList.remove('open');
        }
    });

    // --- Action Buttons (Receipt) ---
    document.body.addEventListener('click', (e) => {
        const receiptBtn = e.target.closest('.action-receipt');
        if (receiptBtn) {
            e.preventDefault();
            e.stopPropagation();

            const row = receiptBtn.closest('tr');
            const dbId = row.dataset.id;
            if (row && dbId) {
                // Open the Python-generated receipt HTML in a new browser tab
                window.open(`/receipt/${dbId}`, '_blank');
            }
        }
    });

    // --- Action Buttons (Delete) Linked to Python ---
    // Use event delegation for dynamically added delete buttons
    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-delete, .bx-trash');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();

            const row = btn.closest('tr');
            const dbId = row.dataset.id; // Grab Python DB ID

            if (row && dbId) {
                row.style.background = '#fee2e2';
                row.style.opacity = '0.5';

                try {
                    const response = await fetch(`/api/students/${dbId}`, { method: 'DELETE' });
                    if (response.ok) {
                        setTimeout(() => {
                            row.remove();
                            updateDashboardStats();
                        }, 300);
                    }
                } catch (error) {
                    console.error("Failed to delete", error);
                    row.style.background = '';
                    row.style.opacity = '1';
                    alert("Failed to delete from database.");
                }
            }
        }
    });

    const bindRowActions = (container = document) => {
        // Re-bind edit buttons
        const editBtns = container.querySelectorAll('.action-edit');
        editBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Find the name cell of this class row
                const row = newBtn.closest('tr');
                const nameCell = row.cells[0];

                // Extract current text and prompt for new text
                const currentName = nameCell.innerText.trim();
                const newName = prompt("Edit Class Name:", currentName);

                if (newName && newName.trim() !== '') {
                    nameCell.innerHTML = `<strong>${newName.trim()}</strong>`;
                }
            });
        });
    };

    // Initial Bind (only for existing edit buttons)
    bindRowActions(document);

    // --- Table Filtering (Students) ---
    const studentSubjectFilter = document.getElementById('filter-student-subject');
    const studentStatusFilter = document.getElementById('filter-student-status');

    const filterStudents = () => {
        if (!studentSubjectFilter || !studentStatusFilter) return;

        let subject = studentSubjectFilter.value.toLowerCase().trim();
        let status = studentStatusFilter.value.toLowerCase().trim();

        // Normalize "all classes" strings
        if (subject.includes('all')) subject = 'all';
        if (status.includes('all')) status = 'all';

        const rows = document.querySelectorAll('#students-table-body tr');
        rows.forEach(row => {
            const rawText = row.innerText.toLowerCase();

            // Check if row text includes the filter strings
            const matchSubject = subject === 'all' || rawText.includes(subject);
            const matchStatus = status === 'all' || rawText.includes(status);

            if (matchSubject && matchStatus) {
                row.style.display = 'table-row'; // Show row
            } else {
                row.style.display = 'none'; // Hide row
            }
        });
    };

    if (studentSubjectFilter) studentSubjectFilter.addEventListener('change', filterStudents);
    if (studentStatusFilter) studentStatusFilter.addEventListener('change', filterStudents);

    // --- Table Filtering (Payments) ---
    const paymentMethodFilter = document.getElementById('filter-payment-method');
    const paymentStatusFilter = document.getElementById('filter-payment-status');

    const filterPayments = () => {
        if (!paymentMethodFilter || !paymentStatusFilter) return;

        let methodFilter = paymentMethodFilter.value.toLowerCase().trim();
        let statusFilter = paymentStatusFilter.value.toLowerCase().trim();

        if (methodFilter.includes('all')) methodFilter = 'all';
        if (statusFilter.includes('all')) statusFilter = 'all';

        const rows = document.querySelectorAll('#payments-table-body tr');
        rows.forEach(row => {
            const rawText = row.innerText.toLowerCase();

            const matchMethod = methodFilter === 'all' || rawText.includes(methodFilter);
            const matchStatus = statusFilter === 'all' || rawText.includes(statusFilter);

            if (matchMethod && matchStatus) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        });
    };

    if (paymentMethodFilter) paymentMethodFilter.addEventListener('change', filterPayments);
    if (paymentStatusFilter) paymentStatusFilter.addEventListener('change', filterPayments);

    // --- Reports PDF Export ---
    const reportsExportBtns = document.querySelectorAll('#reports .btn-primary, #payments .btn-outline');
    reportsExportBtns.forEach(btn => {
        if (btn.innerText.includes('Export') || btn.innerText.includes('PDF')) {
            btn.addEventListener('click', () => {
                // Simulate generating a PDF for the reports section
                btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Generating...";
                setTimeout(() => {
                    alert('PDF Report has been generated and downloaded to your device.');
                    btn.innerHTML = btn.innerText.includes('PDF') ? "<i class='bx bxs-file-pdf'></i> Export PDF" : "<i class='bx bx-export'></i> Export";
                }, 1500);
            });
        }
    });

    // --- Reports Date Sorting Filter ---
    const reportsSelects = document.querySelectorAll('#reports .clean-select');
    reportsSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const val = e.target.value;
            // Target the headline numbers to fake a date sort
            const revNum = document.querySelector('#reports .stat-card:nth-child(1) h2');
            const debtNum = document.querySelector('#reports .stat-card:nth-child(2) h2');

            if (revNum && debtNum) {
                if (val.includes('30 Days')) {
                    revNum.textContent = '₹12,450.00';
                    debtNum.textContent = '₹4,200.00';
                } else if (val.includes('Quarter')) {
                    revNum.textContent = '₹38,900.00';
                    debtNum.textContent = '₹8,100.00';
                } else if (val.includes('Year')) {
                    revNum.textContent = '₹145,200.00';
                    debtNum.textContent = '₹15,400.00';
                }
            }
        });
    });
});
