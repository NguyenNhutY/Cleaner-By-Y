import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
    const [message, setMessage] = useState("");
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState("");

    const handleRunCleaner = async () => {
      try {
          const response = await axios.get("http://localhost:5000/create-and-run-batch");
          alert(response.data.message);
      } catch (error) {
          alert("Lỗi khi chạy script dọn dẹp!");
          console.error(error);
      }
  };

  const clearRecycleBin = () => {
        axios.get("http://localhost:5000/clear-recyclebin")
            .then(response => setMessage(response.data.message))
            .catch(error => setMessage("Lỗi khi xóa thùng rác!"));
    };

    // Lấy danh sách ổ đĩa khi load trang
    useEffect(() => {
        axios.get("http://localhost:5000/list-drives").then((res) => {
            setDrives(res.data.drives);
            if (res.data.drives.length > 0) {
                setSelectedDrive(res.data.drives[0]); // Mặc định chọn ổ đầu tiên
            }
        });
    }, []);

    // Hàm gọi API xóa rác
    const handleClick = async (endpoint) => {
        try {
            const res = await axios.get(`http://localhost:5000/${endpoint}`);
            setMessage(res.data.message);
        } catch (error) {
            setMessage("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    // Hàm dọn ổ đĩa
    const handleCleanDisk = async () => {
        if (!selectedDrive) {
            setMessage("Không có ổ đĩa nào để dọn!");
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/clean-disk/${selectedDrive}`);
            setMessage(res.data.message);
        } catch (error) {
            setMessage("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    return (
        <div className="container">
            <h1>Tool Dọn Rác Máy Tính</h1>
            <button onClick={clearRecycleBin}>🗑️ Dọn Thùng Rác</button>
            <button onClick={() => handleClick("clear-temp")}>Xóa %temp%</button>
            <button onClick={() => handleClick("clear-prefetch")}>Xóa prefetch</button>

            {/* Dropdown chọn ổ đĩa */}
            <div className="disk-cleaner">
                <label>Chọn ổ đĩa:</label>
                <select value={selectedDrive} onChange={(e) => setSelectedDrive(e.target.value)}>
                    {drives.map((drive) => (
                        <option key={drive} value={drive}>{drive}</option>
                    ))}
                </select>
                <button onClick={handleCleanDisk}>Dọn ổ đĩa</button>
            </div>
            <button
                onClick={handleRunCleaner}
                style={{
                    padding: "10px 20px",
                    fontSize: "18px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                Chạy Dọn Dẹp Đặc Biệt
            </button>
            <p>{message}</p>
        </div>
    );
}

export default App;
