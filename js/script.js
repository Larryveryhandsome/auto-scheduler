// 定義人員資料
const people = ["B林其衛", "B楊茗傑", "B黃詩晴", "B林緁締", "B曾文俊", "A桂珍珍"];
const peopleSat = ["A桂珍珍", "B林緁締"];
const peopleSun = ["B林其衛", "B楊茗傑", "B黃詩晴"];
const scheduleCount = {};
const recentDuty = {};
const maxDutyPerWeek = {
    "B曾文俊": 1
};
people.forEach(p => { 
    scheduleCount[p] = 0; 
    recentDuty[p] = 0; 
});

// 更新月份選項
function updateMonthOptions() {
    const year = document.getElementById("yearSelect").value;
    const monthSelect = document.getElementById("monthSelect");
    const currentValue = monthSelect.value;
    monthSelect.innerHTML = '';
    const months = [
        { value: "01", name: "1月", days: 31 },
        { value: "02", name: "2月", days: isLeapYear(year) ? 29 : 28 },
        { value: "03", name: "3月", days: 31 },
        { value: "04", name: "4月", days: 30 },
        { value: "05", name: "5月", days: 31 },
        { value: "06", name: "6月", days: 30 },
        { value: "07", name: "7月", days: 31 },
        { value: "08", name: "8月", days: 31 },
        { value: "09", name: "9月", days: 30 },
        { value: "10", name: "10月", days: 31 },
        { value: "11", name: "11月", days: 30 },
        { value: "12", name: "12月", days: 31 }
    ];
    months.forEach(month => {
        const option = document.createElement("option");
        option.value = month.value;
        option.textContent = `${month.name} (${month.days}天)`;
        if (month.value === currentValue || (!currentValue && month.value === "04" && year === "2025")) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });
    updateTable();
}

// 判斷閏年
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// 更新表格
function updateTable() {
    const year = document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").value;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    document.getElementById("tableTitle").textContent = `${year} 年 ${parseInt(month)} 月排班表`;

    // 更新日期和星期
    for (let i = 1; i <= 31; i++) {
        const dayHeader = document.getElementById(`day${i}`);
        const weekHeader = document.getElementById(`week${i}`);
        if (i <= daysInMonth) {
            dayHeader.style.display = "";
            weekHeader.style.display = "";
            dayHeader.textContent = i;
            weekHeader.textContent = weekDays[(firstDay + i - 1) % 7];
        } else {
            dayHeader.style.display = "none";
            weekHeader.style.display = "none";
        }
    }

    // 更新表格內容
    const tbody = document.getElementById("scheduleBody");
    const rows = tbody.getElementsByTagName("tr");
    for (let i = 0; i < rows.length; i++) {
        for (let j = 1; j <= daysInMonth; j++) {
            rows[i].cells[j].style.display = "";
            rows[i].cells[j].className = "";
        }
        for (let j = daysInMonth + 1; j <= 31; j++) {
            rows[i].cells[j].style.display = "none";
        }
        rows[i].cells[32].textContent = "0";
    }
}

// 新增請假記錄
function addLeaveEntry() {
    const leaveControls = document.getElementById("leaveControls");
    const newEntry = document.createElement("div");
    newEntry.className = "leave-entry";
    newEntry.innerHTML = `
        <select name="leavePerson[]">
            <option value="">選擇人員</option>
            ${people.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <input type="text" name="leaveRange[]" placeholder="如 14-16">
        <button onclick="removeLeaveEntry(this)">移除</button>
    `;
    leaveControls.appendChild(newEntry);
}

// 移除請假記錄
function removeLeaveEntry(button) {
    button.parentElement.remove();
}

// 重置排班表
function resetSchedule() {
    const tbody = document.getElementById("scheduleBody");
    const rows = tbody.getElementsByTagName("tr");
    for (let i = 0; i < rows.length; i++) {
        for (let j = 1; j <= 31; j++) {
            rows[i].cells[j].textContent = "";
            rows[i].cells[j].className = "";
        }
        rows[i].cells[32].textContent = "0";
    }
    while (document.getElementsByClassName("leave-entry").length > 1) {
        document.getElementsByClassName("leave-entry")[1].remove();
    }
    const firstEntry = document.getElementsByClassName("leave-entry")[0];
    firstEntry.querySelector("select").value = "";
    firstEntry.querySelector("input").value = "";
    Object.keys(scheduleCount).forEach(p => scheduleCount[p] = 0);
    Object.keys(recentDuty).forEach(p => recentDuty[p] = 0);
}

// 生成排班表
function generateSchedule() {
    const year = document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").value;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const tbody = document.getElementById("scheduleBody");
    const rows = tbody.getElementsByTagName("tr");
    const leaveEntries = document.getElementsByClassName("leave-entry");
    let leaves = [];
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.style.display = "none";

    // 重置表格與計數
    resetSchedule();

    // 收集請假資料
    for (let entry of leaveEntries) {
        const person = entry.querySelector("select").value;
        const range = entry.querySelector("input").value;
        if (person && range) {
            if (!/^\d+-\d+$/.test(range)) {
                errorMsg.style.display = "block";
                return;
            }
            const [start, end] = range.split("-").map(num => parseInt(num));
            if (start <= 0 || end > daysInMonth || start > end) {
                errorMsg.style.display = "block";
                return;
            }
            leaves.push({ person, start, end });
        }
    }

    // 標記請假
    for (let leave of leaves) {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells[0].textContent === leave.person) {
                for (let j = leave.start; j <= leave.end; j++) {
                    rows[i].cells[j].textContent = "假";
                    rows[i].cells[j].className = "leave";
                }
            }
        }
    }

    // 目標值班次數
    const totalPeople = people.length;
    const baseCount = Math.floor(daysInMonth / totalPeople); // 基礎次數
    const targetCount = baseCount; // 每人目標 4-5 次
    const linQiWeiTarget = baseCount + 1; // 林其衛目標高 1 次
    let lastPerson = "";

    // 自動排班
    for (let j = 1; j <= daysInMonth; j++) {
        const dayOfWeek = (firstDay + j - 1) % 7;
        const dayWeek = weekDays[dayOfWeek];
        const candidates = dayWeek === "六" ? peopleSat : (dayWeek === "日" ? peopleSun : people);

        // 篩選有效候選人
        let validCandidates = [];
        for (let person of candidates) {
            let isOnLeave = leaves.some(leave => leave.person === person && j >= leave.start && j <= leave.end);
            let daysSinceLastDuty = j - recentDuty[person];
            
            // 檢查周排班限制
            const weekNumber = Math.floor((j - 1) / 7);
            const weeklyDutyCount = Object.entries(scheduleCount)
                .filter(([p, count]) => p === person && count > weekNumber * maxDutyPerWeek[p])
                .length;

            if (!isOnLeave && (daysSinceLastDuty >= 7 || recentDuty[person] === 0)) {
                if (person === "B林其衛" && scheduleCount[person] < linQiWeiTarget) {
                    validCandidates.push(person);
                } else if (person === "B曾文俊" && weeklyDutyCount === 0) {
                    validCandidates.push(person);
                } else if (scheduleCount[person] < targetCount + 1) {
                    validCandidates.push(person);
                }
            }
        }

        // 若無人選，放寬間隔限制
        if (!validCandidates.length) {
            for (let person of candidates) {
                let isOnLeave = leaves.some(leave => leave.person === person && j >= leave.start && j <= leave.end);
                if (!isOnLeave && person !== lastPerson) {
                    if (person === "B林其衛" && scheduleCount[person] < linQiWeiTarget) {
                        validCandidates.push(person);
                    } else if (person === "B曾文俊" && weeklyDutyCount === 0) {
                        validCandidates.push(person);
                    } else if (scheduleCount[person] < targetCount + 1) {
                        validCandidates.push(person);
                    }
                }
            }
        }

        // 若仍無人選，允許連續值班
        if (!validCandidates.length) {
            for (let person of candidates) {
                let isOnLeave = leaves.some(leave => leave.person === person && j >= leave.start && j <= leave.end);
                if (!isOnLeave) validCandidates.push(person);
            }
        }

        if (!validCandidates.length) {
            alert(`第 ${j} 天無可用人員，請檢查請假設定！`);
            return;
        }

        // 選擇值班人員（優先林其衛，否則選最少次數者）
        let selectedPerson = "";
        if (validCandidates.includes("B林其衛") && scheduleCount["B林其衛"] < linQiWeiTarget) {
            selectedPerson = "B林其衛";
        } else {
            let minCount = Infinity;
            for (let person of validCandidates) {
                if (scheduleCount[person] < minCount) {
                    minCount = scheduleCount[person];
                    selectedPerson = person;
                }
            }
        }

        // 寫入排班結果
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells[0].textContent === selectedPerson && rows[i].cells[j].textContent !== "假") {
                rows[i].cells[j].textContent = "值";
                rows[i].cells[j].className = "duty";
                scheduleCount[selectedPerson]++;
                recentDuty[selectedPerson] = j;
            }
        }
        lastPerson = selectedPerson;
    }

    // 更新總數
    for (let i = 0; i < rows.length; i++) {
        let count = 0;
        for (let j = 1; j <= daysInMonth; j++) {
            if (rows[i].cells[j].textContent === "值") count++;
        }
        rows[i].cells[32].textContent = count;
    }

    alert("排班完成！");
}

// 下載PDF
function downloadPDF() {
    const table = document.getElementById("scheduleTable");
    const { jsPDF } = window.jspdf;
    html2canvas(table, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save('排班表.pdf');
    }).catch(() => alert("PDF 下載失敗，請稍後重試。"));
}

// 頁面載入時初始化
window.onload = () => updateMonthOptions();
