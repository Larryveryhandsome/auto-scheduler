// 定義人員資料
const people = ["林其衛", "黃詩晴", "楊茗傑", "林緁締", "曾文俊", "桂珍珍"];
const peopleSun = ["林其衛"]; // 週日固定林其衛
const scheduleCount = {};
const recentDuty = {};
const maxDutyPerWeek = {
    "曾文俊": 1
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
    const tbody = document.getElementById("scheduleBody");
    const rows = tbody.getElementsByTagName("tr");
    const leaveEntries = document.getElementsByClassName("leave-entry");
    let leaves = [];
    
    // 重置表格
    resetSchedule();
    
    // 收集請假資料
    for (let entry of leaveEntries) {
        const person = entry.querySelector("select").value;
        const range = entry.querySelector("input").value;
        if (person && range) {
            if (!/^\d+-\d+$/.test(range)) {
                alert("請輸入正確的請假日期範圍（例如：1-5）");
                return;
            }
            const [start, end] = range.split("-").map(num => parseInt(num));
            if (start <= 0 || end > daysInMonth || start > end) {
                alert("請假日期必須在當月範圍內");
                return;
            }
            leaves.push({ person, start, end });
        }
    }

    // 標記請假
    for (let leave of leaves) {
        const row = Array.from(rows).find(r => r.cells[0].textContent.trim() === leave.person);
        if (row) {
            for (let day = leave.start; day <= leave.end; day++) {
                row.cells[day].textContent = "假";
                row.cells[day].className = "leave";
            }
        }
    }

    // 為每一天安排值班人員
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0 是週日，6 是週六

        // 週日固定由林其衛值班
        if (dayOfWeek === 0) {
            const linRow = Array.from(rows).find(r => r.cells[0].textContent.trim() === "林其衛");
            if (linRow) {
                // 檢查是否請假
                const isOnLeave = leaves.some(leave => 
                    leave.person === "林其衛" && day >= leave.start && day <= leave.end
                );
                if (!isOnLeave) {
                    linRow.cells[day].textContent = "值";
                    linRow.cells[day].className = "duty";
                    continue;
                }
            }
        }

        // 週一至週六正常排班
        let availablePeople = [];
        for (let i = 0; i < rows.length; i++) {
            const person = rows[i].cells[0].textContent.trim();
            
            // 檢查是否請假
            const isOnLeave = leaves.some(leave => 
                leave.person === person && day >= leave.start && day <= leave.end
            );
            
            // 獲取本週值班次數
            const currentDate = new Date(year, month - 1, day);
            const weekStart = day - currentDate.getDay();
            const weekEnd = Math.min(daysInMonth, weekStart + 6);
            let weeklyDutyCount = 0;
            
            for (let j = weekStart; j <= weekEnd; j++) {
                if (j > 0 && j <= daysInMonth && rows[i].cells[j] && 
                    rows[i].cells[j].textContent === "值") {
                    weeklyDutyCount++;
                }
            }

            // 檢查值班限制
            const maxWeeklyDuty = person === "曾文俊" ? 1 : 2;
            if (!isOnLeave && weeklyDutyCount < maxWeeklyDuty) {
                availablePeople.push(i);
            }
        }

        if (availablePeople.length > 0) {
            // 選擇值班次數最少的人
            let selectedRow = availablePeople[0];
            let minDuty = daysInMonth;
            
            for (let i of availablePeople) {
                let dutyCount = 0;
                for (let j = 1; j <= daysInMonth; j++) {
                    if (rows[i].cells[j].textContent === "值") {
                        dutyCount++;
                    }
                }
                if (dutyCount < minDuty) {
                    minDuty = dutyCount;
                    selectedRow = i;
                }
            }

            rows[selectedRow].cells[day].textContent = "值";
            rows[selectedRow].cells[day].className = "duty";
        } else if (dayOfWeek !== 0) {
            // 如果找不到可用人員，嘗試放寬限制（忽略本週值班次數限制）
            for (let i = 0; i < rows.length; i++) {
                const person = rows[i].cells[0].textContent.trim();
                const isOnLeave = leaves.some(leave => 
                    leave.person === person && day >= leave.start && day <= leave.end
                );
                
                if (!isOnLeave && person !== "曾文俊") {  // 仍然保持曾文俊的限制
                    availablePeople.push(i);
                }
            }

            if (availablePeople.length > 0) {
                // 選擇值班次數最少的人
                let selectedRow = availablePeople[0];
                let minDuty = daysInMonth;
                
                for (let i of availablePeople) {
                    let dutyCount = 0;
                    for (let j = 1; j <= daysInMonth; j++) {
                        if (rows[i].cells[j].textContent === "值") {
                            dutyCount++;
                        }
                    }
                    if (dutyCount < minDuty) {
                        minDuty = dutyCount;
                        selectedRow = i;
                    }
                }

                rows[selectedRow].cells[day].textContent = "值";
                rows[selectedRow].cells[day].className = "duty";
            } else {
                alert(`第 ${day} 日無可用人員，請檢查排班規則！`);
                return;
            }
        }
    }

    // 更新值班總數
    updateDutyCounts();
}

// 更新值班總數
function updateDutyCounts() {
    const tbody = document.getElementById("scheduleBody");
    const rows = tbody.getElementsByTagName("tr");
    
    for (let i = 0; i < rows.length; i++) {
        let count = 0;
        for (let j = 1; j <= 31; j++) {
            if (rows[i].cells[j] && rows[i].cells[j].textContent === "值") {
                count++;
            }
        }
        rows[i].cells[32].textContent = count;
    }
}

// 初始化拖放功能
function initializeDragAndDrop() {
    const cells = document.querySelectorAll('#scheduleBody td:not(:first-child):not(:last-child)');
    
    cells.forEach(cell => {
        cell.setAttribute('draggable', 'true');
        
        cell.addEventListener('dragstart', function(e) {
            if (this.textContent === '') return;
            e.dataTransfer.setData('text/plain', this.textContent);
            this.classList.add('dragging');
        });

        cell.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            document.querySelectorAll('.duty-cell').forEach(cell => {
                cell.classList.remove('droppable');
            });
        });

        cell.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (!this.classList.contains('droppable')) {
                this.classList.add('droppable');
            }
        });

        cell.addEventListener('dragleave', function(e) {
            this.classList.remove('droppable');
        });

        cell.addEventListener('drop', function(e) {
            e.preventDefault();
            const sourceContent = e.dataTransfer.getData('text/plain');
            const targetContent = this.textContent;
            const sourceCell = document.querySelector('.dragging');

            // 如果是空白格子或值班格子，允許交換
            if (sourceCell && (targetContent === '' || targetContent === '值' || sourceContent === '值')) {
                sourceCell.textContent = targetContent;
                this.textContent = sourceContent;

                // 更新樣式
                if (targetContent === '值') {
                    sourceCell.className = 'duty';
                } else {
                    sourceCell.className = '';
                }
                if (sourceContent === '值') {
                    this.className = 'duty';
                } else {
                    this.className = '';
                }

                // 更新值班總數
                updateDutyCounts();
            }

            this.classList.remove('droppable');
        });
    });
}

// 更新下載PDF功能以包含備註
function downloadPDF() {
    const content = document.createElement('div');
    content.appendChild(document.getElementById('scheduleTable').cloneNode(true));
    
    const notesSection = document.createElement('div');
    notesSection.className = 'notes-section';
    notesSection.innerHTML = `
        <h3>激勵備註</h3>
        <p style="font-size: 20px; margin-top: 10px;">${document.getElementById('motivationalNotes').value}</p>
    `;
    content.appendChild(notesSection);
    
    const { jsPDF } = window.jspdf;
    html2canvas(content, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save('排班表.pdf');
    }).catch(() => alert("PDF 下載失敗，請稍後重試。"));
}

// 頁面載入時初始化
window.onload = function() {
    updateMonthOptions();
    initializeDragAndDrop();
};
