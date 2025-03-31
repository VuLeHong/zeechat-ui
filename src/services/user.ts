import { API } from "@/utils/api";

const getAll = async () => {
  try {
    const response = await fetch(API.USER.GET_ALL, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("========= Error Get All Users:", error);
    return false;
  }
};

const searchAllFriends = async (user_id:string, searchText: string) => {
  try {
    const response = await fetch(`${API.USER.GET_ALL}/${user_id}/friends?searchText=${searchText}`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("========= Error Get All Users:", error);
    return false;
  }
};

const updateUser = async (id: any, payload: any) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const response = await fetch(`${API.USER.UPDATE}/${id}`, {
      method: "PATCH",
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("========= Error Update User:", error);
    return false;
  }
};

const updateUserStatus = async (id: any) => {
  try {
    const response = await fetch(`${API.USER.UPDATE}/${id}/status`, {
      method:"POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("========= Error Update User:", error);
    return false;
  }
};

const changePassword = async (id: any, payload: any) => {
  try {
    const response = await fetch(`${API.USER.CHANGE_PASSWORD}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("========= Error Update User:", error);
    return false;
  }
};

const addFriend = async (id: any, friend_id: string) => {
  try {
    const response = await fetch(`${API.USER.UPDATE}/${id}/friend`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({friend_id}),
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("========= Error Update User:", error);
    return false;
  }
};

const removeFriend = async (id: any, friend_id: string) => {
  try {
    const response = await fetch(`${API.USER.UPDATE}/${id}/friend`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({friend_id}),
    });
    if (!response.ok) {
      throw new Error(`Failed - Status: ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("========= Error Update User:", error);
    return false;
  }
};

const loginUserEmail = async (email: string, password: string) => {
  try {
    const response = await fetch(API.USER.LOGIN_MANUAL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error(
        `Login failed - Status: ${response.status}`,
        JSON.stringify({ email, password })
      );
      throw new Error(`Đăng nhập thất bại - Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("========= Error Login:", error);
    throw error;
  }
};


const getUserById = async (id: string) => {
  try {
    const response = await fetch(`${API.USER.GET_USER_BY_ID}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Get User Failed - Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("========= Error Get User:", error);
    throw error;
  }
};

export const UserService = {
  getAll,
  updateUser,
  loginUserEmail,
  getUserById,
  changePassword,
  updateUserStatus,
  addFriend,
  searchAllFriends,
  removeFriend,
};
