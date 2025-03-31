"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserService } from "@/services/user";
import { ROUTES } from "@/utils/route";
import Cookies from "js-cookie";
import { User } from "lucide-react";

import Image from "next/image";
import { useState } from "react";


export default function LoginClient () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logined, setLogined] = useState(false);

  const validateForm = () => {
    if (email === "" || password === "") {
      toast({
        variant: "destructive",
        title: "Vui lòng điền đầy đủ thông tin",
      });
      return false;
    } else {
      return true;
    }
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      let data;
      data = await UserService.loginUserEmail(email, password);
      if (data) {
        Cookies.set("isLogin", data.user_id, { expires: 7 });
        // Cookies.set("userLogin", data, { expires: 7 });
        setLogined(true);
        await UserService.updateUserStatus( data.user_id);
        window.location.href = ROUTES.HOME;
      } else {
        throw new Error("Email hoặc mật khẩu chưa chính xác");
      }
    } catch (error) {
      console.error("========= Error Login:", error);
      toast({
        variant: "destructive",
        title: "Email hoặc mật khẩu chưa chính xác",
      });
    }
  }
  return (
    <div className="flex w-full h-screen bg-indigo-700">
      <div className="w-full max-w-xs m-auto bg-indigo-100 rounded p-5">
        <header>
          <Image 
          className="w-20 mx-auto mb-5" 
          src="https://img.icons8.com/fluent/344/year-of-tiger.png" alt={""} 
          width={100}
          height={100}
          />
        </header>
        <div>
          <div>
            <Label className="block mb-2 text-indigo-500" htmlFor="username">Username</Label>
            <Input 
            className="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300" 
            type="text" name="username" 
            onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="block mb-2 text-indigo-500" htmlFor="password">Password</Label>
            <Input 
            className="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300" 
            type="password" name="password" 
            onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Input 
            className="w-full bg-indigo-700 hover:bg-pink-700 text-white font-bold py-2 px-4 mb-6 rounded cursor-pointer" 
            type="submit" 
            onClick={handleSubmit}
            />
          </div>
        </div>
        <footer>
          <a className="text-indigo-700 hover:text-pink-700 text-sm float-left" href="#">Forgot Password?</a>
          <a className="text-indigo-700 hover:text-pink-700 text-sm float-right" href="#">Create Account</a>
        </footer>
      </div>
    </div>
  );
}
