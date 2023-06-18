const _ = require("lodash");
const IssueUtils = require("../utils/issue.util");
const BUG_TYPE = "Bug";
class QcdKpi {
  totalIssues = 0;
  quality = {
    bugRatioByNumber: {
      count: 0,
      total: 0
    },
    bugRatioByHour: {
      bugHour: 0,
      issueHour: 0
    },
    degrate: {
      count: 0,
      total: 0
    }
  };
  cost = {
    actualManhour: 0,
    estimateManhour: 0
  };
  delivery = {
    issueBeforeDuedate: 0,
    totalIssue: 0
  };
  constructor(issueListInput) {
    let issuesList = _.cloneDeep(issueListInput);
    this.totalIssues = issuesList.length;
    this.totalTimeSpent = IssueUtils.getTotalTimeSpentAllIssuesInDuration(issuesList);
    this.setQuality(issuesList);
    this.setDelivery(issuesList);
    this.setCost(issuesList);
    this.setCostTabHour(issuesList);
  }

  setQuality(issuesList) {
    this.quality.bugRatioByNumber = {
      total: this.totalIssues,
      count: issuesList.filter(issue => issue.fields.issuetype.name == BUG_TYPE).length
    };
    this.quality.bugRatioByHour = {
      bugHour: IssueUtils.totalTimeSpentForBug(issuesList),
      issueHour: this.totalTimeSpent
    };
    this.quality.degrate = {
      total: this.totalIssues,
      count: IssueUtils.getListIssueDegrate(issuesList).length
    };
    this.quality.degradationByHour = {
      issueHour: this.totalTimeSpent,
      degradationHour: IssueUtils.totalTimeSpentForDegradation(issuesList)
    };
  }
  setDelivery(issuesList) {
    this.delivery = {
      issueBeforeDuedate: this.totalIssues - IssueUtils.getIssuesBehindSchedule(issuesList).count,
      totalIssue: this.totalIssues
    };
  }

  setCost(issuesList) {
    this.cost = {
      actualManhour: this.totalTimeSpent,
      estimateManhour: IssueUtils.getEstimatedHour(issuesList)
    };
  }

  setCostTabHour(issuesList) {
    this.costTabHour = {
      actualManhour: this.totalTimeSpent,
      estimateManhour: IssueUtils.getEstimatedSecondTabHour(issuesList)
    };
  }
}

module.exports = QcdKpi;
