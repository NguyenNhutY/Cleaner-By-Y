const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 5000; // Server chạy trên cổng 3001

app.use(cors());
app.use(express.json());

// Hàm xóa thư mục
const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            try {
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath); // Xóa thư mục con
                } else {
                    fs.unlinkSync(curPath); // Xóa file
                }
            } catch (err) {
                console.warn(`❌ Không thể xóa: ${curPath} - ${err.message}`);
            }
        });
    }
};

// Xóa rác trong %temp%
app.get("/clear-temp", (req, res) => {
    const tempPath = path.join(process.env.TEMP || "C:\\Windows\\Temp");
    deleteFolderRecursive(tempPath);
    res.json({ message: "Đã dọn dẹp %temp%" });
});
app.get("/clear-prefetch", (req, res) => {
    const prefetchPath = "C:\\Windows\\Prefetch";
    deleteFolderRecursive(prefetchPath);
    res.json({ message: "Đã xóa thư mục prefetch" });
});

// Lấy danh sách ổ đĩa có sẵn
app.get("/list-drives", (req, res) => {
    exec("wmic logicaldisk get caption", (error, stdout, stderr) => {
        if (error) {
            console.error("Lỗi khi lấy danh sách ổ đĩa:", error);
            return res.status(500).json({ message: "Không thể lấy danh sách ổ đĩa" });
        }

        const drives = stdout
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.endsWith(":")); // Chỉ lấy các dòng có ký tự ":"

        res.json({ drives });
    });
});

// Dọn dẹp ổ đĩa theo lựa chọn của người dùng
app.get("/clean-disk/:drive", (req, res) => {
    const drive = req.params.drive.toUpperCase(); // Chuyển thành chữ hoa (C:, D:, ...)

    if (!/^[A-Z]:$/.test(drive)) {
        return res.status(400).json({ message: "Ổ đĩa không hợp lệ!" });
    }

    // Thiết lập CleanMgr tự động chạy dọn dẹp tất cả
    exec(`cleanmgr /sagerun:1`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Lỗi khi dọn ổ ${drive}:`, error);
            return res.status(500).json({ message: `Lỗi khi dọn ổ ${drive}` });
        }
        res.json({ message: `Đã chạy dọn dẹp ổ ${drive}` });
    });
});

app.get("/create-and-run-batch", (req, res) => {
    const batchFilePath = path.join(__dirname, "cleaner.bat");
    
    // Nội dung file batch với lệnh tự động "nhấn phím"
    const batchContent = `@echo off
echo Xoa file rac tren he dieu hanh Windows
del /f /s /q %systemdrive%\\*.tmp
del /f /s /q %systemdrive%\\*._mp
del /f /s /q %systemdrive%\\*.log
del /f /s /q %systemdrive%\\*.gid
del /f /s /q %systemdrive%\\*.chk
del /f /s /q %systemdrive%\\*.old
del /f /s /q %systemdrive%\\recycled\\*.*
del /f /s /q %windir%\\*.bak
del /f /s /q %windir%\\prefetch\\*.*
rd /s /q %windir%\\temp & md %windir%\\temp
del /f /q %userprofile%\\cookies\\*.*
del /f /q %userprofile%\\recent\\*.*
del /f /s /q "%userprofile%\\Local Settings\\Temporary Internet Files\\*.*"
del /f /s /q "%userprofile%\\Local Settings\\Temp\\*.*"
del /f /s /q "%userprofile%\\recent\\*.*"
echo Qua trinh quet rac da hoan tat. Cam on ban da theo doi Blogchiasekienthuc.com!
echo.
echo Nhấn phím bất kỳ để tiếp tục...
echo|set /p=. >nul
timeout /t 5
del "%~f0"
exit`;
    // Ghi nội dung vào file .bat
    fs.writeFileSync(batchFilePath, batchContent);
    // Chạy file batch
    exec(`start "" "${batchFilePath}"`, (error) => {
        if (error) {
            console.error("Lỗi khi chạy file batch:", error);
            return res.status(500).json({ message: "Lỗi khi chạy file batch!" });
        }
        res.json({ message: "File batch đã được tạo và đang chạy!" });
    });
});


app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
