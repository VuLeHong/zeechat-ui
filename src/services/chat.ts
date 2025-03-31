import { API } from "@/utils/api";

const createChat = async (user_id:string, members: string[], is_group: boolean, groupName?: string) => {
  try {
    if (!groupName) {
      groupName = "";
    }
    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${user_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        members,
        is_group,
        groupName
      })
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

const uploadFile = async (chat_id: string, sender_id: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("sender_id", sender_id); // Append sender_id as a field
    formData.append("file", file); // Append the file object

    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}/upload-file`, {
      method: "POST",
      body: formData, // No need to set Content-Type; browser handles it
    });

    if (!response.ok) {
      throw new Error(`File Upload Failed - Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("========= Error Uploading File:", error);
    throw error;
  }
};

const uploadImage = async (chat_id: string, sender_id: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("sender_id", sender_id); // Append sender_id as a field
    formData.append("file", file); // Append the file object

    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}/upload-image`, {
      method: "POST",
      body: formData, // No need to set Content-Type; browser handles it
    });

    if (!response.ok) {
      throw new Error(`File Upload Failed - Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("========= Error Uploading File:", error);
    throw error;
  }
};

const deleteChat = async (chat_id: string) => {
  try {
    const response = await fetch(`${API.CHAT.GET_ALL_CHAT_MESSAGES}/${chat_id}`, {
      method: "DELETE",
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

const getChatMessages = async (chat_id: string, pageNum:number, limit:number) => {
  try {
    const response = await fetch(`${API.CHAT.GET_ALL_CHAT_MESSAGES}/${chat_id}/messages?page=${pageNum}&limit=${limit}`, {
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

const setStrict = async (chat_id: string) => {
  try {
    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}`, {
      method: "PATCH",
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

const updateGroupName = async (chat_id: string, newGroupName:string) => {
  try {
    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}/update-name`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newGroupName
      })
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

const addMember = async (chat_id: string, member_id:string) => {
  try {
    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}/add-member?memberId=${member_id}`, {
      method: "POST",
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

const removeMember = async (chat_id: string, member_id:string) => {
  try {
    const response = await fetch(`${API.CHAT.CREATE_CHAT}/${chat_id}/remove-member?memberId=${member_id}`, {
      method: "POST",
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

const getUserChats = async (user_id: string) => {
  try {
    const response = await fetch(`${API.CHAT.GET_ALL_CHAT}/${user_id}`, {
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

const getChatById = async (chat_id: string) => {
  try {
    const response = await fetch(`${API.CHAT.GET_CHAT_BY_ID}/${chat_id}`, {
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

export const ChatService = {
  createChat,
  getChatMessages,
  getUserChats,
  getChatById,
  setStrict,
  addMember,
  removeMember,
  updateGroupName,
  uploadFile,
  uploadImage,
  deleteChat
};
