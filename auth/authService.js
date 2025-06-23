class AuthService {
  constructor() {
    this.setupAxiosInterceptors();
  }
  
  setupAxiosInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );
    
    // Response interceptor for token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
          await this.handleTokenExpiration();
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }
  
  async handleTokenExpiration() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
  
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
  
  login(credentials) {
    return axios.post('/api/auth/login', credentials)
      .then(response => {
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        return { user, success: true };
      })
      .catch(error => {
        throw new Error(error.response?.data?.error || 'Login failed');
      });
  }
}