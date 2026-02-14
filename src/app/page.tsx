import RoleSelector from "@/components/RoleSelector";

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl text-luxluf-800 tracking-widest mb-2">
          LUXLUF
        </h1>
        <p className="text-luxluf-500 font-serif text-lg mb-12">
          Order Management
        </p>
        <div className="text-left">
          <p className="text-sm text-luxluf-600 mb-4">
            Select your role to continue:
          </p>
          <RoleSelector />
        </div>
      </div>
    </div>
  );
}
