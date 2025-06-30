import axios from 'axios';
import keycloak from '../keyclaok/keycloak'; 

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const refreshed = await keycloak.updateToken(60);

    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${keycloak.token}`,
    };

    return config;
  } catch (error) {
    console.error('توکن قابل بروزرسانی نیست یا منقضی شده:', error)
    keycloak.logout();
    return Promise.reject(error);
  }
});

export default axiosInstance;
