const moment = require("moment");
const { writeDataToExcel } = require("../service/excel/index.js");
const FORMAT_DATE = "YYYY/MM/DD";
const IssueUtil = require("../utils/issue.util");

class QcdOriginExport {
  getQcdOrigin(issueOrigin, duration) {
    const { fields } = issueOrigin;
    const parentTask = IssueUtil.getParentTask(issueOrigin);

    let issue = {
      bugType: fields.customfield_10100 ? fields.customfield_10100.value : "",
      currentStatus: fields.status.name,
      degrate: fields.customfield_11130 ? fields.customfield_11130.value : "",
      issueId: parseInt(issueOrigin.id),
      parentIssueKey: parentTask.key,
      parentIssueType: parentTask.name,
      key: issueOrigin.key,
      created: moment(fields.created).format(FORMAT_DATE)
    };

    issue.lastUpdatedWithinDuration = IssueUtil.getDateLastUpdatedInDuration(issueOrigin);
    issue.answerDueDate = fields.duedate ? moment(fields.duedate).format(FORMAT_DATE) : "";
    issue.actualFinishedDate = IssueUtil.getActualFinishDate(issueOrigin);
    issue.issueName = fields.summary;
    issue.issueType = fields.issuetype ? fields.issuetype.name : "";
    const { originalEstimateSeconds, remainingEstimateSeconds } = fields.timetracking;
    issue.originalEstimate = originalEstimateSeconds ? Math.round((originalEstimateSeconds / 3600) * 100) / 100 : 0;
    issue.remainingEstimate = remainingEstimateSeconds ? Math.round((remainingEstimateSeconds / 3600) * 100) / 100 : 0;
    issue.timeSpent = +(IssueUtil.sumOriginTimeSpentByWorklog(issueOrigin) / 3600).toFixed(2); // TODO:  Get time spent of issue

    const { originalEstimate, timeSpent } = issue;
    issue.workRatio = originalEstimate && timeSpent ? +(timeSpent / originalEstimate).toFixed(2) * 100 : 0;
    return issue;
  }

  excelExporter(listIssues) {
    let columns = [
      {
        cell: "A1",
        name: "Bug Type",
        width: 17
      },
      {
        cell: "B1",
        name: "Current Status",
        width: 17
      },
      {
        cell: "C1",
        name: "Degrate",
        width: 8
      },
      {
        cell: "D1",
        name: "Issue ID",
        width: 8
      },
      {
        cell: "E1",
        name: "Parent Issue Key",
        width: 15
      },
      {
        cell: "F1",
        name: "Parent Issue Type",
        width: 15
      },
      {
        cell: "G1",
        name: "キー",
        width: 7
      },
      {
        cell: "H1",
        name: "Created (MM/dd/yyyy) (月/日/年)",
        width: 25
      },
      {
        name: "Last updated within duration",
        cell: "I1",
        width: 20
      },
      {
        cell: "J1",
        name: "期日 (月/日/年)",
        width: 12
      },
      {
        cell: "K1",
        name: "解決日 (MM/dd/yyyy) (月/日/年)",
        width: 25
      },
      {
        cell: "L1",
        name: "要約",
        width: 80
      },
      {
        cell: "M1",
        name: "課題タイプ",
        width: 16
      },
      {
        cell: "N1",
        name: "Original Estimate (合計)",
        width: 35
      },
      {
        cell: "O1",
        name: "Remaining Estimate (合計)",
        width: 35
      },
      {
        cell: "P1",
        name: "Time Spent (合計)",
        width: 30
      },
      {
        cell: "Q1",
        name: "作業比率 (合計)",
        width: 14
      }
    ];

    return writeDataToExcel(listIssues, columns);
  }
}

class QcdSummaryExport {
  getQcdSumarry(originIssue) {
    const { fields } = originIssue;
    const originalEstimateSeconds = IssueUtil.sumEstimteTimeSpentBy(originIssue);
    const timeSpentSeconds = IssueUtil.sumSummaryTimeSpentByWorklog(originIssue);
    const BUG = "Bug";

    let issue = {
      type: fields.issuetype.name,
      key: originIssue.key,
      issueName: fields.summary,
      assignee: fields.assignee ? fields.assignee.displayName : "",
      status: fields.status.name,
      degrate: fields.customfield_11130 ? fields.customfield_11130.value : "",
      issueCreatedDate: moment(fields.created).format(FORMAT_DATE)
    };

    issue.answerDueDate = fields.duedate ? moment(fields.duedate).format(FORMAT_DATE) : "";
    issue.actualFinishedDate = IssueUtil.getSummaryActualFinishDate(originIssue);

    // Difference date
    if (issue.actualFinishedDate && issue.answerDueDate) {
      var actual = moment(new Date(issue.actualFinishedDate.substring(0, 10)));
      var answer = moment(new Date(issue.answerDueDate));
      issue.differenceDate = actual.diff(answer, "days");
    } else {
      issue.differenceDate = "";
    }

    issue.progress = IssueUtil.getSummaryProgress(issue.answerDueDate, issue.actualFinishedDate);
    issue.planManhour = +(originalEstimateSeconds / 3600).toFixed(2) || "";
    issue.actualManhour = +(timeSpentSeconds / 3600).toFixed(2) || "";

    if (issue.planManhour && issue.actualManhour) {
      issue.differenceManhour = +(issue.planManhour - issue.actualManhour).toFixed(2);
    } else {
      issue.differenceManhour = "";
    }

    issue.relatedResourceForFixBug = 0; // TODO:  HERE with guide below
    issue.bugRatio = issue.relatedResourceForFixBug
      ? ((issue.relatedResourceForFixBug / issue.totalManhour) * 100).toFixed(2) + "%"
      : 0 + "%";
    issue.manhourForBug = fields.issuetype.name == BUG ? IssueUtil.totalTimeSpentForBug([originIssue]) : 0;
    issue.totalJugementLevel = "";
    issue.lastUpdatedWithinDuration = IssueUtil.getDateLastUpdatedInDuration(originIssue);

    return issue;
  }

  getDataAndColumns(listIssues) {
    let columns = [
      {
        name: "No",
        cell: "A1",
        width: 4
      },
      {
        name: "Type",
        cell: "B1",
        width: 12
      },
      {
        name: "Issue key",
        cell: "C1",
        width: 9
      },
      {
        name: "Issue name",
        cell: "D1",
        width: 55
      },
      {
        name: "Assignee",
        cell: "E1",
        width: 15
      },
      {
        name: "Status",
        cell: "F1",
        width: 15
      },
      {
        name: "Degrate",
        cell: "G1",
        width: 15
      },
      {
        name: "Issue create date",
        cell: "H1",
        width: 15
      },

      {
        name: "Answer due date",
        cell: "I1",
        width: 15
      },
      {
        name: "Actual finished date",
        cell: "J1",
        width: 15
      },
      {
        name: "Difference date",
        cell: "K1",
        width: 15
      },
      {
        name: "Progress",
        cell: "L1",
        width: 15
      },
      {
        name: "Plan man hour",
        cell: "M1",
        width: 15
      },
      {
        name: "Actual man hour",
        cell: "N1",
        width: 15
      },
      {
        name: "Difference man hour",
        cell: "O1",
        width: 15
      },
      {
        name: "Resource to fix related bugs",
        cell: "P1",
        width: 15
      },

      {
        name: "Bug ratio (Resource to fix related bugs/Total man hour)",
        cell: "Q1",
        width: 15
      },
      {
        name: "Man hours for bugs",
        cell: "R1",
        width: 15
      },
      {
        name: "Total jugement level",
        cell: "S1",
        width: 20
      },
      {
        name: "Last updated within duration",
        cell: "T1",
        width: 20
      }
    ];

    listIssues = listIssues.map((item, index) => {
      let clone = {
        no: index + 1,
        type: item.type,
        key: item.key,
        issueName: item.issueName,
        assignee: item.assignee,
        status: item.status,
        degrate: item.degrate,
        issueCreatedDate: item.issueCreatedDate,
        answerDueDate: item.answerDueDate,
        actualFinishedDate: item.actualFinishedDate,
        differenceDate: item.differenceDate,
        progress: item.progress,

        planManhour: item.planManhour,
        actualManhour: item.actualManhour,
        differenceManhour: item.differenceManhour,

        relatedResourceForFixBug: item.relatedResourceForFixBug,
        bugRatio: item.bugRatio,
        manhourForBug: item.manhourForBug,
        totalJugementLevel: item.totalJugementLevel,
        lastUpdatedWithinDuration: item.lastUpdatedWithinDuration
      };
      return clone;
    });
    return { data: listIssues, columns: columns };
  }

  excelExporter(listIssues) {
    let { data, columns } = this.getDataAndColumns(listIssues);
    return writeDataToExcel(data, columns);
  }
}

module.exports = {
  QcdOriginExport,
  QcdSummaryExport
};
