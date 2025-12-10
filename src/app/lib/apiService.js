// apiService.js
import { createClient } from "./supabase/client";

const supabase = createClient();
const BASE_URL = "https://badij-erp-backend-e3eaf0e85d28.herokuapp.com/api/v1";

const CACHE_PREFIX = "api_cache_";
const CACHE_EXPIRY = 1000 * 60 * 5;

const isOnline = () => typeof navigator !== "undefined" && navigator.onLine;

const getCacheKey = (endpoint, method = "GET", data = null) => {
    const dataKey = data ? JSON.stringify(data) : "";
    const hash = btoa(dataKey).replace(/=/g, "").slice(0, 20);
    return `${CACHE_PREFIX}${method}_${endpoint}_${hash}`;
};

const setCache = (key, data) => {
    try {
        const item = { data, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.warn("LocalStorage full, skipping cache write");
    }
};

const getCache = (key) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

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
        if (router) router.push?.("/login");
        throw new Error("No authenticated session. Please log in.");
    }
    return { accessToken: session.access_token, refreshToken: session.refresh_token };
};


const cachedcallApi = async (endpoint, method = "GET", data = null, router = null) => {
    const cacheKey = getCacheKey(endpoint, method, data);

    // 1. Try to return fresh cache first
    const cachedData = getCache(cacheKey);
    if (cachedData !== null && isOnline() === false) {
        // Offline → return cache (even if expired)
        return cachedData;
    }

    // 2. Always try fresh request when online
    if (isOnline()) {
        try {
            const { accessToken, refreshToken } = await getAuthToken(router);

            const headers = {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Refresh-Token": refreshToken,
            };

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
            });

            if (response.status === 204) {
                setCache(cacheKey, null);
                return null;
            }

            const contentType = response.headers.get("content-type");
            const responseData = contentType?.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status}`;
                if (responseData && typeof responseData === "object") {
                    errorMessage = responseData.error || responseData.message || JSON.stringify(responseData);
                }
                throw new Error(errorMessage);
            }

            // SUCCESS → update cache
            setCache(cacheKey, responseData);

            // If we had stale cache before, notify UI to update
            if (cachedData !== null) {
                window.dispatchEvent(
                    new CustomEvent("api-cache-updated", {
                        detail: { endpoint, data: responseData }, // ← now sends FRESH data!
                    })
                );
            }

            return responseData;

        } catch (error) {
            // If request fails but we have cache → fall back to cache
            if (cachedData !== null) {
                console.warn("API failed, falling back to cache:", error.message);
                return cachedData;
            }
            throw error; // No cache → re-throw
        }
    }

    // 3. Offline + no cache → error
    if (cachedData !== null) return cachedData;
    throw new Error("You are offline and no cached data available");
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
        return cachedcallApi("/employees", "GET", null, router);
    },

    getEmployeeById: async (employeeId, router) => {
        return cachedcallApi(`/employees/${employeeId}`, "GET", null, router);
    },

    createEmployee: async (employeeData, router) => {
        return cachedcallApi("/employees", "POST", employeeData, router);
    },

    updateEmployee: async (employeeId, employeeData, router) => {
        return cachedcallApi(`/employees/${employeeId}`, "PUT", employeeData, router);
    },

    deleteEmployee: async (employeeId, employeeData, router) => {
        return cachedcallApi(`/employees/${employeeId}`, "DELETE", employeeData, router);
    },

    getLeaves: async (router) => {
        return cachedcallApi("/leave_requests", "GET", null, router);
    },

    getLeaveById: async (leaveId, router) => {
        return cachedcallApi(`/leave_requests/${leaveId}`, "GET", null, router);
    },

    updateLeave: async (leaveId, leaveData, router) => {
        return cachedcallApi(`/leave_requests/${leaveId}`, "PUT", leaveData, router);
    },

    requestLeave: async (leaveData, router) => {
        return cachedcallApi("/leave_requests", "POST", leaveData, router);
    },

    getTasks: async (router) => {
        return cachedcallApi("/tasks", "GET", null, router);
    },

    createTask: async (taskData, router) => {
        return cachedcallApi("/tasks", "POST", taskData, router);
    },

    getTaskById: async (taskId, router) => {
        return cachedcallApi(`/tasks/${taskId}`, "GET", null, router);
    },

    updateTask: async (taskId, taskData, router) => {
        return cachedcallApi(`/tasks/${taskId}`, "PUT", taskData, router);
    },

    deleteTask: async (taskId, router) => {
        return cachedcallApi(`/tasks/${taskId}`, "DELETE", null, router);
    },

    addTaskDocument: async (taskId, documentData, router) => {
        return cachedcallApi(`/tasks/${taskId}/documents`, "POST", documentData, router);
    },

    updateTaskDocument: async (taskId, documentId, documentData, router) => {
        return cachedcallApi(`/tasks/${taskId}/documents/${documentId}`, "PUT", documentData, router);
    },

    deleteTaskDocument: async (taskId, documentId, router) => {
        return cachedcallApi(`/tasks/${taskId}/documents/${documentId}`, "DELETE", null, router);
    },

    addEmployeeToTask: async (taskId, employeeId, router) => {
        return cachedcallApi(`/tasks/${taskId}/assignments`, "POST", { employee_id: employeeId }, router);
    },

    removeEmployeeFromTask: async (taskId, employeeId, router) => {
        return cachedcallApi(`/tasks/${taskId}/assignments/${employeeId}`, "DELETE", null, router);
    },

    getShifts: async (router) => {
        return cachedcallApi("/shift_types", "GET", null, router);
    },

    getShiftById: async (shiftId, router) => {
        return cachedcallApi(`/shift_types/${shiftId}`, "GET", null, router);
    },

    createShift: async (shiftData, router) => {
        return cachedcallApi("/shift_types", "POST", shiftData, router);
    },

    updateShift: async (shiftId, shiftData, router) => {
        return cachedcallApi(`/shift_types/${shiftId}`, "PUT", shiftData, router);
    },

    deleteShift: async (shiftId, router) => {
        return cachedcallApi(`/shift_types/${shiftId}`, "DELETE", null, router);
    },

    getEmployeeShiftSchedules: async (employeeId, router) => {
        return cachedcallApi(`/shift_schedules/employees/${employeeId}`, "GET", null, router);
    },

    getCurrentShiftSchedules: async (router) => {
        return cachedcallApi("/shift_schedules", "GET", null, router);
    },

    createShiftSchedule: async (scheduleData, router) => {
        return cachedcallApi("/shift_schedules", "POST", scheduleData, router);
    },

    updateShiftSchedule: async (scheduleId, scheduleData, router) => {
        return cachedcallApi(`/shift_schedules/${scheduleId}`, "PUT", scheduleData, router);
    },

    deleteShiftSchedule: async (scheduleId, router) => {
        return cachedcallApi(`/shift_schedules/${scheduleId}`, "DELETE", null, router);
    },

    getEmployeePayments: async (router) => {
        return cachedcallApi("/employee_payments", "GET", null, router);
    },

    getEmployeePaymentById: async (employeeId, router) => {
        return cachedcallApi(`/employee_payments/${employeeId}`, "GET", null, router);
    },

    getEmployeePayroll: async (employeeId, router) => {
        return cachedcallApi(`/employee_payments/payroll/${employeeId}`, "GET", null, router);
    },

    getDeductions: async (router) => {
        return cachedcallApi("/deductions", "GET", null, router);
    },

    getDeductionsById: async (employeeId, router) => {
        return cachedcallApi(`/employee/deductions/${employeeId}`, "GET", null, router);
    },

    addDeduction: async (deductionData, router) => {
        return cachedcallApi(`/deductions`, "POST", deductionData, router);
    },

    updateDeduction: async (deductionId, deductionData, router) => {
        return cachedcallApi(`/deductions/${deductionId}`, "PUT", deductionData, router);
    },

    getDefaultCharges: async (router) => {
        return cachedcallApi("/default_charges", "GET", null, router);
    },

    addDefaultCharge: async (defaultChargeData, router) => {
        return cachedcallApi(`/default_charges`, "POST", defaultChargeData, router);
    },

    generateEmployeePayment: async (employeeId, router) => {
        return cachedcallApi(`/employee_payments/${employeeId}`, "POST", null, router);
    },

    addEmployeeDocuments: async (employeeId, documentsArray, router) => {
        const payload = {
            documents: documentsArray
        };
        return cachedcallApi(`/employees/${employeeId}/documents`, 'POST', payload, router);
    },

    updateEmployeeDocument: async (documentId, documentData, router) => {
        return cachedcallApi(`/employee_documents/${documentId}`, 'PUT', documentData, router);
    },

    deleteEmployeeDocument: async (documentId, router) => {
        return cachedcallApi(`/employee_documents/${documentId}`, 'DELETE', null, router);
    },

    getSuppliers: async (router) => {
        return cachedcallApi("/suppliers", "GET", null, router);
    },

    getSupplierById: async (supplierId, router) => {
        const cacheKey = `supplier_${supplierId}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        const resp = await cachedcallApi(`/suppliers/${supplierId}`, "GET", null, router);
        if (resp?.status === 'success') {
            const sup = resp.data;
            sessionStorage.setItem(cacheKey, JSON.stringify(sup));
            return sup;
        }
        return null;
    },

    createSupplier: async (supplierData, router) => {
        return cachedcallApi("/suppliers", "POST", supplierData, router);
    },

    updateSupplier: async (supplierId, supplierData, router) => {
        return cachedcallApi(`/suppliers/${supplierId}`, "PUT", supplierData, router);
    },

    deleteSupplier: async (supplierId, router) => {
        return cachedcallApi(`/suppliers/${supplierId}`, "DELETE", null, router);
    },

    getComponents: async (router) => {
        return cachedcallApi("/components", "GET", null, router);
    },

    getComponentById: async (componentId, router) => {
        return cachedcallApi(`/components/${componentId}`, "GET", null, router);
    },

    createComponent: async (componentData, router) => {
        return cachedcallApi("/components", "POST", componentData, router);
    },

    updateComponent: async (componentId, componentData, router) => {
        return cachedcallApi(`/components/${componentId}`, "PUT", componentData, router);
    },

    deleteComponent: async (componentId, router) => {
        return cachedcallApi(`/components/${componentId}`, "DELETE", null, router);
    },

    getProducts: async (router) => {
        return cachedcallApi("/products", "GET", null, router);
    },

    getProductById: async (productId, router) => {
        return cachedcallApi(`/products/${productId}`, "GET", null, router);
    },

    createProduct: async (productData, router) => {
        return cachedcallApi("/products", "POST", productData, router);
    },

    updateProduct: async (productId, productData, router) => {
        return cachedcallApi(`/products/${productId}`, "PUT", productData, router);
    },

    deleteProduct: async (productId, router) => {
        return cachedcallApi(`/products/${productId}`, "DELETE", null, router);
    },

    addComponentToBOM: async (productId, bomData, router) => {
        return cachedcallApi(`/products/${productId}/component`, "POST", bomData, router);
    },

    removeComponentFromBOM: async (productId, componentId, router) => {
        return cachedcallApi(`/products/${productId}/component/${componentId}`, "DELETE", null, router);
    },

    getImportBatches: async (router) => {
        return cachedcallApi("/import_batches", "GET", null, router);
    },

    getImportBatchById: async (batchId, router) => {
        return cachedcallApi(`/import_batches/${batchId}`, "GET", null, router);
    },

    createImportBatch: async (importBatchData, router) => {
        return cachedcallApi("/import_batches", "POST", importBatchData, router);
    },

    updateImportBatch: async (batchId, importBatchData, router) => {
        return cachedcallApi(`/import_batches/${batchId}`, "PUT", importBatchData, router);
    },

    deleteImportBatch: async (batchId, router) => {
        return cachedcallApi(`/import_batches/${batchId}`, "DELETE", null, router);
    },

    createStockEntry: async (stockData, router) => {
        return cachedcallApi("/stocks", "POST", stockData, router);
    },

    getStocks: async (router) => {
        return cachedcallApi("/stocks", "GET", null, router);
    },

    getStockById: async (stockId, router) => {
        return cachedcallApi(`/stocks/${stockId}`, "GET", null, router);
    },

    updateStock: async (stockId, stockData, router) => {
        return cachedcallApi(`/stocks/${stockId}`, "PUT", stockData, router);
    },

    deleteStock: async (stockId, router) => {
        return cachedcallApi(`/stocks/${stockId}`, "DELETE", null, router);
    },

    getStockByLocation: async (locationId, router) => {
        return cachedcallApi(`/stocks/locations/${locationId}`, "GET", null, router);
    },

    sellStockBatch: async (items, router) => {
        const payload = items.map(item => ({
            box_id: item.box_id,
            requested_quantity: item.requested_quantity || 1,
            order_id: item.order_id
        }));
        return cachedcallApi("/stocks/sell", "POST", payload, router);
    },

    getBoxByBarcode: async (barcode, router) => {
        return cachedcallApi(`/stocks/barcode/${barcode}`, "GET", null, router);
    },

    getCustomers: async (router) => {
        return cachedcallApi("/customers", "GET", null, router);
    },

    getCustomerById: async (customerId, router) => {
        return cachedcallApi(`/customers/${customerId}`, "GET", null, router);
    },

    createCustomer: async (customerData, router) => {
        return cachedcallApi("/customers", "POST", customerData, router);
    },

    updateCustomer: async (customerId, customerData, router) => {
        return cachedcallApi(`/customers/${customerId}`, "PUT", customerData, router);
    },

    getOrders: async (router) => {
        return cachedcallApi("/orders", "GET", null, router);
    },

    getOrderById: async (orderId, router) => {
        return cachedcallApi(`/orders/${orderId}`, "GET", null, router);
    },

    createOrder: async (orderData, router) => {
        return cachedcallApi("/orders", "POST", orderData, router);
    },

    updateOrder: async (orderId, orderData, router) => {
        return cachedcallApi(`/orders/${orderId}`, "PUT", orderData, router);
    },

    getInventoryTransactions: async (router) => {
        return cachedcallApi("/inventory/transactions", "GET", null, router);
    },

    getModules: async (router) => {
        return cachedcallApi("/kss/modules", "GET", null, router);
    },

    getModuleById: async (moduleId, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}`, "GET", null, router);
    },

    createModule: async (moduleData, router) => {
        return cachedcallApi("/kss/modules", "POST", moduleData, router);
    },

    updateModule: async (moduleId, moduleData, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}`, "PUT", moduleData, router);
    },

    deleteModule: async (moduleId, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}`, "DELETE", null, router);
    },

    getLessons: async (router) => {
        return cachedcallApi("/kss/lessons", "GET", null, router);
    },

    getLessonById: async (lessonId, router) => {
        return cachedcallApi(`/kss/lessons/${lessonId}`, "GET", null, router);
    },

    createLesson: async (lessonData, router) => {
        return cachedcallApi("/kss/lessons", "POST", lessonData, router);
    },

    updateLesson: async (lessonId, lessonData, router) => {
        return cachedcallApi(`/kss/lessons/${lessonId}`, "PUT", lessonData, router);
    },

    deleteLesson: async (lessonId, router) => {
        return cachedcallApi(`/kss/lessons/${lessonId}`, "DELETE", null, router);
    },

    getAssignments: async (moduleId, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}/assignments`, "GET", null, router);
    },

    createAssignment: async (moduleId, assignmentData, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}/assignments`, "POST", assignmentData, router);
    },

    deleteAssignment: async (assignmentId, router) => {
        return cachedcallApi(`/kss/modules/assignments/${assignmentId}`, "DELETE", null, router);
    },

    trackLessonProgress: async (lessonId, progressData, router) => {
        return cachedcallApi(`/kss/lessons/${lessonId}/progress`, "POST", progressData, router);
    },

    checkModuleCompletion: async (moduleId, completionData, router) => {
        const employeeId = completionData?.employee_id;
        if (!employeeId) throw new Error("employee_id is required");

        const query = `?employee_id=${encodeURIComponent(employeeId)}`;
        return cachedcallApi(`/kss/modules/${moduleId}/completion${query}`, "GET", null, router);
    },

    getQuestions: async (moduleId, router) => {
        return cachedcallApi(`/kss/questions/${moduleId}`, "GET", null, router);
    },

    createQuestion: async (questionData, router) => {
        return cachedcallApi("/kss/questions", "POST", questionData, router);
    },

    updateQuestion: async (questionId, questionData, router) => {
        return cachedcallApi(`/kss/questions/${questionId}`, "PUT", questionData, router);
    },

    deleteQuestion: async (questionId, router) => {
        return cachedcallApi(`/kss/questions/${questionId}`, "DELETE", null, router);
    },

    submitTest: async (testData, router) => {
        return cachedcallApi("/kss/test/submit", "POST", testData, router);
    },

    getQuizCompletion: async (moduleId, router) => {
        return cachedcallApi(`/kss/test/completion/${moduleId}`, "GET", null, router);
    },

    getQuizAnswers: async (moduleId, router) => {
        return cachedcallApi(`/kss/test/answers/${moduleId}`, "GET", null, router);
    },

    getLessonProgress: async (moduleId, router) => {
        return cachedcallApi(`/kss/modules/${moduleId}/progress`, "GET", null, router);
    },

    getKPITemplates: async (router) => {
        return cachedcallApi("/hr/kpi/templates", "GET", null, router);
    },

    createKPITemplate: async (templateData, router) => {
        return cachedcallApi("/hr/kpi/templates", "POST", templateData, router);
    },

    updateKPITemplate: async (templateId, templateData, router) => {
        return cachedcallApi(`/hr/kpi/templates/${templateId}`, "PUT", templateData, router);
    },

    deleteKPITemplate: async (templateId, router) => {
        return cachedcallApi(`/hr/kpi/templates/${templateId}`, "DELETE", null, router);
    },

    getKPIRoleAssignments: async (router) => {
        return cachedcallApi("/hr/kpi/role-assignments", "GET", null, router);
    },

    createKPIRoleAssignment: async (assignmentData, router) => {
        return cachedcallApi("/hr/kpi/role-assignments", "POST", assignmentData, router);
    },

    updateKPIRoleAssignment: async (assignmentId, assignmentData, router) => {
        return cachedcallApi(`/hr/kpi/role-assignments/${assignmentId}`, "PUT", assignmentData, router);
    },

    deleteKPIRoleAssignment: async (assignmentId, router) => {
        return cachedcallApi(`/hr/kpi/role-assignments/${assignmentId}`, "DELETE", null, router);
    },

    getEmployeeKPIAssignments: async (employeeId, router) => {
        return cachedcallApi(`/hr/kpi/employee-assignments/${employeeId}`, "GET", null, router);
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

        return cachedcallApi(`/hr/kpi/employee-assignments/${employee.id}`, "GET", null, router);
    },

    getEmployeeKPIAssignmentsById: async (employeeId, router) => {
        return cachedcallApi(`/hr/kpi/employee-assignments/${employeeId}`, "GET", null, router);
    },

    createEmployeeKPIAssignment: async (assignmentData, router) => {
        return cachedcallApi("/hr/kpi/employee-assignments", "POST", assignmentData, router);
    },

    submitKPIAssignment: async (assignmentId, submissionData, router) => {
        return cachedcallApi(`/hr/kpi/employee-assignments/${assignmentId}`, "PUT", submissionData, router);
    },

    deleteEmployeeKPIAssignment: async (assignmentId, router) => {
        return cachedcallApi(`/hr/kpi/employee-assignments/${assignmentId}`, "DELETE", null, router);
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
        return cachedcallApi(`/hr/biometrics/employees/${employeeId}`, "POST", null, router);
    },

    deleteBiometricEmployee: async (employeeId, router) => {
        return cachedcallApi(`/hr/biometrics/employees/${employeeId}`, "DELETE", null, router);
    },

    syncAttendanceTransactions: async (payload, router) => {
        return cachedcallApi("/hr/biometrics/sync-attendance", "POST", payload, router);
    },

    getAttendanceTransactions: async (filters = {}, router) => {
        let endpoint = "/hr/biometrics/attendance-transactions";
        const params = new URLSearchParams();
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        return cachedcallApi(endpoint, "GET", null, router);
    },

    getEmployeeAttendanceTransactions: async (employeeId, router) => {
        return cachedcallApi(`/hr/biometrics/attendance-transactions/${employeeId}`, "GET", null, router);
    }
};

export default apiService;