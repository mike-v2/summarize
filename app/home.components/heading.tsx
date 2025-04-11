import AuthStatus from "@/components/authStatus";

export default function Heading() {
  return (
    <div className="items-center justify-between font-mono lg:flex mb-8">
      <h1 className="text-2xl font-bold mb-4 lg:mb-0 text-center lg:text-left w-full">
        Video Summarizer
      </h1>
      <div className="text-right text-sm">
        <AuthStatus />
      </div>
    </div>
  );
}
