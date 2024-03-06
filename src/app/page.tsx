import { LoginButton } from "@/components/auth/login-button";
import { ModeToggleButton } from "@/components/mode-toggle-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <main className="w-full h-screen flex flex-col space-y-4 justify-center items-center">
      <div className="flex flex-row text-center  gap-2 text-5xl">
        <h1 className="font-semibold   drop-shadow-md">Starter next js app</h1>
        <div className="lg:animate-spin">⚙️</div>
      </div>

      <div className="max-w-6xl text-justify text-lg">
        Starter next js app with authentication sytheme, theme customization,
        multi language support and user account settings
      </div>
      <div className="">
        <LoginButton>
          <Button size={"lg"}>Login</Button>
        </LoginButton>
      </div>
    </main>
  );
}
