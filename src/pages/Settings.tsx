import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Settings are now embedded in the Dashboard under the Settings tab
const Settings = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);
  return null;
};

export default Settings;
