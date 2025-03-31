"use client";
import { use, useEffect, useState } from 'react';
import CreateChat from './components/createChat';
import ChatList from './components/chatList';
import Chat from './components/chat';
import Cookies from "js-cookie";
import { UserService } from '@/services/user';
import Image from 'next/image';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/dropdown';
import { Copy, LogOut } from 'lucide-react';
import { ROUTES } from '@/utils/route';
import { Button } from '@/components/ui/button';
import { API } from '@/utils/api';
import { io } from 'socket.io-client';


interface user {
  _id: string;
  name: string;
  email: string;
  isOnline: boolean;
  friend_ids: string[];
}

export default function MainClient() {
  const [user, setUser] =
    useState<user | null>(null);
  const [logined, setLogined] = useState(false);
  const isLogin = Cookies.get("isLogin");
  const [copied, setCopied] = useState(false);
  const [selectedchat_id, setSelectedchat_id] = useState<string | null>(null);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [refreshChats, setRefreshChats] = useState(false);
  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };
  const handleChatCreated = () => setRefreshChats(!refreshChats);
  const handleLogOut = async () => {
    Cookies.remove("isLogin");
    setLogined(false);
    await UserService.updateUserStatus(user?._id);
    socket?.disconnect();
    window.location.href = ROUTES.LOGIN;
  };
  // Initialize Socket.IO connection
  useEffect(() => {
    if (isLogin) {
    const fetchAccount = async () => {
        try {
          const data = await UserService.getUserById(isLogin);
          setLogined(true);
          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            isOnline: data.isOnline,
            friend_ids: data.friend_ids,
          });
        } catch (error) {
          console.error("Error fetching account:", error);
        }
      }
      fetchAccount();
    }
    else{
      window.location.href = ROUTES.LOGIN;
    }
  }, [isLogin, socket]);
  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Left Side: 1/4 Chat List */}
      <div className="w-1/4 h-screen flex flex-col items-stretch border-r bg-gray-100">
        <div className='flex justify-between items-center border-b p-4'>
          <div className='gap-2 justify-normal flex items-center'>
            <div className="relative">
              <Image
                src={"https://www.w3schools.com/w3images/avatar2.png"}
                alt="avatar"
                width={1000}
                height={1000}
                className="w-10 h-10 object-cover rounded-full cursor-pointer"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500 
                  `}
              />
            </div>
            <div className="flex flex-col">
              <span>{user?.name}</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500">{user?._id}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={copied ? "Copied!" : "Copy ID"}
                >
                  <Copy size={14} className={copied ? "text-green-500" : "text-gray-500"} />
                </button>
              </div>
            </div>
          </div>
          <div className="">
            <CreateChat user_id={user?._id || ''} onChatCreated={handleChatCreated} />
          </div>
        </div>

        {user ? (
          <ChatList user_id={user._id} onSelectChat={(chat) => setSelectedchat_id(chat._id)} />
        ) : (
          <p>Loading chats...</p>
        )}
        <div
          onClick={handleLogOut}
          className="
          flex items-center justify-start gap-4 text-[rgb(var(--primary-rgb))] 
          hover:text-white hover:bg-[rgb(var(--primary-rgb))] font-medium text-md px-3 py-3 
          bottom-4 left-2 absolute cursor-pointer bg-white shadow-md
          ">
          <LogOut size={18} />
          <p>Đăng xuất</p>
        </div>
      </div>

      {/* Right Side: 3/4 Chat Box */}
      <div className="w-3/4">
        {selectedchat_id ? (
          <Chat chat_id={selectedchat_id} user_id={user?._id || ''} />
        ) : (
          <div className="flex items-center justify-center h-screen bg-gray-50">
            <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}