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
    const year = parseInt(document.getElementById('year').select2('data')[0].text);
    const month = parseInt(document.getElementById('month').select2('data')[0].text);
    const daysInMonth = new Date(year, month, 0).getDate();
    const schedule = {};
    const dutyCount = {};
    const lastDutyDay = {};

    // 初始化值班次數和最後值班日期
    people.forEach(person => {
        dutyCount[person] = 0;
        lastDutyDay[person] = 0;
    });

    // 取得請假資料
    const leaveData = {};
    people.forEach(person => {
        const leaveDays = document.getElementById(`leave_${person}`).value;
        leaveData[person] = leaveDays ? leaveDays.split(',').map(day => parseInt(day.trim())) : [];
    });

    // 為每一天安排值班人員
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0 是週日，6 是週六

        // 週日固定由林其衛值班
        if (dayOfWeek === 0) {
            schedule[day] = "林其衛";
            dutyCount["林其衛"]++;
            lastDutyDay["林其衛"] = day;
            continue;
        }

        // 週一至週六正常排班
        let availablePeople = people.filter(person => {
            // 檢查是否請假
            if (leaveData[person].includes(day)) return false;
            
            // 檢查是否在7天內值過班
            if (lastDutyDay[person] > 0 && (day - lastDutyDay[person]) < 7) return false;
            
            // 曾文俊每週最多值班一次
            if (person === "曾文俊") {
                const weekStart = day - dayOfWeek;
                const weekEnd = weekStart + 6;
                for (let d = weekStart; d <= Math.min(weekEnd, day); d++) {
                    if (d > 0 && schedule[d] === "曾文俊") return false;
                }
            }
            
            return true;
        });

        // 按值班次數排序，優先選擇值班次數較少的人
        availablePeople.sort((a, b) => dutyCount[a] - dutyCount[b]);

        if (availablePeople.length > 0) {
            const selectedPerson = availablePeople[0];
            schedule[day] = selectedPerson;
            dutyCount[selectedPerson]++;
            lastDutyDay[selectedPerson] = day;
        } else {
            schedule[day] = "無人可值班";
        }
    }

    // 更新表格
    updateTable(schedule, year, month);
}

// 初始化拖放功能
function initializeDragAndDrop() {
    const cells = document.querySelectorAll('#scheduleBody td:not(:first-child):not(:last-child)');
    
    cells.forEach(cell => {
        cell.classList.add('duty-cell');
        
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragend', handleDragEnd);
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
        cell.setAttribute('draggable', 'true');
    });
}

function handleDragStart(e) {
    if (!e.target.textContent) return;
    
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.duty-cell').forEach(cell => {
        cell.classList.remove('droppable');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('droppable');
}

function handleDrop(e) {
    e.preventDefault();
    const sourceContent = e.dataTransfer.getData('text/plain');
    const targetContent = e.target.textContent;
    
    // 交換值班
    if (sourceContent && e.target.classList.contains('duty-cell')) {
        const sourceCell = document.querySelector('.dragging');
        if (sourceCell) {
            sourceCell.textContent = targetContent;
            e.target.textContent = sourceContent;
            updateDutyCounts();
        }
    }
    
    e.target.classList.remove('droppable');
}

// 更新值班次數
function updateDutyCounts() {
    const rows = document.getElementById('scheduleBody').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        let count = 0;
        for (let j = 1; j <= 31; j++) {
            if (rows[i].cells[j].textContent === '值') count++;
        }
        rows[i].cells[32].textContent = count;
    }
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
window.onload = () => {
    updateMonthOptions();
    initializeDragAndDrop();
};
