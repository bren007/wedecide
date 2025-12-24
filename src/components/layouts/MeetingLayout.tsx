import { Outlet } from "react-router-dom";
import "./MeetingLayout.css";

export function MeetingLayout() {
    return (
        <div className="meeting-layout">
            <div className="meeting-layout-content">
                <div className="meeting-layout-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
