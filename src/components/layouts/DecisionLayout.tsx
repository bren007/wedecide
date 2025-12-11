import { Outlet } from "react-router-dom";

export function DecisionLayout() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
