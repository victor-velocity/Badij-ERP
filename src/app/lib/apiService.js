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
        body: data && (method === "POST" || method === "PUT" || method === "PATCH") ? JSON.stringify(data) : undefined,
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
    // employee APIs
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
    updateTaskDocument: async (taskId, documentId, documentData, router) => {
        return callApi(`/task/${taskId}/documents/${documentId}`, "PUT", documentData, router);
    },

    deleteTaskDocument: async (taskId, documentId, router) => {
        return callApi(`/task/${taskId}/documents/${documentId}`, "DELETE", null, router);
    },

    addEmployeesToTask: async (taskId, employeeIds, router) => {
        return callApi(`/task/${taskId}/assignments`, "POST", { assigned_to: employeeIds }, router);
    },

    removeEmployeeFromTask: async (taskId, employeeId, router) => {
        return callApi(`/task/${taskId}/assignments/${employeeId}`, "DELETE", null, router);
    },

    // shift APIs
    getShifts: async (router) => {
        return callApi("/shift_types", "GET", null, router);
    },

    getShiftById: async (shiftId, router) => {
        return callApi(`/shift_types/${shiftId}`, "GET", null, router);
    },

    updateShift: async (shiftId, shiftData, router) => {
        return callApi(`/shift_types/${shiftId}`, "PUT", shiftData, router);
    },

    // payment APIs
    getEmployeePayments: async (router) => {
        return callApi("/employee_payments", "GET", null, router);
    },

    getEmployeePaymentById: async (employeeId, router) => {
        return callApi(`/employee_payments/${employeeId}`, "GET", null, router);
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

};

export default apiService;