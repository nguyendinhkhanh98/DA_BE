const _ = require("lodash");
const axios = require("axios");
const Excel = require("exceljs");
const fs = require("fs");
const SkillSetUtils = require("../../utils/skill-set.util");
const moment = require("moment");

exports.writeDataToExcel = (data, columns) => {
  var workbook = new Excel.Workbook();
  workbook.creator = "giapdong";
  workbook.lastModifiedBy = "giapdong";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("QCD Management");
  fillIssueReport(worksheet, columns, data);
  return workbook;
};

exports.writeInvoiceSheetsToExcel = async (
  projectName,
  duration,
  kpiData,
  detailData,
  worklogData,
  costData,
  invoice
) => {
  let workbook = new Excel.Workbook();
  workbook.creator = "QCD";
  workbook.lastModifiedBy = "QCD";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  let worksheet1 = workbook.addWorksheet(`${projectName} Summary`);
  let worksheet2 = workbook.addWorksheet(`${projectName} Annual Report`);
  let worksheet3 = workbook.addWorksheet(`${projectName} KPI Result`);
  let worksheet4 = workbook.addWorksheet(`${projectName} Detail Report`);
  let worksheet5 = workbook.addWorksheet(`${projectName} KPI worklog by user`);
  fillSummary(worksheet1, costData, projectName, invoice, duration);
  fillAnnualReport(worksheet2, detailData);
  fillKPIResult(worksheet3, kpiData, projectName, duration);
  fillIssueReport(worksheet4, detailData.columns, detailData.data);
  fillWorklogByUser(worksheet5, worklogData);
  return workbook;
};

let fillSummary = (ws, costData, projectName, invoice, duration) => {
  ws.getCell("A1").value = "Invoice name";
  ws.getCell("A2").value = "Status";
  ws.getCell("A3").value = "Duration";
  ws.getCell("B1").value = `: ${invoice.invoice_name}`;
  ws.getCell("B2").value = `: ${invoice.status_name}`;
  ws.getCell("B3").value = `: ${duration[0]} ~ ${duration[1]}`;

  let { columns, rows } = getColumnsAndRowsForSummary(costData, projectName);

  ws.addTable({
    name: "CostData",
    ref: `A4`,
    headerRow: true,
    columns: columns,
    rows: rows
  });

  handleColumnsStyle(ws, columns, true, "FFFF00");

  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (rowNumber > 3) {
        if (rowNumber <= 4 + costData.length) cell.border = borderStyles;
        else cell.font = header6;
        cell.alignment = { horizontal: "right" };
      }
    });
  });

  setStylesForSummarySheet(ws);
};
let fillAnnualReport = (ws, detailData) => {
  fillIssueReport(ws, detailData.columns, detailData.data, true);
};
let fillIssueReport = (worksheet, columns, data, isAnnualReport) => {
  let rows = data.map(item => Object.values(item));

  if (isAnnualReport) {
    rows = rows
      .filter(r => ["Story", "New Feature", "Improvement"].includes(r[1]))
      .map((r, i) => [i + 1, ...r.slice(1, 6)]);
    columns = columns.filter(c => ["A1", "B1", "C1", "D1", "E1", "F1"].includes(c.cell));
  }

  worksheet.addTable({
    name: "JiraReportTable",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });

  handleColumnsStyle(worksheet, columns, false, isAnnualReport ? "FFFF00" : null);

  worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
      cell.border = borderStyles;
      const colsAlignRight = [7, 9, 10, 11, 17];
      if (rowNumber > 1) {
        if (colsAlignRight.indexOf(colNumber) > -1) {
          cell.alignment = { horizontal: "right" };
        }
      }
    });
  });
};
let fillWorklogByUser = (ws, worklogData) => {
  let { columns, rows, summaryColumns, summaryRows, summaryDuration } = worklogData;

  // Detail
  ws.addTable({
    name: "AllWorklogs",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });
  columns.forEach((column, index) => {
    // column width
    ws.getColumn(index + 1).width = column.width;
  });

  // Summary
  let index = rows.length + 10;
  ws.mergeCells(index - 1, 1, index - 1, 5);
  ws.getCell(
    getColumnCellNameFromIndex(index - 1, 0)
  ).value = `SUMMARY: From ${summaryDuration[0]} to ${summaryDuration[1]}`;
  ws.addTable({
    name: "SummaryWorklog",
    ref: `A${index}`,
    headerRow: true,
    columns: summaryColumns,
    rows: summaryRows
  });
};

let fillKPIResult = (ws, kpiData, projectName, duration) => {
  let { quality, cost, delivery } = kpiData;
  // Labels
  ws.getCell("F1").value = "QCD KPI Result";
  ws.getCell("A3").value = `Project:`;
  ws.getCell("B3").value = ` ${projectName}`;
  ws.getCell("A4").value = `Duration:`;
  ws.getCell("B4").value = ` ${duration[0]} ~ ${duration[1]}`;
  ws.getCell("A6").value = `"Q"uality`;
  ws.getCell("A7").value = ` Quality compliance rate: Ratio of bug`;
  ws.getCell("A8").value = ` Bug Ratio By Number`;
  ws.getCell("A10").value = ` Bug Ratio By Hour`;
  ws.getCell("A12").value = ` Degradation Ratio By Number`;
  ws.getCell("A14").value = ` Degradation Ratio By Hour`;
  ws.getCell("A16").value = `"C"ost`;
  ws.getCell("A17").value = ` Cost compliance rate: Ratio of between Actual Man hour and Estimated Man hour`;
  ws.getCell("G18").value = `(Actual Manhours - Estimated Manhours)`;
  ws.getCell("H18").value = `/ Estimated Manhours`;
  ws.getCell("A20").value = `"D"elivery`;
  ws.getCell("A21").value = ` Delivery date compliance rate: Ratio of meeting the Answer due date`;
  ws.getCell("G22").value = `Number of meeting the Answer due date`;
  ws.getCell("H22").value = `/ Number of issue`;
  ws.getCell("G8").value = `Number of bug`;
  ws.getCell("H8").value = `/ Number of issue`;
  ws.getCell("G10").value = `Total hour of bug`;
  ws.getCell("H10").value = `/ Total hour of issue`;
  ws.getCell("G12").value = `Number of degradation`;
  ws.getCell("H12").value = `/ Number of issue`;
  ws.getCell("G14").value = `degradation`;
  ws.getCell("H14").value = `/ Total hour of issue`;
  ws.getCell("L8").value = `Result`;
  ws.getCell("L10").value = `Result`;
  ws.getCell("L12").value = `Result`;
  ws.getCell("L14").value = `Result`;
  ws.getCell("L18").value = `Result`;
  ws.getCell("L22").value = `Result`;

  // Data
  ws.getCell("G9").value = quality.bugRatioByNumber.count;
  ws.getCell("H9").value = `/ ` + quality.bugRatioByNumber.total;
  ws.getCell("G11").value = quality.bugRatioByHour.bugHour;
  ws.getCell("H11").value = `/ ` + quality.bugRatioByHour.issueHour;
  ws.getCell("G13").value = quality.degrate.count;
  ws.getCell("H13").value = `/ ` + quality.degrate.total;
  ws.getCell("G15").value = quality.degradationByHour.degradationHour;
  ws.getCell("H15").value = `/ ` + quality.degradationByHour.issueHour;
  ws.getCell("G19").value = `(${cost.actualManhour} - ${cost.estimateManhour})`;
  ws.getCell("H19").value = `/ ` + cost.estimateManhour;
  ws.getCell("G23").value = delivery.issueBeforeDuedate;
  ws.getCell("H23").value = `/ ` + delivery.totalIssue;

  ws.getCell("K9").value = `=`;
  ws.getCell("K11").value = `=`;
  ws.getCell("K13").value = `=`;
  ws.getCell("K15").value = `=`;
  ws.getCell("K19").value = `=`;
  ws.getCell("K23").value = `=`;

  let results = [
    getPercentage(quality.bugRatioByNumber.count, quality.bugRatioByNumber.total),
    getPercentage(quality.bugRatioByHour.bugHour, quality.bugRatioByHour.issueHour),
    getPercentage(quality.degrate.count, quality.degrate.total),
    getPercentage(quality.degradationByHour.degradationHour, quality.degradationByHour.issueHour),
    getPercentage(cost.actualManhour - cost.estimateManhour, cost.estimateManhour),
    getPercentage(delivery.issueBeforeDuedate, delivery.totalIssue)
  ];
  ws.getCell("L9").value = `${results[0]} %`;
  ws.getCell("L11").value = `${results[1]} %`;
  ws.getCell("L13").value = `${results[2]} %`;
  ws.getCell("L15").value = `${results[3]} %`;
  ws.getCell("L19").value = `${results[4]} %`;
  ws.getCell("L23").value = `${results[5]} %`;

  setStyles(ws, results);
};

let setStyles = (ws, results) => {
  ws.getCell("F1").font = title;
  ws.getCell("A3").font = normalText;
  ws.getCell("A4").font = normalText;
  ws.getCell("A3").font = normalText;
  ws.getCell("B4").font = normalText;
  ws.getCell("A6").font = header1;
  ws.getCell("A16").font = header1;
  ws.getCell("A20").font = header1;
  ws.getCell("A7").font = header2;
  ws.getCell("A17").font = header2;
  ws.getCell("A21").font = header2;
  ws.getCell("L8").font = normalText;
  ws.getCell("L10").font = normalText;
  ws.getCell("L12").font = normalText;
  ws.getCell("L14").font = normalText;
  ws.getCell("L18").font = normalText;
  ws.getCell("L22").font = normalText;
  ws.getCell("L9").font = resultText("Q", results[0]);
  ws.getCell("L11").font = resultText("Q", results[1]);
  ws.getCell("L13").font = resultText("Q", results[2]);
  ws.getCell("L15").font = resultText("Q", results[3]);
  ws.getCell("L19").font = resultText("C", results[4]);
  ws.getCell("L23").font = resultText("C", results[5]);

  ws.addConditionalFormatting({
    ref: "A8:H22",
    rules: [
      {
        type: "expression",
        formulae: [
          "AND(OR(ROW()=8, OR(ROW()=10, OR(ROW()=12, OR(ROW()=14, OR(ROW()=18, ROW()=22))))), OR(COLUMN()=7, OR(COLUMN()=8, COLUMN()=1)))"
        ],
        style: { font: header3 }
      }
    ]
  });

  ws.addConditionalFormatting({
    ref: "G9:K23",
    rules: [
      {
        type: "expression",
        formulae: [
          "AND(OR(ROW()=9, OR(ROW()=11, OR(ROW()=13, OR(ROW()=15, OR(ROW()=19, ROW()=23))))), OR(COLUMN()=7, OR(COLUMN()=8, COLUMN()=11)))"
        ],
        style: { font: normalTextDarkGreen }
      }
    ]
  });

  ws.addConditionalFormatting({
    ref: "G8:K23",
    rules: [
      {
        type: "expression",
        formulae: ["OR(COLUMN()=7,COLUMN()=11)"],
        style: { alignment: right }
      }
    ]
  });
};

let getColumnsAndRowsForSummary = (costData, projectName) => {
  let columns = [
    { name: "No", cell: "A4", width: 16 },
    { name: "Project", cell: "B4", width: 10 },
    { name: "Name", cell: "C4", width: 20 },
    { name: "Role", cell: "D4", width: 10 },
    { name: "Man month ($)", cell: "E4", width: 20 },
    { name: "Time work logged (h)", cell: "F4", width: 20 },
    { name: "Time work logged (month)", cell: "G4", width: 25 },
    { name: "Total Cost ($) ", cell: "H4", width: 15 }
  ];

  let rows = [];
  let total = 0;
  costData.forEach((r, i) => {
    let row = [i + 1, projectName, r.displayName, r.role, r.cost, r.hours, r.months, Math.round(r.months * r.cost)];
    rows.push(row);
    total += Math.round(r.months * r.cost);
  });
  rows.push([costData.length + 1, "Total", "", "", "", "", "", total]);
  return { columns, rows };
};

let setStylesForSummarySheet = ws => {
  ws.getCell("A1").font = header4;
  ws.getCell("A2").font = header4;
  ws.getCell("A3").font = header4;
  ws.getCell("B1").font = normalText2;
  ws.getCell("B2").font = normalText2;
  ws.getCell("B3").font = normalText2;
};

let handleColumnsStyle = (
  ws,
  columns,
  shouldHeaderBeBold,
  backgroundColor,
  shouldWrapText,
  shouldHeaderBeTopAligned
) => {
  let fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: backgroundColor ?? "0052cc" }
  };

  columns = columns.map(item => ({ ...item, fill }));

  columns.forEach((column, index) => {
    ws.getCell(column.cell).value = column.name;
    ws.getCell(column.cell).alignment = {
      vertical: shouldHeaderBeTopAligned ? "top" : "middle",
      horizontal: column.horizontalAlignment ?? "right",
      wrapText: shouldWrapText ? true : false
    };
    // column width
    ws.getColumn(index + 1).width = column.width;
    // column color
    ws.getCell(column.cell).fill = column.fill;
    if (shouldHeaderBeBold) ws.getCell(column.cell).font = header5;
  });
};

var title = {
  name: "Times New Roman",
  family: 4,
  size: 18,
  underline: false,
  bold: true
};

var header1 = {
  name: "Times New Roman",
  family: 4,
  size: 16,
  underline: false,
  bold: true
};

var header2 = {
  name: "Times New Roman",
  family: 4,
  size: 11,
  color: { argb: "FF01633E" },
  underline: false,
  bold: true
};

var header3 = {
  name: "Trebuchet MS",
  family: 4,
  size: 11,
  color: { argb: "FF646060" },
  underline: false,
  bold: false
};

var header4 = {
  name: "Arial",
  family: 4,
  size: 12,
  underline: false,
  bold: true
};

var header5 = {
  name: "Arial",
  family: 4,
  size: 10,
  underline: false,
  bold: true
};

var header6 = {
  name: "Arial",
  family: 4,
  size: 11,
  underline: false,
  bold: true
};

var normalText = {
  name: "Times New Roman",
  family: 4,
  size: 11,
  underline: false,
  bold: false
};

var normalText2 = {
  name: "Arial",
  family: 4,
  size: 12,
  underline: false,
  bold: false
};

var normalText3 = {
  name: "Arial",
  family: 4,
  size: 10,
  underline: false,
  bold: false
};

var normalTextDarkGreen = {
  name: "Times New Roman",
  family: 4,
  color: { argb: "FF50C878" },
  size: 11,
  underline: false,
  bold: false
};

var borderStyles = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" }
};

var resultText = (type, val) => ({
  name: "Times New Roman",
  family: 4,
  color: {
    argb:
      (type == "Q" && val < 3.0) || (type == "C" && val < 6.0) || (type == "D" && val >= 90.0)
        ? "FF00FF00"
        : (type == "Q" && val < 6.0) || (type == "C" && val < 11.0) || (type == "D" && val >= 80.0)
        ? "FF84C02A"
        : (type == "Q" && val < 11.0) || (type == "C" && val < 16.0) || (type == "D" && val >= 70.0)
        ? "FFCD7F32"
        : "FFFF0000"
  },
  size: 11,
  underline: false,
  bold: true
});

var right = { vertical: "bottom", horizontal: "right" };

let getPercentage = (a, b) => ((a / b) * 100).toFixed(2);

let getColumnCellNameFromIndex = (row, col) => {
  const listKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let countCharacter = Math.floor(col / listKeys.length);
  if (countCharacter) {
    let prefix1 = countCharacter - 1;
    let prefix2 = col - listKeys.length * countCharacter;
    return `${listKeys[prefix1]}${listKeys[prefix2]}${row}`;
  } else return `${listKeys[col]}${row}`;
};

exports.writeMonthlyReport = async (durations, worklogData, userRoles) => {
  let workbook = new Excel.Workbook();
  workbook.creator = "QCD";
  workbook.lastModifiedBy = "QCD";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  let sheetTitle = moment(durations[1], "YYYY/MM/DD").format("YYYYMM");

  let worksheet = workbook.addWorksheet(sheetTitle);
  fillMonthlyReportWorksheet(worksheet, worklogData, durations, userRoles);
  return workbook;
};

let fillMonthlyReportWorksheet = (ws, worklogData, durations, userRoles) => {
  fillMonthlyLayout(ws, worklogData, durations);
  fillMonthlyTable(ws, worklogData, userRoles);
};

let fillMonthlyLayout = (ws, worklogData, durations) => {
  let length = worklogData.detailData.rows.length;
  let numberOfWorkingDays = Math.max(
    worklogData.detailData.rows[length - 1].filter(x => !isNaN(x) && x > 0).length - 1,
    0
  );
  ws.mergeCells("A1:B1");
  ws.mergeCells("A2:B2");
  ws.mergeCells("A3:B3");
  ws.mergeCells("C1:H3");
  ws.mergeCells("C4:H4");
  ws.mergeCells("C5:H5");
  ws.mergeCells("D6:E6");

  ws.getCell("A1").value = "ARROW TECHNOLOGIES VIET NAM";
  ws.getCell("A2").value = "18F, VTC Online Building, 18 Tam Trinh";
  ws.getCell("C1").value = "DANH SÁCH NHÂN SỰ THAM GIA DỰ ÁN\r\nプロジェクト参加者一覧";
  ws.getCell("C4").value = `(Danh sách thực tế tháng ${moment(durations[1], "YYYY/MM/DD").format("MM/YYYY")})`;
  ws.getCell("C5").value = `実際一覧${moment(durations[1], "YYYY/MM/DD").format("YYYY年 MM月")}度`;
  ws.getCell("D6").value = "Number of working days";
  ws.getCell("F6").value = numberOfWorkingDays;
  ws.getCell("F6").numFmt = "#.##,###############";
  ws.getCell("G6").value = `(from ${moment(durations[0], "YYYY/MM/DD").format("ll")} to ${moment(
    durations[1],
    "YYYY/MM/DD"
  ).format("ll")})`;

  ws.getCell("A1").font = header5;
  ws.getCell("A2").font = normalText3;
  ws.getCell("C1").font = header4;
  ws.getCell("C4").font = normalText3;
  ws.getCell("C5").font = normalText3;
  ws.getCell("D6").font = normalText3;
  ws.getCell("F6").font = header5;
  ws.getCell("G6").font = normalText3;

  ws.getCell("C1").alignment = { horizontal: "center", vertical: "top" };
  ws.getRow(4).height = "16.5";
  ws.getCell("C4").alignment = { horizontal: "center", vertical: "top" };
  ws.getCell("C5").alignment = { horizontal: "center" };
  ws.getCell("D6").alignment = { horizontal: "center" };
  ws.getCell("F6").alignment = { horizontal: "center" };
};

let fillMonthlyTable = (ws, worklogData, userRoles) => {
  let columns = [
    { name: "STT\r\nNo", cell: "A8", width: 4.5 + columnWidthOffset },
    { name: "Họ và tên\r\n氏名", cell: "B8", width: 27.67 + columnWidthOffset, horizontalAlignment: "left" },
    { name: "Vai trò\r\n役職", cell: "C8", width: 12.67 + columnWidthOffset, horizontalAlignment: "left" },
    { name: "Tên dự án\r\nプロジェクト名", cell: "D8", width: 16.5 + columnWidthOffset, horizontalAlignment: "left" },
    { name: "Số ngày làm thực\r\n実際勤務日数", cell: "E8", width: 7 + columnWidthOffset, horizontalAlignment: "left" },
    {
      name: "Tỷ lệ tham gia vào dự án\r\n参加率",
      cell: "F8",
      width: 7.67 + columnWidthOffset,
      horizontalAlignment: "left"
    },
    { name: "Ngày nghỉ\r\n休日", cell: "G8", width: 5.17 + columnWidthOffset, horizontalAlignment: "left" },
    { name: "Ghi chú\r\n備考", cell: "H8", width: 38 + columnWidthOffset, horizontalAlignment: "left" },
    { name: "日本語", cell: "I8", width: 38 + columnWidthOffset, horizontalAlignment: "left" }
  ];

  let participationData = {};
  for (let i = 0; i < worklogData.detailData.rows.length - 1; i++) {
    let row = worklogData.detailData.rows[i];
    if (!participationData[`${row[2]}___${row[3]}`]) participationData[`${row[2]}___${row[3]}`] = [];
    participationData[`${row[2]}___${row[3]}`].push({
      author: row[1],
      hours: row[row.length - 1],
      email: row[4]
    });
  }

  let rows = [];
  let i = 0;
  let headerIndices = [];
  let uniqueAuthors = [];
  for (let project in participationData) {
    i++;
    let key = project.substring(project.indexOf("___") + 3, project.length);
    let projectName = project.substring(0, project.indexOf("___"));
    rows.push([romanize(i), projectName]);
    headerIndices.push(rows.length + 8);

    participationData[project].forEach((author, index) => {
      author.role = userRoles.find(u => u.jira_email == author.email && u.key == key)?.role ?? "";
      rows.push([index + 1, author.author, author.role, projectName, Math.round(author.hours / 8 / 0.5) * 0.5]);
      if (!uniqueAuthors.includes(author.author)) uniqueAuthors.push(author.author);
    });
  }

  rows.push([]);
  rows.push([
    romanize(i + 1),
    "Summary",
    "Số ngày làm thực tế\r\n実際勤務日数",
    "Số ngày được trả lương\r\n有給勤務日数",
    "Summary",
    "",
    "Ngày nghỉ\r\n休日",
    "Cross checking"
  ]);
  headerIndices.push(rows.length + 8);

  uniqueAuthors.forEach((a, i) => {
    rows.push([i + 1, a]);
  });

  ws.addTable({
    name: "MainTable",
    ref: `A8`,
    headerRow: true,
    columns: columns,
    rows: rows,
    style: { alignment: { wrapText: true } }
  });
  handleColumnsStyle(ws, columns, true, "B6D7A8", true, true);
  handleProjectRows(ws, headerIndices, uniqueAuthors);
};

let handleProjectRows = (ws, headerIndices, uniqueAuthors) => {
  headerIndices.forEach((i, index) => {
    [`A${i}`, `B${i}`, `C${i}`, `D${i}`, `E${i}`, `F${i}`, `G${i}`, `H${i}`, `I${i}`].forEach(key => {
      ws.getCell(key).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD966" }
      };

      if ((key.includes("E") || key.includes("F")) && headerIndices[index + 1]) {
        ws.getCell(key).value = {
          formula: `SUM(${key[0]}${i + 1}:${key[0]}${
            headerIndices[index + 2] ? headerIndices[index + 1] - 1 : headerIndices[index + 1] - 2
          })`
        };
        if (key.includes("F")) ws.getCell(key).numFmt = "0.00%";
        else ws.getCell(key).numFmt = "0.00";
      }
    });

    let startHeaderIndex = i + 1;
    let endHeaderIndex = headerIndices[index + 2] ? headerIndices[index + 1] - 1 : headerIndices[index + 1] - 2;
    for (let j = startHeaderIndex; j <= endHeaderIndex; j++) {
      ws.getCell(`F${j}`).value = {
        formula: `E${j}/$F$6`
      };
      ws.getCell(`F${j}`).numFmt = "0.00%";
      ws.getCell(`E${j}`).numFmt = "0.0";
    }
  });
  let lastHeaderIndex = headerIndices.at(-1);
  ws.mergeCells(`E${lastHeaderIndex}:F${lastHeaderIndex}`);
  ws.getCell(`E${lastHeaderIndex}`).alignment = { horizontal: "center" };
  ws.getCell(`H${lastHeaderIndex}`).alignment = { horizontal: "right" };

  uniqueAuthors.forEach((author, index) => {
    let curRow = lastHeaderIndex + index + 1;
    ws.getCell(`E${curRow}`).value = {
      formula: `SUMIF($B$1:$B$${lastHeaderIndex - 2}, B${curRow}, $E$1:$E$${lastHeaderIndex - 2}) + SUMIF($B$1:$B$${
        lastHeaderIndex - 2
      }, B${curRow}, $G$1:$G$${lastHeaderIndex - 2})`
    };
    ws.getCell(`E${curRow}`).numFmt = "0.0";

    ws.getCell(`F${curRow}`).value = {
      formula: `SUMIF($B$10:$B$${lastHeaderIndex - 2},B${curRow},$F$10:$F$${lastHeaderIndex - 2})`
    };
    ws.getCell(`F${curRow}`).numFmt = "0.00%";

    ws.getCell(`G${curRow}`).value = {
      formula: `D${curRow}-C${curRow}`
    };
    ws.getCell(`G${curRow}`).numFmt = "0.0";

    ws.getCell(`H${curRow}`).value = {
      formula: `IF(C${curRow}=E${curRow},"OK","<>")`
    };
    ws.getCell(`H${curRow}`).alignment = { horizontal: "right" };
  });
};

var columnWidthOffset = 0.83;

function romanize(num) {
  if (isNaN(num)) return NaN;
  var digits = String(+num).split(""),
    key = [
      "",
      "C",
      "CC",
      "CCC",
      "CD",
      "D",
      "DC",
      "DCC",
      "DCCC",
      "CM",
      "",
      "X",
      "XX",
      "XXX",
      "XL",
      "L",
      "LX",
      "LXX",
      "LXXX",
      "XC",
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX"
    ],
    roman = "",
    i = 3;
  while (i--) roman = (key[+digits.pop() + i * 10] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}
