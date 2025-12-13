import { Outlet } from "react-router-dom";
import "./DecisionLayout.css";

export function DecisionLayout() {
    return (
        <div className="decision-layout">
            <div className="decision-layout-content">
                <div className="decision-layout-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
