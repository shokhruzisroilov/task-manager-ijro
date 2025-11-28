import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { APIErrorHandler } from './errorHandler';

/**
 * API Base URL from environment variables
 * Defaults to localhost:8080 for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * APIClient class for making HTTP requests to the backend
 * Implements Requirements 1.3, 1.4, 15.2, 15.3
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        // Bypass ngrok warning page
        'ngrok-skip-browser-warning': 'true'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Sets up request and response interceptors
   * - Request interceptor adds JWT token to headers
   * - Response interceptor handles errors uniformly
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError = APIErrorHandler.handle(error);

        // Handle 401 errors by redirecting to login
        // Requirement 1.4, 15.4: Redirect to login and preserve intended destination
        if (apiError.status === 401) {
          // Clear token
          localStorage.removeItem('auth_token');
          
          // Only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/login' || 
                            currentPath === '/register' || 
                            currentPath === '/verify-email';
          
          if (!isAuthPage) {
            // Preserve the current location for redirect after login
            const redirectPath = `${currentPath}${window.location.search}${window.location.hash}`;
            sessionStorage.setItem('redirect_after_login', redirectPath);
            
            // Redirect to login
            window.location.href = '/login';
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Makes a GET request
   * @param url - The endpoint URL
   * @param config - Optional Axios config
   * @returns Promise with response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Makes a POST request
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Optional Axios config
   * @returns Promise with response data
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Optional Axios config
   * @returns Promise with response data
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PATCH request
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Optional Axios config
   * @returns Promise with response data
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request
   * @param url - The endpoint URL
   * @param config - Optional Axios config
   * @returns Promise with response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

/**
 * Singleton instance of APIClient
 * Export this to use throughout the application
 */
export const apiClient = new APIClient();
