"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut } from "lucide-react";
import NavItems from "./NavItems";
import { signOut } from "@/lib/actions/auth.actions";

const UserDropdown = ({
  initialStocks,
  user,
}: {
  initialStocks: StockWithWatchlistStatus[];
  user: User;
}) => {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex items-center gap-3 text-gray-400 hover:text-yellow-500 data-popup-open:bg-transparent"
          >
            <Avatar>
              <AvatarImage src="https://github.com/joevandyta.png" />
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-base font-medium ">{user.name}</span>
            </div>
          </Button>
        }
      />
      <DropdownMenuContent sideOffset={8} className=" text-gray-400 w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex relative items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/joevandyta.png" />
                <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col ">
                <span className="text-base font-medium ">{user.name}</span>
                <span className="text-sm text-gray-400 ">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="sm:hidden bg-gray-600" />
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks} />
        </nav>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
