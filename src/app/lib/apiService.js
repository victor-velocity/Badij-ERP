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
        body: data ? JSON.stringify(data) : undefined
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

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
            const response = await fetch('/api/send-invoice', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send email');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('sendInvoiceEmail error:', error);
            throw error;
        }
    },

    getDepartments: async (router) => {
        const cacheKey = 'cached_departments';
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        const { data, error } = await supabase.from('departments')
            .select('id, name')
            .order('name');

        if (error) throw new Error(error.message);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    },

    getLocationsFromSupabase: async (router) => {
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) throw error;
            return { status: 'success', data };
        } catch (err) {
            console.error('Supabase locations error:', err);
            return { status: 'error', data: [], message: err.message };
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

    getEmployeePayments: async (router) => {
        return callApi("/employee_payments", "GET", null, router);
    },

    getEmployeePaymentById: async (employeeId, router) => {
        return callApi(`/employee_payments/${employeeId}`, "GET", null, router);
    },

    getEmployeePayroll: async (employeeId, router) => {
        return callApi(`/employee_payments/payroll/${employeeId}`, "GET", null, router);
    },

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

    getSuppliers: async (router) => {
        return callApi("/suppliers", "GET", null, router);
    },

    getSupplierById: async (supplierId, router) => {
        const cacheKey = `supplier_${supplierId}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        const resp = await callApi(`/suppliers/${supplierId}`, "GET", null, router);
        if (resp?.status === 'success') {
            const sup = resp.data;
            sessionStorage.setItem(cacheKey, JSON.stringify(sup));
            return sup;
        }
        return null;
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

    addComponentToBOM: async (productId, bomData, router) => {
        return callApi(`/products/${productId}/component`, "POST", bomData, router);
    },

    removeComponentFromBOM: async (productId, componentId, router) => {
        return callApi(`/products/${productId}/component/${componentId}`, "DELETE", null, router);
    },

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

    getStockByLocation: async (locationId, router) => {
        return callApi(`/stocks/locations/${locationId}`, "GET", null, router);
    },

    sellStockBatch: async (items, router) => {
        const payload = items.map(item => ({
            box_id: item.box_id,
            requested_quantity: item.requested_quantity || 1,
            order_id: item.order_id
        }));
        return callApi("/stocks/sell", "POST", payload, router);
    },

    getBoxByBarcode: async (barcode, router) => {
        return callApi(`/stocks/barcode/${barcode}`, "GET", null, router);
    },

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

    getInventoryTransactions: async (router) => {
        return callApi("/inventory/transactions", "GET", null, router);
    },

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

    getAssignments: async (moduleId, router) => {
        return callApi(`/kss/modules/${moduleId}/assignments`, "GET", null, router);
    },

    createAssignment: async (moduleId, assignmentData, router) => {
        return callApi(`/kss/modules/${moduleId}/assignments`, "POST", assignmentData, router);
    },

    deleteAssignment: async (assignmentId, router) => {
        return callApi(`/kss/modules/assignments/${assignmentId}`, "DELETE", null, router);
    },

    trackLessonProgress: async (lessonId, progressData, router) => {
        return callApi(`/kss/lessons/${lessonId}/progress`, "POST", progressData, router);
    },

    checkModuleCompletion: async (moduleId, completionData, router) => {
        const employeeId = completionData?.employee_id;
        if (!employeeId) throw new Error("employee_id is required");

        const query = `?employee_id=${encodeURIComponent(employeeId)}`;
        return callApi(`/kss/modules/${moduleId}/completion${query}`, "GET", null, router);
    },

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

    submitTest: async (testData, router) => {
        return callApi("/kss/test/submit", "POST", testData, router);
    },

    getQuizCompletion: async (moduleId, router) => {
        return callApi(`/kss/test/completion/${moduleId}`, "GET", null, router);
    },

    getQuizAnswers: async (moduleId, router) => {
        return callApi(`/kss/test/answers/${moduleId}`, "GET", null, router);
    },

    getLessonProgress: async (moduleId, router) => {
        return callApi(`/kss/modules/${moduleId}/progress`, "GET", null, router);
    },

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

    getEmployeeKPIAssignments: async (employeeId, router) => {
        return callApi(`/hr/kpi/employee-assignments/${employeeId}`, "GET", null, router);
    },

    getMyKPIAssignments: async (router) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: employee, error } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (error || !employee) throw new Error("Employee record not found");

        return callApi(`/hr/kpi/employee-assignments/${employee.id}`, "GET", null, router);
    },

    getEmployeeKPIAssignmentsById: async (employeeId, router) => {
        return callApi(`/hr/kpi/employee-assignments/${employeeId}`, "GET", null, router);
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

    ensureBucketExists: async (bucketName) => {
        const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
        if (listErr) throw listErr;
        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
            const { error: createErr } = await supabase.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/*', 'application/pdf']
            });
            if (createErr) throw createErr;
        }
    },

    uploadEvidence: async (path, file) => {
        const { data, error } = await supabase.storage
            .from('kpi-evidence')
            .upload(path, file, { upsert: true });
        if (error) throw error;
        return { data, error };
    },

    createBiometricEmployee: async (employeeId, router) => {
        return callApi(`/hr/biometrics/employees/${employeeId}`, "POST", null, router);
    },

    deleteBiometricEmployee: async (employeeId, router) => {
        return callApi(`/hr/biometrics/employees/${employeeId}`, "DELETE", null, router);
    },

    syncAttendanceTransactions: async (payload, router) => {
        return callApi("/hr/biometrics/sync-attendance", "POST", payload, router);
    },

    getAttendanceTransactions: async (filters = {}, router) => {
        let endpoint = "/hr/biometrics/attendance-transactions";
        const params = new URLSearchParams();
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        return callApi(endpoint, "GET", null, router);
    },

    getEmployeeAttendanceTransactions: async (employeeId, router) => {
        return callApi(`/hr/biometrics/attendance-transactions/${employeeId}`, "GET", null, router);
    }
};

export default apiService;