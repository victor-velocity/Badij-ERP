// app/lib/apiService.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = "http://localhost:3001/api/v1";


const getAuthToken = async (router = null) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log(session)
    if (error) {
        console.error("Error getting Supabase session:", error.message);
        throw new Error("Failed to get authentication session.");
    }
    if (!session || !session.access_token) {
        console.error("No active Supabase session found.");
        if (router) {
            router.push("/login");
        }
        throw new Error("No authenticated session. Please log in.");
    }
    return session.access_token;
};

const callApi = async (endpoint, method = 'GET', data = null, router = null) => {
    const token = await getAuthToken(router); // Pass router to getAuthToken
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const responseData = await response.json();

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            if (responseData && responseData.error) {
                errorMessage = responseData.error;
            } else if (responseData && responseData.message) {
                errorMessage = responseData.message;
            } else if (responseData && responseData.details) {
                errorMessage = `Validation failed: ${responseData.details.map(d => d.msg).join(', ')}`;
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
    getEmployees: async (router) => {
        return callApi('/employees', 'GET', null, router);
    },

    getEmployeeById: async (employeeId, router) => {
        return callApi(`/employees/${employeeId}`, 'GET', null, router);
    },

    createEmployee: async (employeeData, router) => {
        return callApi('/employees', 'POST', employeeData, router);
    },

    updateEmployee: async (employeeId, employeeData, router) => {
        return callApi(`/employees/${employeeId}`, 'PUT', employeeData, router);
    },

    deleteEmployee: async (employeeId, router) => {
        return callApi(`/employees/${employeeId}`, 'DELETE', null, router);
    },
};

export default apiService;