import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ChatService } from '@/services/chat';
import { UserService } from '@/services/user';
import { io, Socket } from 'socket.io-client';
import socket from '@/utils/socket';
import { Copy, EllipsisVertical } from 'lucide-react';

interface Chat {
    _id: string;
    is_group: boolean;
    members: string[];
    groupName?: string;
}

interface ChatListProps {
    user_id: string;
    onSelectChat: (chat: Chat) => void;
}

export default function ChatList({ user_id, onSelectChat }: ChatListProps) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [friendNames, setFriendNames] = useState<Record<string, string>>({});
    const socketRef = useRef<Socket | null>(null);

    const fetchUserChats = async (user_id: string) => {
        try {
            const data = await ChatService.getUserChats(user_id);
            setChats(data ?? []);

            const friendIds = data
                .filter((chat: Chat) => !chat.is_group)
                .map((chat: Chat) => chat.members.find((p) => p !== user_id))
                .filter(Boolean) as string[];

            // Fetch names of all friends
            const friendData = await Promise.all(
                friendIds.map(async (friendId) => {
                    const userData = await UserService.getUserById(friendId);
                    return { [friendId]: userData?.name || "Unknown User" };
                })
            );

            // Convert array to object
            setFriendNames(Object.assign({}, ...friendData));
        } catch (error) {
            console.error("Error fetching chat:", error);
        }
    };

    const fetchFriendName = async (friendId: string) => {
        try {
            const userData = await UserService.getUserById(friendId);
            setFriendNames((prev) => ({
                ...prev,
                [friendId]: userData?.name || "Unknown User",
            }));
        } catch (error) {
            console.error("Error fetching friend name:", error);
        }
    };
    useEffect(() => {
        fetchUserChats(user_id);

        // Setup Socket.IO connection
        socketRef.current = socket;
        // Subscribe to user
        socket.emit('subscribeToUser', user_id);

        socket.on('chatCreated', (chat: Chat) => {
            setChats(prev => {
                // Check if the chat already exists
                const chatExists = prev.some(existingChat => existingChat._id === chat._id);
                
                if (chatExists) {
                    // Filter out the existing chat and add the new one
                    return [...prev.filter(existingChat => existingChat._id !== chat._id), chat];
                } else {
                    if (!chat.is_group) {
                        // Fetch friend name for one-to-one chat
                        const friendId = chat.members.find((p) => p !== user_id);
                        if (friendId && !friendNames[friendId]) {
                            fetchFriendName(friendId);
                        }
                    }
                    return [...prev, chat];
                }
            });
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });


        // Cleanup
        return () => {
            socket.off('chatCreated');
            socket.off('connect');
            socket.off('connect_error');
        };
    }, [friendNames, user_id]);

    const groupChats = chats.filter((chat) => chat.is_group === true);
    const friendChats = chats.filter((chat) => chat.is_group === false);


    return (
        <div className="w-full bg-gray-100 p-4 overflow-y-auto h-fit">
            {/* Friends Section */}
            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2 text-gray-800">Friends</h2>
                {friendChats.length === 0 ? (
                    <p className="text-gray-500">No one-to-one chats yet</p>
                ) : (
                    friendChats.map((chat) => {
                        const friendId = chat.members.find((p) => p !== user_id);
                        const friendName = friendNames[friendId!] || "Loading...";
                        return (
                            <div
                                key={chat._id}
                                onClick={() => onSelectChat(chat)}
                                className="p-3 mb-2 bg-white rounded-lg cursor-pointer hover:bg-gray-200 transition-colors gap-4 "
                            >
                                <span className="font-medium">{friendName}</span>
                                <span className="block text-sm text-gray-500"></span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Groups Section */}
            <div>
                <h2 className="text-lg font-bold mb-2 text-gray-800">Groups</h2>
                {groupChats.length === 0 ? (
                    <p className="text-gray-500">No group chats yet</p>
                ) : (
                    groupChats.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => onSelectChat(chat)}
                            className="p-3 mb-2 bg-white rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            <span className="font-medium">{chat.groupName}</span>
                            <span className="block text-sm text-gray-500"></span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}