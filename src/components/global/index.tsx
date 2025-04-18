"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { PencilLine, UserRound } from "lucide-react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Calendar } from "lucide-react";
import "swiper/css";
import { HELPER } from "@/utils/helper";
import { ROUTES } from "@/utils/route";
interface ButtonProps {
  name: string;
  icon: string;
  link: string;
  isRound?: boolean;
}


const ProductCard = ({ image, title, price, sold }: any) => (
  <Card className="bg-white h-full rounded-lg overflow-hidden">
    <div className="relative">
      {/* {hot && (
        <div className="absolute top-2 left-2 bg-[rgb(var(--primary-rgb))] text-white px-2 py-1 rounded-md text-sm">
          Bán chạy
        </div>
      )} */}
      <Image
        src={image}
        alt={title}
        className="w-full h-48 lg:h-80 object-cover"
        width={200}
        height={200}
        priority
      />
    </div>
    <div className="flex flex-col justify-between p-4">
      <div className="flex items-center space-x-2">
        <span className="text-xs lg:text-lg font-bold text-black">
          {HELPER.formatVND(price)}
        </span>
      </div>
      <h3 className="text-xs lg:text-lg font-medium text-gray-900 line-clamp-2 mt-2">
        {title}
      </h3>
      <div className="flex items-center mt-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-2">({sold} đã bán)</span>
      </div>
    </div>
  </Card>
);

const ProductCardSmall = ({ image, title, price }: any) => (
  <Card className="bg-white h-full rounded-lg overflow-hidden flex flex-col">
    <div className="relative px-4 pt-4">
      {/* {hot && (
        <div className="absolute top-2 left-2 bg-[rgb(var(--primary-rgb))] text-white px-2 py-1 rounded-md text-sm">
          Bán chạy
        </div>
      )} */}
      <Image
        src={image}
        alt={title}
        className="w-full h-full lg:h-64 object-cover"
        width={200}
        height={200}
        priority
      />
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex-grow">
        <div className="flex items-center space-x-2">
          <span className="line-through text-[12px] lg:text-[14px] font-normal text-black">
            {HELPER.formatVND(HELPER.upPrice(price))}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[17px] lg:text-[20px] font-medium text-black">
            {HELPER.formatVND(price)}
          </span>
        </div>
        <h3 className="text-[13px] lg:text-[16px] font-medium text-gray-900 line-clamp-2">
          {title}
        </h3>
      </div>

      <div className="mt-auto pt-4">
        <span className="text-xs lg:text-base font-medium text-green-500 ">
          Miễn phí vận chuyển
        </span>
      </div>
    </div>
  </Card>
);

const CategoryCard = ({ title, icon }: any) => (
  <div className="bg-white w-28 lg:w-60 flex-1 border border-gray-300 border-dashed rounded-lg p-4 flex flex-col items-center justify-center space-y-4">
    {icon}
    <span className="text-xs lg:text-lg">{title}</span>
  </div>
);

// const StickyMessagingButtons = (
//   const buttons: ButtonProps[] = [
//     {
//       name: 'Zalo',
//       icon: '/zalo.png', // Replace with actual icon path
//       link: 'https://zalo.me/yourusername',
//     },
//     {
//       name: 'Messenger',
//       icon: '/messenger.png', // Replace with actual icon path
//       link: 'https://m.me/yourusername',
//     },
//     {
//       name: 'Facebook',
//       icon: '/facebook.png', // Replace with actual icon path
//       link: 'https://facebook.com/yourusername',
//     },
//     {
//       name: '',
//       icon: '/headphones.png', // Replace with actual icon path
//       link: 'tel:+1234567890',
//       isRound: true,
//     },
//   ];
// ) => (
//   <div className="fixed right-6 top-1/3 z-50 flex flex-col items-center space-y-4">
//       {buttons.map((button, index) => (
//         <a 
//           key={index} 
//           href={button.link}
//           className={`
//             flex items-center justify-between
//             bg-amber-400 text-white font-bold
//             px-4 py-2 rounded-full
//             shadow-md hover:bg-amber-500 transition-colors
//             ${button.isRound ? 'w-16 h-16 justify-center' : 'min-w-40'}
//           `}
//         >
//           {!button.isRound && <span className="mr-2">{button.name}</span>}
//           <div className={`flex items-center justify-center ${button.name === 'Zalo' ? 'bg-white rounded-full p-1' : ''}`}>
//             <Image 
//               src={button.icon} 
//               alt={button.name} 
//               width={button.isRound ? 32 : 24} 
//               height={button.isRound ? 32 : 24}
//             />
//           </div>
//         </a>
//       ))}
//     </div>
// );


export const GlobalComponent = {
  ProductCard,
  ProductCardSmall,
  CategoryCard,
};
