import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { ChatService } from '@/services/chat';
import { Input } from '@/components/ui/input';
import { UserService } from '@/services/user';
import { CirclePlus, ImagePlus, Paperclip, PenLine, SendHorizontal, Settings, SquareX, File, ArrowDownToLine, X, DoorOpen, Crown, LogOut, SquareUserRound, User } from 'lucide-react';
import Image from 'next/image';
import { useInView } from "react-intersection-observer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@radix-ui/react-label';
import { Switch } from '@/components/ui/switch';
import socket from '@/utils/socket';
import { toast } from '@/hooks/use-toast';

interface Message {
    _id: string;
    sender_id: string;
    content: string;
    deleted_at: Date | null;
    created_at: Date;
    type?: 'normal' | 'noti' | 'file' | 'image';
}

interface Chat {
    _id: string;
    owner_id: string;
    is_group: boolean;
    members: string[];
    groupName?: string;
    is_strict: boolean;
}

interface Friend {
    _id: string;
    email: string;
    name: string;
}

export default function Chat({ chat_id, user_id }: { chat_id: string; user_id: string }) {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState<Friend | null>(null);
    const [friendList, setFriendList] = useState<Friend[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStrict, setIsStrict] = useState(false);
    const [friendNames, setFriendNames] = useState<Record<string, string>>({});
    const [ownerName, setOwnerName] = useState<string>('');
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const memberInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { ref, inView } = useInView();
    const [isLoading, setIsLoading] = useState(false);
    const [totalMessage, setTotalMessage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalPage, setTotalPage] = useState(0);
    const [page, setPage] = useState(1);

    const fetchChat = async (chat_id: string) => {
        try {
            const data = await ChatService.getChatById(chat_id);
            setChat(data ?? null);
            fetchFriendNames(data?.members || []);
            setIsStrict(data?.is_strict || false);
            const ownerData = await UserService.getUserById(data?.owner_id || '');
            setOwnerName(ownerData?.name || 'Unknown User');
            setNewGroupName(data?.groupName || '');
        } catch (error) {
            console.error("Error fetching chat:", error);
        }
    };
    const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const updateGroupName = async () => {
        if (!newGroupName.trim() || newGroupName === chat?.groupName) {
            setIsEditingGroupName(false);
            return;
        }
        try {
            await ChatService.updateGroupName(chat_id, newGroupName);
            socket.emit('sendNotiUpdateGroupName', { chat_id, sender_id: user_id, groupName: newGroupName });
            setIsEditingGroupName(false);
        } catch (error) {
            console.error("Error updating group name:", error);
        }
    };

    const fetchFriendNames = async (members: string[]) => {
        try {
            const friendIds = members.filter((id) => id !== user_id);
            const friendData = await Promise.all(
                friendIds.map(async (friendId) => {
                    const userData = await UserService.getUserById(friendId);
                    return { [friendId]: userData?.name || "Unknown User" };
                })
            );
            setFriendNames(Object.assign({}, ...friendData));
        } catch (error) {
            console.error("Error fetching friend names:", error);
        }
    };

    const fetchMessage = async () => {
        try {
            // setLoading(true);
            const data = await ChatService.getChatMessages(chat_id, 1, 20);
            setTotalMessage(data.total);
            setTotalPage(data.totalPages);
            setMessages(data.messages ?? []);
            setPage(1);
            if (page === data.totalPages) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const fetchFriends = async (searchText: string) => {
        try {
            const data = await UserService.searchAllFriends(user_id, searchText);
            const availableFriends = (data || []).filter((friend: { _id: string; }) => !chat?.members.includes(friend._id));
            setFriendList(availableFriends);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };
    const loadMoreMessages = async (page: number, limit: number) => {
        const scrollContainer = document.querySelector('.overflow-y-auto');
        const previousHeight = scrollContainer?.scrollHeight || 0;

        await delay(2000);
        const data = await ChatService.getChatMessages(chat_id, page + 1, limit);
        if (data) {
            setMessages((prev: Message[]) => [...data.messages, ...prev]);
            setPage(page + 1);
            setIsLoading(false);
        }


        requestAnimationFrame(() => {
            if (scrollContainer) {
                const newHeight = scrollContainer.scrollHeight;
                scrollContainer.scrollTop = newHeight - previousHeight;
            }
        });
    };

    const handleScroll = async (e: React.UIEvent<HTMLDivElement, UIEvent>) => {

        let element = e.target as HTMLDivElement;
        if (element.scrollTop === 0) {
            if (page < totalPage && !isLoading) {
                setIsLoading(true);
                loadMoreMessages(page, 20);
            }
            else {
                setHasMore(false);
            }
        }

    };

    useEffect(() => {
        if (!chat_id) return;

        fetchChat(chat_id);
        fetchMessage();
        setHasMore(true);
        setIsLoading(false);
        socket.emit('joinChat', chat_id);

        const handleNewMessage = (newMessage: Message) => {
            if (newMessage.type === 'noti') {
                fetchChat(chat_id);
            }
            setMessages((prev) => {
                if (prev.some((msg) => msg._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        };

        const handleTyping = ({ sender_id }: { sender_id: string }) => {
            if (sender_id !== user_id) {
                setTypingUsers((prev) => {
                    const newSet = new Set(prev);
                    if (!chat?.is_group) {
                        const otherMember = chat?.members.find((id) => id !== user_id);
                        if (sender_id === otherMember) {
                            newSet.clear();
                            newSet.add(sender_id);
                        }
                    } else {
                        newSet.add(sender_id);
                    }
                    return newSet;
                });
            }
        };

        const handleStopTyping = ({ sender_id }: { sender_id: string }) => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(sender_id);
                return newSet;
            });
        };

        const handleChatUpdated = (updatedChat: Chat) => {
            if (updatedChat) {
                if (updatedChat._id === chat_id) {
                    setChat(updatedChat);
                    setNewGroupName(updatedChat.groupName || '');
                }
            } else {
                setChat(null);
            }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);
        socket.on('chatUpdated', handleChatUpdated);
        socket.on('adjustStrict', ({ is_strict }: { is_strict: boolean }) => setIsStrict(is_strict));
        socket.on('error', (error: string) => console.error("Socket error:", error));

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }, 100);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
            socket.off('error');
            socket.off('adjustStrict');
            socket.emit('leaveChat', chat_id);
        };
    }, [chat_id, user_id, chat?.is_group]);

    useEffect(() => {
        if (isDropdownOpen) {
            fetchFriends(memberSearch);
        }
    }, [memberSearch, isDropdownOpen]);

    const sendMessage = async () => {
        if (message.trim()) {
            socket.emit('sendMessage', { chat_id, sender_id: user_id, content: message });
            setMessage('');
            socket.emit('stopTyping', { chat_id, sender_id: user_id });
        }
    };

    const emitTyping = () => socket.emit('typing', { chat_id, sender_id: user_id });
    const emitStopTyping = () => socket.emit('stopTyping', { chat_id, sender_id: user_id });

    const handleFileUploadClick = () => fileInputRef.current?.click();
    const handleImageUploadClick = () => imageInputRef.current?.click();

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast({ title: 'Error', description: 'No file selected.' });
            return;
        }

        const allowedFileTypes = [
            'application/pdf',                                              // PDFs
            'application/msword',                                          // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/json',                                            // JSON files
            'application/xml',                                            // XML files
            'text/xml',                                                  // Alternative XML MIME type
            'application/zip',                                           // ZIP archives
            'text/csv',                                                 // CSV files
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel'                                  // .xls
        ];

        if (!allowedFileTypes.includes(file.type)) {
            toast({ title: 'Error', description: 'Invalid file type. Please upload a valid file.' });
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: 'Error',
                description: 'File too large. Maximum size is 10MB.'
            });
            event.target.value = '';
            return;
        }

        try {
            await ChatService.uploadFile(chat_id, user_id, file);
        } catch (error) {
            toast({ title: 'Error', description: 'Upload failed. Please try again.' });
            console.error('File upload error:', error);
        } finally {
            event.target.value = '';
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast({ title: 'Error', description: 'No image selected.' });
            return;
        }

        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedImageTypes.includes(file.type)) {
            toast({ title: 'Error', description: 'Invalid image type. Please upload JPEG, PNG, or GIF.' });
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: 'Error',
                description: 'Image too large. Maximum size is 10MB.'
            });
            event.target.value = '';
            return;
        }

        try {
            await ChatService.uploadImage(chat_id, user_id, file);
        } catch (error) {
            toast({ title: 'Error', description: 'Image upload failed. Please try again.' });
            console.error('Image upload error:', error);
        } finally {
            event.target.value = '';
        }
    };

    const addMember = async () => {
        if (!selectedMember) return;
        await ChatService.addMember(chat_id, selectedMember._id);
        socket.emit('sendNotiAdjustMember', { chat_id, sender_id: chat?.owner_id, member_id: selectedMember._id, isAdd: true });
        setSelectedMember(null);
        setMemberSearch('');
        setIsDropdownOpen(false);
    };

    const removeMember = async (member_id: string) => {
        await ChatService.removeMember(chat_id, member_id);
        socket.emit('sendNotiAdjustMember', { chat_id, sender_id: chat?.owner_id, member_id: member_id, isAdd: false });
    };

    const handleDeleteGroup = async () => {
        await ChatService.deleteChat(chat_id);
        setIsDialogOpen(false);
    };

    const handleLeaveGroup = async () => {
        await ChatService.removeMember(chat_id, user_id);
        socket.emit('sendNotiAdjustMember', { chat_id, sender_id: chat?.owner_id, member_id: user_id, isAdd: false });
        setIsDialogOpen(false);
    };

    const handleRemoveContact = async () => {
        const otherMember = chat?.members.find((id) => id !== user_id);
        if (otherMember) {
            await UserService.removeFriend(user_id, otherMember);
            await ChatService.deleteChat(chat_id);
            setIsDialogOpen(false);
        }
    };

    const handleStrictModeChange = async () => socket.emit('adjustStrict', chat_id);

    const handleFriendSelect = (friend: Friend) => {
        setSelectedMember(friend);
        setMemberSearch('');
        setIsDropdownOpen(false);
        addMember();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && friendList.length > 0) {
            handleFriendSelect(friendList[0]);
        }
    };

    const handleFocus = () => setIsDropdownOpen(true);
    const handleBlur = () => setTimeout(() => setIsDropdownOpen(false), 200);

    const typingUsersArray = Array.from(typingUsers);
    let typingText = '';

    if (!chat) {
        return <div className="flex items-center justify-center h-screen text-gray-500">Loading chat or chat not found...</div>;
    }

    if (typingUsersArray.length > 0) {
        if (chat.is_group) {
            typingText = typingUsersArray.length === 1
                ? `${friendNames[typingUsersArray[0]] || 'Someone'} is typing...`
                : 'Multiple people are typing...';
        } else {
            const otherMember = chat.members.find((id) => id !== user_id);
            if (typingUsersArray.includes(otherMember!)) {
                typingText = `${friendNames[otherMember!] || 'Someone'} is typing...`;
            }
        }
    }

    if (!chat.members.includes(user_id)) {
        return <div className="flex items-center justify-center h-screen text-gray-500">You are not a member of this chat.</div>;
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Fixed Header */}
            <div className="h-20 p-4 bg-blue-300 text-white shadow-md flex justify-between items-center border-b flex-shrink-0">
                <h2 className="text-lg font-semibold">
                    {chat.is_group ? chat.groupName : friendNames[chat.members.find((p) => p !== user_id) || '']}
                </h2>
                {chat.is_group && chat.owner_id !== user_id && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Settings className="h-11 w-11 cursor-pointer p-2 hover:bg-gray-100 rounded-full" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] p-6">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <div>{chat.groupName}</div>
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500">
                                    <span>Created by {ownerName}</span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col items-start gap-3">
                                    <Label htmlFor="member" className="text-right font-medium text-gray-700 flex justify-between gap-3">
                                        <span>{`${chat.members.length} Members`}</span>
                                    </Label>
                                    <div className="gap-3 space-y-2 w-full">
                                        <div className="relative flex items-center gap-2">
                                            {selectedMember ? (
                                                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                                    <span>{selectedMember.email}</span>
                                                    <X
                                                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                                                        onClick={() => setSelectedMember(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <Input
                                                    ref={memberInputRef}
                                                    type="text"
                                                    placeholder="Search friends..."
                                                    value={memberSearch}
                                                    onChange={(e) => setMemberSearch(e.target.value)}
                                                    onFocus={handleFocus}
                                                    onBlur={handleBlur}
                                                    onKeyDown={handleKeyDown}
                                                    className="p-2 bg-gray-50 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors border w-full"
                                                />
                                            )}
                                            <CirclePlus className="h-8 w-8 cursor-pointer" onClick={addMember} />
                                            {isDropdownOpen && (
                                                <div className="absolute z-10 w-full mt-10 bg-white border rounded-lg shadow-lg max-h-[120px] overflow-y-auto">
                                                    {friendList.length > 0 ? (
                                                        friendList.map(friend => (
                                                            <div
                                                                key={friend._id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleFriendSelect(friend)}
                                                            >
                                                                {friend.email} {friend.name && `(${friend.name})`}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500">No friends available</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {chat.members.map((member) => (
                                            <div key={member} className="flex items-center gap-2">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors border w-full">
                                                    {member} - {friendNames[member] ? friendNames[member] : 'You'}
                                                </div>
                                                {member !== user_id && member !== chat.owner_id && (
                                                    <SquareX
                                                        className="text-red-500 h-8 w-8 cursor-pointer"
                                                        onClick={() => removeMember(member)}
                                                    />
                                                )}
                                                {member === chat.owner_id && (
                                                    <Crown className="text-yellow-500 h-8 w-8" />
                                                )}
                                                {member === user_id && (
                                                    <SquareUserRound className="text-blue-600 h-8 w-8" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-4 hover:text-red-500 cursor-pointer font-semibold" onClick={handleLeaveGroup}>
                                        Leave Group
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                {chat.is_group && chat.owner_id === user_id && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Settings className="h-11 w-11 cursor-pointer p-2 hover:bg-gray-100 rounded-full" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] p-6">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    {isEditingGroupName ? (
                                        <div className="flex items-center w-4/5 gap-2">
                                            <Input
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                placeholder={chat.groupName}
                                                className="p-2 bg-gray-50 rounded-lg text-gray-800 transition-colors border"
                                                onKeyDown={(e) => e.key === "Enter" && updateGroupName()}
                                                autoFocus
                                            />
                                            <PenLine
                                                className="h-5 w-5 cursor-pointer hover:text-gray-600"
                                                onClick={() => setIsEditingGroupName(false)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>{chat.groupName}</div>
                                            <PenLine
                                                className="h-5 w-5 cursor-pointer hover:text-gray-600"
                                                onClick={() => setIsEditingGroupName(true)}
                                            />
                                        </>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500">
                                    <span>Created by {ownerName}</span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="strictmode" className="text-right font-medium text-gray-700">
                                        Set Strict
                                    </Label>
                                    <Switch
                                        id="strictmode"
                                        checked={isStrict}
                                        onCheckedChange={handleStrictModeChange}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="flex flex-col items-start gap-3">
                                    <Label htmlFor="member" className="text-right font-medium text-gray-700 flex justify-between gap-3">
                                        <span>{`${chat.members.length} Members`}</span>
                                    </Label>
                                    <div className="gap-3 space-y-2 w-full">
                                        <div className="relative flex items-center gap-2">
                                            {selectedMember ? (
                                                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                                    <span>{selectedMember.email}</span>
                                                    <X
                                                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                                                        onClick={() => setSelectedMember(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <Input
                                                    ref={memberInputRef}
                                                    type="text"
                                                    placeholder="Search friends..."
                                                    value={memberSearch}
                                                    onChange={(e) => setMemberSearch(e.target.value)}
                                                    onFocus={handleFocus}
                                                    onBlur={handleBlur}
                                                    onKeyDown={handleKeyDown}
                                                    className="p-2 bg-gray-50 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors border w-full"
                                                />
                                            )}
                                            <CirclePlus className="h-8 w-8 cursor-pointer" onClick={addMember} />
                                            {isDropdownOpen && (
                                                <div className="absolute z-10 mt-10 bg-white border rounded-lg shadow-lg max-h-[120px] overflow-y-auto">
                                                    {friendList.length > 0 ? (
                                                        friendList.map(friend => (
                                                            <div
                                                                key={friend._id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleFriendSelect(friend)}
                                                            >
                                                                {friend.email} {friend.name && `(${friend.name})`}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500">No friends available</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {chat.members.map((member, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors border w-full">
                                                    {member} - {friendNames[member] ? friendNames[member] : 'You'}
                                                </div>
                                                {member !== user_id && member !== chat.owner_id && (
                                                    <SquareX
                                                        className="text-red-500 h-8 w-8 cursor-pointer"
                                                        onClick={() => removeMember(member)}
                                                    />
                                                )}
                                                {member === chat.owner_id && (
                                                    <Crown className="text-yellow-500 h-8 w-8" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-4 hover:text-red-500 cursor-pointer font-semibold" onClick={handleDeleteGroup}>
                                        Delete Group
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                {!chat.is_group && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Settings className="h-11 w-11 cursor-pointer p-2 hover:bg-gray-100 rounded-full" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] p-6">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">
                                    {friendNames[chat.members.find((p) => p !== user_id) || '']}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500">
                                    Chat Settings
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between">
                                    <div
                                        className="flex items-center gap-4 hover:text-red-500 cursor-pointer font-semibold"
                                        onClick={handleRemoveContact}
                                    >
                                        Remove this contact
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" onScroll={(e) => { handleScroll(e); }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div>No messages yet</div>
                        {isStrict === false && typingUsers.size > 0 && (
                            <div className="text-sm italic">{typingText}</div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {hasMore ? (
                            <div ref={ref} className="text-center text-gray-500">
                                {isLoading &&
                                    (<div >
                                        <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                    </div>)}
                            </div>
                        ) : (
                            <div className='border-t-2 border-gray-300 py-4'></div>
                        )
                        }
                        {messages.map((msg) => {
                            switch (msg.type) {
                                case 'noti':
                                    return (
                                        <div key={msg._id} className="text-center text-gray-500">
                                            {msg.content}
                                        </div>
                                    );
                                case 'file':
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`mb-3 flex gap-3 ${msg.sender_id === user_id ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <Image
                                                src="https://www.w3schools.com/w3images/avatar2.png"
                                                alt="avatar"
                                                width={1000}
                                                height={1000}
                                                className="w-8 h-8 object-cover rounded-full cursor-pointer"
                                            />
                                            <div className={msg.sender_id === user_id ? 'text-right' : 'text-left'}>
                                                <p className="text-sm text-gray-500">
                                                    {msg.sender_id === user_id ? 'You' : friendNames[msg.sender_id] || 'Unknown'}
                                                </p>
                                                <a
                                                    href={msg.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-block p-3 rounded-lg shadow-sm no-underline ${msg.sender_id === user_id ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <File className="inline h-5 w-5" />
                                                        <span className="underline">
                                                            {msg.content.split('/').pop() || 'Unnamed File'}
                                                        </span>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                case 'image':
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`mb-3 flex gap-3 ${msg.sender_id === user_id ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <Image
                                                src="https://www.w3schools.com/w3images/avatar2.png"
                                                alt="avatar"
                                                width={1000}
                                                height={1000}
                                                className="w-8 h-8 object-cover rounded-full cursor-pointer"
                                            />
                                            <div className={msg.sender_id === user_id ? 'text-right' : 'text-left'}>
                                                <p className="text-sm text-gray-500">
                                                    {msg.sender_id === user_id ? 'You' : friendNames[msg.sender_id] || 'Unknown'}
                                                </p>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <span className="inline-block rounded-lg border-2 border-blue-400 cursor-pointer">
                                                            <Image
                                                                src={msg.content}
                                                                alt="Uploaded image"
                                                                width={200}
                                                                height={200}
                                                                className="object-cover rounded-lg w-full h-full"
                                                            />
                                                        </span>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[33vw] p-0 border-none bg-transparent ">
                                                        <Image
                                                            src={msg.content}
                                                            alt="Enlarged image"
                                                            width={0}
                                                            height={0}
                                                            sizes="33vw"
                                                            className="w-full h-auto object-contain rounded-lg"
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    );
                                default:
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`mb-3 flex gap-3 ${msg.sender_id === user_id ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <Image
                                                src="https://www.w3schools.com/w3images/avatar2.png"
                                                alt="avatar"
                                                width={1000}
                                                height={1000}
                                                className="w-8 h-8 object-cover rounded-full cursor-pointer"
                                            />
                                            <div className={msg.sender_id === user_id ? 'text-right' : 'text-left'}>
                                                <p className="text-sm text-gray-500">
                                                    {msg.sender_id === user_id ? 'You' : friendNames[msg.sender_id] || 'Unknown'}
                                                </p>
                                                <span
                                                    className={`inline-block p-3 rounded-lg shadow-sm ${msg.sender_id === user_id ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
                                                >
                                                    {msg.content}
                                                </span>
                                            </div>
                                        </div>
                                    );
                            }
                        })}
                        {isStrict === false && typingUsers.size > 0 && (
                            <div className="text-gray-500 text-sm italic">{typingText}</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Fixed Input Section */}
            <div className="p-4 bg-white border-t shadow-inner flex-shrink-0">
                {chat.is_group && isStrict === true && chat.owner_id !== user_id ? (
                    <div className="text-center">
                        <span>Strict mode is enabled. You cannot send messages to this group.</span>
                    </div>
                ) : (
                    <div className="flex justify-between items-center gap-4">
                        <Paperclip className="cursor-pointer h-10 w-6" onClick={handleFileUploadClick} />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <ImagePlus className="cursor-pointer h-10 w-6" onClick={handleImageUploadClick} />
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
                        <Input
                            type="text"
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (e.target.value.length > 0) emitTyping();
                                else emitStopTyping();
                            }}
                            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <SendHorizontal onClick={sendMessage} className="cursor-pointer h-11 w-8" />
                    </div>
                )}
            </div>
        </div>
    );
}