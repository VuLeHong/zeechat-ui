// const BASE_URL = "https://api.farmcode.io.vn/v1";
const BASE_URL = 'http://localhost:8000';

const USER = {
  LOGIN_MANUAL: `${BASE_URL}/api/v1/user/login`,
  GET_ALL: `${BASE_URL}/api/v1/user`,
  GET_USER_BY_ID: `${BASE_URL}/api/v1/user`,
  UPDATE: `${BASE_URL}/api/v1/user`,
  CHANGE_PASSWORD: `${BASE_URL}/api/v1/user`,
};

const CHAT = {
  GET_ALL_CHAT: `${BASE_URL}/api/v1/chat/user`,
  CREATE_CHAT: `${BASE_URL}/api/v1/chat`,
  GET_ALL_CHAT_MESSAGES: `${BASE_URL}/api/v1/chat`,
  GET_CHAT_BY_ID: `${BASE_URL}/api/v1/chat`,
}


export const API = {
  USER,
  CHAT,
};
