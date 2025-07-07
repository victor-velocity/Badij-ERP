/madison-jay-erp
├── /app
│ ├── /api
│ │ ├── /auth
│ │ │ ├── /login
│ │ │ │ └── route.js // API route for user login; handles credential verification, generates and issues access and refresh tokens.
│ │ │ ├── /logout
│ │ │ │ └── route.js // API route for user logout; invalidates server-side refresh tokens and clears client-side cookies.
│ │ │ └── /refresh
│ │ │ └── route.js // API route to refresh access tokens using a valid refresh token.
│ │ ├── /employees
│ │ │ ├── /route.js // API route for fetching all employees (GET) and adding a new employee (POST).
│ │ │ ├── /[id]
│ │ │ │ └── route.js // API route for fetching, updating, or deleting a specific employee by ID.
│ │ │ └── /import
│ │ │ └── route.js // API route for importing a list of employees (POST).
│ │ ├── /leave
│ │ │ ├── /requests
│ │ │ │ └── route.js // API route for managing all leave requests (GET) and submitting new requests (POST).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for updating the status of a specific leave request (PUT) or deleting it (DELETE).
│ │ │ └── /balances
│ │ │ └── route.js // API route for fetching leave balances.
│ │ ├── /payroll
│ │ │ ├── /runs
│ │ │ │ └── route.js // API route for fetching all payroll runs (GET) and initiating a new pay run (POST).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for viewing, updating, or deleting a specific payroll run by ID.
│ │ │ ├── /templates
│ │ │ │ └── route.js // API route for managing payroll templates (GET for all, POST for new).
│ │ │ ├── /payslips
│ │ │ │ └── route.js // API route for fetching all payslips.
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for fetching a specific payslip by ID.
│ │ │ └── /deductions
│ │ │ └── route.js // API route for managing payroll deductions (GET for all, POST for new).
│ │ ├── /attendance
│ │ │ ├── /route.js // API route for fetching attendance summaries (GET) and recording clock-in/out (POST).
│ │ │ └── /regularization
│ │ │ └── route.js // API route for submitting attendance regularization requests (POST).
│ │ ├── /trainings
│ │ │ ├── /route.js // API route for managing all training programs (GET for all, POST for new).
│ │ │ ├── /[id]
│ │ │ │ └── route.js // API route for viewing, updating, or deleting a specific training program by ID.
│ │ │ └── /user-history
│ │ │ └── route.js // API route for fetching a user's training history.
│ │ ├── /onboarding
│ │ │ ├── /route.js // API route for managing onboarding progress (GET) and initiating new onboarding processes (POST).
│ │ │ └── /[id]
│ │ │ └── route.js // API route for updating the status of a specific onboarding process by ID.
│ │ ├── /exit-management
│ │ │ ├── /route.js // API route for submitting exit management forms (POST).
│ │ │ └── /[id]
│ │ │ └── route.js // API route for viewing or updating a specific exit form by ID.
│ │ ├── /inventory
│ │ │ ├── /items
│ │ │ │ └── route.js // API route for fetching inventory items (GET) and generating unique IDs for new items (POST).
│ │ │ ├── /purchase-orders
│ │ │ │ └── route.js // API route for managing purchase orders (GET for all, POST for new).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for updating the status of a specific purchase order by ID.
│ │ │ ├── /goods-received-notes
│ │ │ │ └── route.js // API route for confirming received goods (POST).
│ │ │ ├── /vendors
│ │ │ │ └── route.js // API route for managing vendors (GET for all, POST for registration).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for viewing or updating a specific vendor by ID.
│ │ │ └── /reports
│ │ │ └── route.js // API route for generating various inventory reports.
│ │ ├── /sales
│ │ │ ├── /orders
│ │ │ │ └── route.js // API route for managing sales orders (GET for all, POST for new).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for updating the status of a specific sales order by ID.
│ │ │ ├── /customers
│ │ │ │ └── route.js // API route for managing customer accounts (GET for all, POST for new).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for viewing or updating a specific customer by ID.
│ │ │ ├── /invoices
│ │ │ │ └── route.js // API route for managing invoices (GET for all, POST for new).
│ │ │ │ └── /[id]
│ │ │ │ └── route.js // API route for fetching a specific invoice by ID.
│ │ │ └── /crm
│ │ │ └── route.js // Placeholder API route for CRM functionalities.
│ │ ├── /shifts
│ │ │ ├── /route.js // API route for managing work shifts (GET for all, POST for new).
│ │ │ └── /staff-on-shift
│ │ │ └── route.js // API route for fetching reports on staff currently on shift.
│ │ ├── /tasks
│ │ │ ├── /route.js // API route for managing tasks (GET for all, POST for assigning).
│ │ │ ├── /my-tasks
│ │ │ │ └── route.js // API route for fetching a user's assigned tasks (in progress, to-do, completed).
│ │ │ └── /sent-tasks
│ │ │ └── route.js // API route for fetching tasks assigned by a specific user.
│ │ └── /kss
│ │ ├── /trainings
│ │ │ └── route.js // API route for managing KSS training content (available, ongoing, upcoming).
│ │ ├── /tests
│ │ │ └── route.js // API route for taking tests (POST) and fetching test results/grades (GET).
│ │ └── /history
│ │ └── route.js // API route for fetching a user's history within the KSS module.
│ │
│ ├── /login
│ │ └── page.jsx // Client-side page for user authentication; handles input and calls login API.
│ ├── /unauthorized
│ │ └── page.jsx // Page displayed to users who attempt to access content without proper authorization.
│ ├── /dashboard
│ │ ├── page.jsx // Main dashboard page displaying an overview of ERP modules.
│ │ └── layout.jsx // Protected layout for the dashboard; ensures user is authenticated before rendering.
│ ├── /hr
│ │ ├── /employees
│ │ │ ├── page.jsx // Page to display employee list and forms for adding/editing employees.
│ │ │ ├── /[id]
│ │ │ │ └── page.jsx // Page for detailed employee information and individual editing.
│ │ │ └── /add
│ │ │ └── page.jsx // Form page for registering new employees.
│ │ ├── /leave
│ │ │ ├── page.jsx // Page for viewing leave requests, history, policies, and balances.
│ │ │ ├── /request
│ │ │ │ └── page.jsx // Form page for employees to request leave.
│ │ │ └── /approvals
│ │ │ └── page.jsx // Interface for managers/HR to approve or reject leave requests.
│ │ ├── /payroll
│ │ │ ├── page.jsx // Payroll module dashboard, including options to process pay runs.
│ │ │ ├── /setup
│ │ │ │ └── page.jsx // Page for setting up payroll templates, payment cycles, and pay dates.
│ │ │ ├── /payslips
│ │ │ │ └── page.jsx // Page for viewing generated payslips.
│ │ │ ├── /revisions-approval
│ │ │ │ └── page.jsx // Page for management approval of payroll revisions.
│ │ │ └── /loans
│ │ │ └── page.jsx // Page for managing employee loans.
│ │ ├── /attendance
│ │ │ ├── page.jsx // Attendance summary page, with clock-in/out functionalities.
│ │ │ ├── /regularization
│ │ │ │ └── page.jsx // Page for regularizing attendance records.
│ │ │ └── /shift-schedule
│ │ │ └── page.jsx // Page for viewing and managing employee shift schedules.
│ │ ├── /trainings
│ │ │ ├── page.jsx // Page for viewing available, ongoing, and upcoming training programs.
│ │ │ ├── /history
│ │ │ │ └── page.jsx // Page displaying a user's training history.
│ │ │ └── /private-youtube
│ │ │ └── page.jsx // Integration page for playing private training videos from YouTube.
│ │ ├── /onboarding
│ │ │ ├── page.jsx // Onboarding dashboard, showing progress and options to start new onboarding.
│ │ │ ├── /[id]
│ │ │ │ └── page.jsx // Page for specific onboarding details, welcome messages, and document uploads.
│ │ │ └── /new-hire
│ │ │ └── page.jsx // Form for entering new hire details during onboarding.
│ │ ├── /exit-management
│ │ │ ├── page.jsx // Exit management dashboard.
│ │ │ ├── /form
│ │ │ │ └── page.jsx // Employee exit form page.
│ │ │ └── /approval
│ │ │ └── page.jsx // Page for the exit approval process by management.
│ │ ├── layout.jsx // Protected layout specific to the HR module; checks for 'HR' or 'Admin' roles for access.
│ │ └── page.jsx // HR Module Home/Dashboard.
│ ├── /inventory
│ │ ├── /dashboard
│ │ │ └── page.jsx // Inventory module dashboard.
│ │ ├── /items
│ │ │ ├── page.jsx // Page listing all inventory items.
│ │ │ └── /add
│ │ │ └── page.jsx // Form page for adding new inventory items and generating unique IDs.
│ │ ├── /purchase-orders
│ │ │ ├── page.jsx // Page listing purchase orders and an option to create new ones.
│ │ │ ├── /create
│ │ │ │ └── page.jsx // Form page for creating new purchase orders.
│ │ │ └── /approvals
│ │ │ └── page.jsx // Interface for approving purchase orders.
│ │ ├── /goods-received
│ │ │ └── page.jsx // Page for confirming the receipt of goods.
│ │ ├── /warehouse
│ │ │ └── page.jsx // Page to track inventory levels in the warehouse versus outstanding orders.
│ │ ├── /vendors
│ │ │ ├── page.jsx // Page listing all vendors and an option to register new ones.
│ │ │ ├── /register
│ │ │ │ └── page.jsx // Form page for registering a new vendor.
│ │ │ └── /payments
│ │ │ └── page.jsx // Page for tracking vendor payments.
│ │ ├── layout.jsx // Protected layout specific to the Inventory module; checks for 'Inventory Manager' or 'Admin' roles.
│ │ └── page.jsx // Inventory Module Home.
│ ├── /sales
│ │ ├── /dashboard
│ │ │ └── page.jsx // Sales module dashboard.
│ │ ├── /orders
│ │ │ ├── page.jsx // Page listing all sales orders and an option to create new ones.
│ │ │ └── /create
│ │ │ └── page.jsx // Form page for creating new sales orders.
│ │ ├── /customers
│ │ │ ├── page.jsx // Page listing all customer accounts and an option to create new ones.
│ │ │ └── /add
│ │ │ └── page.jsx // Form page for adding new customer accounts.
│ │ ├── /invoices
│ │ │ ├── page.jsx // Page listing all invoices and an option to create new ones.
│ │ │ └── /create
│ │ │ └── page.jsx // Form page for creating new invoices.
│ │ ├── /crm
│ │ │ └── page.jsx // Page for customer relationship management functionalities.
│ │ ├── layout.jsx // Protected layout specific to the Sales module; checks for 'Sales Manager' or 'Admin' roles.
│ │ └── page.jsx // Sales Module Home.
│ ├── /shifts
│ │ ├── page.jsx // Page for creating and publishing work shifts.
│ │ ├── /manager
│ │ │ └── page.jsx // Interface for shift managers.
│ │ ├── /report
│ │ │ └── page.jsx // Page for generating reports on staff currently on shift.
│ │ └── layout.jsx // Protected layout specific to the Shifts module; checks for 'Manager' or 'Admin' roles.
│ ├── /tasks
│ │ ├── page.jsx // Page for assigning tasks to staff.
│ │ ├── /my-tasks
│ │ │ └── page.jsx // Page summarizing tasks for the current user (in progress, to-do, completed).
│ │ ├── /sent-tasks
│ │ │ └── page.jsx // Page listing tasks that the current user has assigned to others.
│ │ └── layout.jsx // Protected layout specific to the Tasks module; checks for 'Employee', 'Manager', or 'Admin' roles.
│ ├── /kss
│ │ ├── page.jsx // Home page for the Knowledge Sharing System module.
│ │ ├── /trainings
│ │ │ ├── page.jsx // Page for Browse available, upcoming, and ongoing KSS trainings.
│ │ │ ├── /[id]
│ │ │ │ └── page.jsx // Page displaying details for a specific KSS training.
│ │ │ └── /take-test
│ │ │ └── page.jsx // Interface for users to take tests within the KSS.
│ │ ├── /user-history
│ │ │ └── page.jsx // Page showing a user's training history and test grades within the KSS.
│ │ └── layout.jsx // Protected layout specific to the KSS module; generally accessible to all 'Employee' roles and above.
│ ├── /settings
│ │ ├── /user-access
│ │ │ └── page.jsx // Page for defining user access permissions.
│ │ ├── /roles
│ │ │ └── page.jsx // Page for managing user roles (e.g., Admin, Employee) and customizing their access levels.
│ │ ├── /data-permissions
│ │ │ └── page.jsx // Page for setting granular permissions for data viewing and operations.
│ │ └── layout.jsx // Protected layout specific to the Settings module; typically restricted to 'Admin' role users.
│ ├── layout.jsx // Root layout for the entire application; handles global UI elements and high-level authentication checks.
│ └── page.jsx // The root page of the application, often redirecting to the dashboard after authentication.
├── /components
│ ├── /ui
│ │ ├── Button.jsx // Reusable button component.
│ │ ├── Input.jsx // Reusable input field component.
│ │ ├── Table.jsx // Reusable table component.
│ │ └── Card.jsx // Reusable card component.
│ ├── Navigation.jsx // Main navigation component for the application.
│ ├── Sidebar.jsx // Sidebar component for navigation within modules.
│ ├── Header.jsx // Header component, often containing user info and quick links.
│ ├── DashboardWidgets.jsx // Components specifically designed for use on the dashboard.
│ ├── AccessDenied.jsx // A component to render a user-friendly message when access is denied due to insufficient permissions.
├── /lib
│ ├── api.js // Configured Axios instance with request and response interceptors for adding access tokens and handling token refresh logic on the client-side.
│ ├── token-manager.js // Client-side utility for managing access tokens (getting, setting, clearing) and orchestrating the refresh token flow by calling the /api/auth/refresh endpoint.
│ ├── auth.js // Client-side authentication utilities, possibly including React Context for managing user authentication state across client components.
│ ├── auth-server-utils.js // Server-side specific authentication utilities for validating JWTs, generating tokens, and managing refresh token cookies.
│ ├── permissions.js // Helper functions to centralize role-based access control logic for use in layouts and server components.
│ ├── db.js // Database connection and ORM (Object-Relational Mapping) setup.
│ ├── utils.js // General utility functions used across the application.
│ └── constants.js // File to store application-wide constants and configurations.
├── /middleware.js // Next.js Middleware; a powerful feature for running code before a request is completed, used here for global authentication checks and initial authorization redirects.
├── /styles
│ ├── globals.css // Global CSS styles for the application.
│ └── variables.css // CSS variables for consistent styling.
├── public
│ ├── favicon.ico // Application favicon.
│ └── /images // Directory for static image assets.
├── next.config.js // Next.js configuration file.
├── package.json // Project dependencies and scripts.
├── jsconfig.json // JavaScript configuration file for editor features like IntelliSense and path aliases.
└── README.md // Project documentation.

Possible Libraries To Use

- React Icons
- Supabase js // For Database connections
- Jose // For JWT Operations
- Tailwind css // CSS Styling Library
- Axios // For API requests
