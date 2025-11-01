import { createClient } from "./supabase/client";

const supabase = createClient();

const BASE_URL = "https://madisonjay-backend-8e7912547948.herokuapp.com/api/v1";

const getAuthToken = async (router = null) => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        console.error("Error getting Supabase session:", error.message);
        throw new Error("Failed to get authentication session.");
    }

    if (!session || !session.access_token || !session.refresh_token) {
        console.warn("No active Supabase session or missing tokens found.");
        if (router) {
            router.push("/login");
        }
        throw new Error("No authenticated session. Please log in.");
    }
    return { accessToken: session.access_token, refreshToken: session.refresh_token };
};

const callApi = async (endpoint, method = "GET", data = null, router = null) => {
    const { accessToken, refreshToken } = await getAuthToken(router);

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Refresh-Token": refreshToken,
    };

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Check for 204 No Content status code
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        let responseData = null;

        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            if (responseData) {
                if (typeof responseData === 'object' && responseData !== null) {
                    if (responseData.error) {
                        errorMessage = responseData.error;
                    } else if (responseData.message) {
                        errorMessage = responseData.message;
                    } else if (responseData.details && Array.isArray(responseData.details)) {
                        errorMessage = `Validation failed: ${responseData.details.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ")}`;
                    } else {
                        errorMessage = JSON.stringify(responseData);
                    }
                } else {
                    errorMessage = responseData;
                }
            }
            throw new Error(errorMessage);
        }
        return responseData;
    } catch (error) {
        console.error(`Error calling API ${endpoint}:`, error);
        throw error;
    }
};

const apiService = {
    sendInvoiceEmail: async (formData, router) => {
        try {
            const token = localStorage.getItem('access_token');

            const response = await fetch(`${process.env.RESEND_API_KEY}/api/invoice/send-email`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('first_name');
                router.push('/login');
                throw new Error('Authentication failed');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send invoice email email');
            }

            return data;
        } catch (error) {
            console.error('Error in sendInvoiceEmail:', error);
            throw error;
        }
    },

    getEmployees: async (router) => {
        return callApi("/employees", "GET", null, router);
    },

    getEmployeeById: async (employeeId, router) => {
        return callApi(`/employees/${employeeId}`, "GET", null, router);
    },

    createEmployee: async (employeeData, router) => {
        return callApi("/employees", "POST", employeeData, router);
    },

    updateEmployee: async (employeeId, employeeData, router) => {
        return callApi(`/employees/${employeeId}`, "PUT", employeeData, router);
    },

    deleteEmployee: async (employeeId, employeeData, router) => {
        return callApi(`/employees/${employeeId}`, "DELETE", employeeData, router);
    },

    // leave APIs
    getLeaves: async (router) => {
        return callApi("/leave_requests", "GET", null, router);
    },

    getLeaveById: async (leaveId, router) => {
        return callApi(`/leave_requests/${leaveId}`, "GET", null, router);
    },

    updateLeave: async (leaveId, leaveData, router) => {
        return callApi(`/leave_requests/${leaveId}`, "PUT", leaveData, router);
    },

    requestLeave: async (leaveData, router) => {
        return callApi("/leave_requests", "POST", leaveData, router);
    },

    // Enhanced Task APIs (from Flask backend)
    getTasks: async (router) => {
        return callApi("/tasks", "GET", null, router);
    },

    createTask: async (taskData, router) => {
        return callApi("/tasks", "POST", taskData, router);
    },

    getTaskById: async (taskId, router) => {
        return callApi(`/tasks/${taskId}`, "GET", null, router);
    },

    updateTask: async (taskId, taskData, router) => {
        return callApi(`/tasks/${taskId}`, "PUT", taskData, router);
    },

    deleteTask: async (taskId, router) => {
        return callApi(`/tasks/${taskId}`, "DELETE", null, router);
    },



    // Task Document APIs
    addTaskDocument: async (taskId, documentData, router) => {
        return callApi(`/tasks/${taskId}/documents`, "POST", documentData, router);
    },

    updateTaskDocument: async (taskId, documentId, documentData, router) => {
        return callApi(`/tasks/${taskId}/documents/${documentId}`, "PUT", documentData, router);
    },

    deleteTaskDocument: async (taskId, documentId, router) => {
        return callApi(`/tasks/${taskId}/documents/${documentId}`, "DELETE", null, router);
    },

    addEmployeeToTask: async (taskId, employeeId, router) => {
        return callApi(`/tasks/${taskId}/assignments`, "POST", { employee_id: employeeId }, router);
    },

    removeEmployeeFromTask: async (taskId, employeeId, router) => {
        return callApi(`/tasks/${taskId}/assignments/${employeeId}`, "DELETE", null, router);
    },

    // shift APIs
    getShifts: async (router) => {
        return callApi("/shift_types", "GET", null, router);
    },

    getShiftById: async (shiftId, router) => {
        return callApi(`/shift_types/${shiftId}`, "GET", null, router);
    },

    createShift: async (shiftData, router) => {
        return callApi("/shift_types", "POST", shiftData, router);
    },

    updateShift: async (shiftId, shiftData, router) => {
        return callApi(`/shift_types/${shiftId}`, "PUT", shiftData, router);
    },

    deleteShift: async (shiftId, router) => {
        return callApi(`/shift_types/${shiftId}`, "DELETE", null, router);
    },

    getEmployeeShiftSchedules: async (employeeId, router) => {
        return callApi(`/shift_schedules/employees/${employeeId}`, "GET", null, router);
    },

    getCurrentShiftSchedules: async (router) => {
        return callApi("/shift_schedules", "GET", null, router);
    },

    createShiftSchedule: async (scheduleData, router) => {
        return callApi("/shift_schedules", "POST", scheduleData, router);
    },

    updateShiftSchedule: async (scheduleId, scheduleData, router) => {
        return callApi(`/shift_schedules/${scheduleId}`, "PUT", scheduleData, router);
    },

    deleteShiftSchedule: async (scheduleId, router) => {
        return callApi(`/shift_schedules/${scheduleId}`, "DELETE", null, router);
    },

    // payment APIs
    getEmployeePayments: async (router) => {
        return callApi("/employee_payments", "GET", null, router);
    },

    getEmployeePaymentById: async (employeeId, router) => {
        return callApi(`/employee_payments/${employeeId}`, "GET", null, router);
    },

    getEmployeePayroll: async (employeeId, router) => {
        return callApi(`/employee_payments/payroll/${employeeId}`, "GET", null, router);
    },

    // deduction APIs
    getDeductions: async (router) => {
        return callApi("/deductions", "GET", null, router);
    },

    getDeductionsById: async (employeeId, router) => {
        return callApi(`/employee/deductions/${employeeId}`, "GET", null, router);
    },

    addDeduction: async (deductionData, router) => {
        return callApi(`/deductions`, "POST", deductionData, router);
    },

    updateDeduction: async (deductionId, deductionData, router) => {
        return callApi(`/deductions/${deductionId}`, "PUT", deductionData, router);
    },

    // default charges APIs
    getDefaultCharges: async (router) => {
        return callApi("/default_charges", "GET", null, router);
    },

    addDefaultCharge: async (defaultChargeData, router) => {
        return callApi(`/default_charges`, "POST", defaultChargeData, router);
    },

    generateEmployeePayment: async (employeeId, router) => {
        return callApi(`/employee_payments/${employeeId}`, "POST", null, router);
    },

    addEmployeeDocuments: async (employeeId, documentsArray, router) => {
        const payload = {
            documents: documentsArray
        };
        return callApi(`/employees/${employeeId}/documents`, 'POST', payload, router);
    },

    updateEmployeeDocument: async (documentId, documentData, router) => {
        return callApi(`/employee_documents/${documentId}`, 'PUT', documentData, router);
    },

    deleteEmployeeDocument: async (documentId, router) => {
        return callApi(`/employee_documents/${documentId}`, 'DELETE', null, router);
    },

    // Supplier APIs
    getSuppliers: async (router) => {
        return callApi("/suppliers", "GET", null, router);
    },

    getSupplierById: async (supplierId, router) => {
        return callApi(`/suppliers/${supplierId}`, "GET", null, router);
    },

    createSupplier: async (supplierData, router) => {
        return callApi("/suppliers", "POST", supplierData, router);
    },

    updateSupplier: async (supplierId, supplierData, router) => {
        return callApi(`/suppliers/${supplierId}`, "PUT", supplierData, router);
    },

    deleteSupplier: async (supplierId, router) => {
        return callApi(`/suppliers/${supplierId}`, "DELETE", null, router);
    },

    // Components APIs
    getComponents: async (router) => {
        return callApi("/components", "GET", null, router);
    },

    getComponentById: async (componentId, router) => {
        return callApi(`/components/${componentId}`, "GET", null, router);
    },

    createComponent: async (componentData, router) => {
        return callApi("/components", "POST", componentData, router);
    },

    updateComponent: async (componentId, componentData, router) => {
        return callApi(`/components/${componentId}`, "PUT", componentData, router);
    },

    deleteComponent: async (componentId, router) => {
        return callApi(`/components/${componentId}`, "DELETE", null, router);
    },

    // Products APIs
    getProducts: async (router) => {
        return callApi("/products", "GET", null, router);
    },

    getProductById: async (productId, router) => {
        return callApi(`/products/${productId}`, "GET", null, router);
    },

    createProduct: async (productData, router) => {
        return callApi("/products", "POST", productData, router);
    },

    updateProduct: async (productId, productData, router) => {
        return callApi(`/products/${productId}`, "PUT", productData, router);
    },

    deleteProduct: async (productId, router) => {
        return callApi(`/products/${productId}`, "DELETE", null, router);
    },

    // BOM APIs
    addComponentToBOM: async (productId, bomData, router) => {
        return callApi(`/products/${productId}/component`, "POST", bomData, router);
    },

    removeComponentFromBOM: async (productId, componentId, router) => {
        return callApi(`/products/${productId}/component/${componentId}`, "DELETE", null, router);
    },

    // Import Batches APIs
    getImportBatches: async (router) => {
        return callApi("/import_batches", "GET", null, router);
    },

    getImportBatchById: async (batchId, router) => {
        return callApi(`/import_batches/${batchId}`, "GET", null, router);
    },

    createImportBatch: async (importBatchData, router) => {
        return callApi("/import_batches", "POST", importBatchData, router);
    },

    updateImportBatch: async (batchId, importBatchData, router) => {
        return callApi(`/import_batches/${batchId}`, "PUT", importBatchData, router);
    },

    deleteImportBatch: async (batchId, router) => {
        return callApi(`/import_batches/${batchId}`, "DELETE", null, router);
    },

    // Stock APIs
    createStockEntry: async (stockData, router) => {
        return callApi("/stocks", "POST", stockData, router);
    },

    getStocks: async (router) => {
        return callApi("/stocks", "GET", null, router);
    },

    getStockById: async (stockId, router) => {
        return callApi(`/stocks/${stockId}`, "GET", null, router);
    },

    updateStock: async (stockId, stockData, router) => {
        return callApi(`/stocks/${stockId}`, "PUT", stockData, router);
    },

    deleteStock: async (stockId, router) => {
        return callApi(`/stocks/${stockId}`, "DELETE", null, router);
    },

    // Stock Locations API
    getStockByLocation: async (locationId, router) => {
        return callApi(`/stocks/locations/${locationId}`, "GET", null, router);
    },

    // Customer APIs
    getCustomers: async (router) => {
        return callApi("/customers", "GET", null, router);
    },

    getCustomerById: async (customerId, router) => {
        return callApi(`/customers/${customerId}`, "GET", null, router);
    },

    createCustomer: async (customerData, router) => {
        return callApi("/customers", "POST", customerData, router);
    },

    updateCustomer: async (customerId, customerData, router) => {
        return callApi(`/customers/${customerId}`, "PUT", customerData, router);
    },

    // Order APIs
    getOrders: async (router) => {
        return callApi("/orders", "GET", null, router);
    },

    getOrderById: async (orderId, router) => {
        return callApi(`/orders/${orderId}`, "GET", null, router);
    },

    createOrder: async (orderData, router) => {
        return callApi("/orders", "POST", orderData, router);
    },

    updateOrder: async (orderId, orderData, router) => {
        return callApi(`/orders/${orderId}`, "PUT", orderData, router);
    },

    // Inventory Transactions API
    getInventoryTransactions: async (router) => {
        return callApi("/inventory/transactions", "GET", null, router);
    },

    // KSS Modules APIs (assuming GET endpoints exist based on comments in backend code)
    getModules: async (router) => {
        return callApi("/kss/modules", "GET", null, router);
    },

    getModuleById: async (moduleId, router) => {
        return callApi(`/kss/modules/${moduleId}`, "GET", null, router);
    },

    createModule: async (moduleData, router) => {
        return callApi("/kss/modules", "POST", moduleData, router);
    },

    updateModule: async (moduleId, moduleData, router) => {
        return callApi(`/kss/modules/${moduleId}`, "PUT", moduleData, router);
    },

    deleteModule: async (moduleId, router) => {
        return callApi(`/kss/modules/${moduleId}`, "DELETE", null, router);
    },

    // KSS Lessons APIs
    getLessons: async (router) => {
        return callApi("/kss/lessons", "GET", null, router);
    },

    getLessonById: async (lessonId, router) => {
        return callApi(`/kss/lessons/${lessonId}`, "GET", null, router);
    },

    createLesson: async (lessonData, router) => {
        return callApi("/kss/lessons", "POST", lessonData, router);
    },

    updateLesson: async (lessonId, lessonData, router) => {
        return callApi(`/kss/lessons/${lessonId}`, "PUT", lessonData, router);
    },

    deleteLesson: async (lessonId, router) => {
        return callApi(`/kss/lessons/${lessonId}`, "DELETE", null, router);
    },

    // KSS Assignments APIs (assuming GET endpoint for assignments per module)
    getAssignments: async (moduleId, router) => {
        return callApi(`/kss/modules/${moduleId}/assignments`, "GET", null, router);
    },

    createAssignment: async (moduleId, assignmentData, router) => {
        return callApi(`/kss/modules/${moduleId}/assignments`, "POST", assignmentData, router);
    },

    deleteAssignment: async (assignmentId, router) => {
        return callApi(`/kss/modules/assignments/${assignmentId}`, "DELETE", null, router);
    },

    // KSS Employee Lesson Progress APIs
    trackLessonProgress: async (lessonId, progressData, router) => {
        return callApi(`/kss/lessons/${lessonId}/progress`, "POST", progressData, router);
    },

    checkModuleCompletion: async (moduleId, completionData, router) => {
        return callApi(`/kss/modules/${moduleId}/completion`, "GET", completionData, router);
    },

    // KSS Questions APIs
    getQuestions: async (moduleId, router) => {
        return callApi(`/kss/questions/${moduleId}`, "GET", null, router);
    },

    createQuestion: async (questionData, router) => {
        return callApi("/kss/questions", "POST", questionData, router);
    },

    updateQuestion: async (questionId, questionData, router) => {
        return callApi(`/kss/questions/${questionId}`, "PUT", questionData, router);
    },

    deleteQuestion: async (questionId, router) => {
        return callApi(`/kss/questions/${questionId}`, "DELETE", null, router);
    },

    // KSS Test Submission API
    submitTest: async (testData, router) => {
        return callApi("/kss/test/submit", "POST", testData, router);
    },

    // Add these to your existing apiService object

    // === KPI TEMPLATES ===
    getKPITemplates: async (router) => {
        return callApi("/hr/kpi/templates", "GET", null, router);
    },

    createKPITemplate: async (templateData, router) => {
        return callApi("/hr/kpi/templates", "POST", templateData, router);
    },

    updateKPITemplate: async (templateId, templateData, router) => {
        return callApi(`/hr/kpi/templates/${templateId}`, "PUT", templateData, router);
    },

    deleteKPITemplate: async (templateId, router) => {
        return callApi(`/hr/kpi/templates/${templateId}`, "DELETE", null, router);
    },

    // === KPI ROLE ASSIGNMENTS ===
    getKPIRoleAssignments: async (router) => {
        return callApi("/hr/kpi/role-assignments", "GET", null, router);
    },

    createKPIRoleAssignment: async (assignmentData, router) => {
        return callApi("/hr/kpi/role-assignments", "POST", assignmentData, router);
    },

    updateKPIRoleAssignment: async (assignmentId, assignmentData, router) => {
        return callApi(`/hr/kpi/role-assignments/${assignmentId}`, "PUT", assignmentData, router);
    },

    deleteKPIRoleAssignment: async (assignmentId, router) => {
        return callApi(`/hr/kpi/role-assignments/${assignmentId}`, "DELETE", null, router);
    },

    // === EMPLOYEE KPI ASSIGNMENTS ===
    getEmployeeKPIAssignments: async (router) => {
        return callApi("/hr/kpi/employee-assignments", "GET", null, router);
    },

    getMyKPIAssignments: async (router) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: employee } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!employee) throw new Error("Employee not found");

        return callApi(`/hr/kpi/employee-assignments?employee_id=${employee.id}`, "GET", null, router);
    },

    createEmployeeKPIAssignment: async (assignmentData, router) => {
        return callApi("/hr/kpi/employee-assignments", "POST", assignmentData, router);
    },

    submitKPIAssignment: async (assignmentId, submissionData, router) => {
        return callApi(`/hr/kpi/employee-assignments/${assignmentId}`, "PUT", submissionData, router);
    },

    deleteEmployeeKPIAssignment: async (assignmentId, router) => {
        return callApi(`/hr/kpi/employee-assignments/${assignmentId}`, "DELETE", null, router);
    },
};

export default apiService;