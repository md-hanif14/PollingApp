// mobile/src/api/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:4000/api'; // Android emulator = use http://10.0.2.2:4000/api for android

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
