import { useState, useEffect, useRef } from 'react';
import { ChatService } from '@/services/chat';
import { SquareX, UserRoundPlus, UsersRound, X } from 'lucide-react';
import { UserService } from '@/services/user';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CreateChatProps {
  user_id: string;
  onChatCreated: () => void;
}

interface Friend {
  _id: string;
  email: string;
  name: string;
}

export default function CreateChat({ user_id, onChatCreated }: CreateChatProps) {
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [searchText, setSearchText] = useState('');
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  // Fetch friends when dropdown is opened or search text changes
  useEffect(() => {
    if (isDropdownOpen) {
      fetchFriends(searchText);
    }
  }, [searchText, isDropdownOpen]);

  const fetchFriends = async (searchText: string) => {
    try {
      const data = await UserService.searchAllFriends(user_id, searchText);
      setFriendList(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        variant: "destructive",
        title: "Không thể tải danh sách bạn bè",
      });
    }
  };

  const addFriend = async () => {
    if (!friendId.trim()) {
      toast({
        variant: "destructive",
        title: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }
    const members = [user_id, friendId];
    const is_group = false;
    const updateFriend = await UserService.addFriend(user_id, friendId);
    if (!updateFriend) {
      toast({
        variant: "destructive",
        title: "Không thể thêm bạn bè",
      });
      return;
    }
    await ChatService.createChat(user_id, members, is_group);
    onChatCreated();
    setFriendId('');
    setIsFriendModalOpen(false);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) {
      toast({
        variant: "destructive",
        title: "Vui lòng nhập tên nhóm và chọn ít nhất một thành viên",
      });
      return;
    }
    const members = [user_id, ...selectedFriends.map(f => f._id)];
    const is_group = true;
    await ChatService.createChat(user_id, members, is_group, groupName);
    onChatCreated();
    setGroupName('');
    setSelectedFriends([]);
    setSearchText('');
    setIsGroupModalOpen(false);
  };

  const handleFriendSelect = (friend: Friend) => {
    if (!selectedFriends.some(f => f._id === friend._id)) {
      setSelectedFriends([...selectedFriends, friend]);
    }
    setSearchText('');
    setIsDropdownOpen(false);
  };

  const removeFriend = (friendId: string) => {
    setSelectedFriends(selectedFriends.filter(f => f._id !== friendId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && friendList.length > 0) {
      handleFriendSelect(friendList[0]);
    }
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleBlur = () => {
    // Delay hiding the dropdown to allow clicks to register
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div className="">
      <div className="flex gap-2">
        <Dialog open={isFriendModalOpen} onOpenChange={setIsFriendModalOpen}>
          <DialogTrigger asChild>
            <UserRoundPlus className="cursor-pointer h-6 w-6 text-gray-600 hover:text-blue-500 transition-colors" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-800">Add a Friend</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              <Input
                type="text"
                placeholder="Enter Friend ID"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
              />
              <button
                onClick={addFriend}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Friend
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
          <DialogTrigger asChild>
            <UsersRound className="cursor-pointer h-6 w-6 text-gray-600 hover:text-blue-500 transition-colors" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-800">Create a Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-2 max-h-[100px] overflow-y-auto border rounded-lg p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {selectedFriends.map(friend => (
                    <div
                      key={friend._id}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
                    >
                      <span>{friend.email}</span>
                      <X
                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                        onClick={() => removeFriend(friend._id)}
                      />
                    </div>
                  ))}
                  {selectedFriends.length === 0 && (
                    <span className="text-gray-500 pointer-events: none" >Please add member</span>
                  )}
                </div>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter Friend Email"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                />
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[120px] overflow-y-auto">
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
                      <div className="px-4 py-2 text-gray-500">No friends found</div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={createGroup}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Group
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}