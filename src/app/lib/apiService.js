// app/lib/apiService.js
import { createClient } from "./supabase/client";

const supabase = createClient();

const BASE_URL = "http://localhost:3001/api/v1";

const getAuthToken = async (router = null) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  console.log("Supabase Session:", session);

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

  deleteEmployee: async (employeeId, router) => {
    return callApi(`/employees/${employeeId}`, "DELETE", null, router);
  },
};

export default apiService;
